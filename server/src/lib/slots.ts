// Расчёт свободных слотов — единственная нетривиальная логика бэкенда.
// Из расписания доступности (регулярные блоки по дням недели + исключения на дату)
// и длительности встречи режем рабочие окна на слоты, переводим локальное время
// расписания в UTC, вычитаем занятые брони и группируем по датам.
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

export type WeekDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'

/** Регулярный блок доступности (повторяется в указанные дни недели). */
export interface AvailabilityBlock {
  days: WeekDay[]
  /** HH:MM в таймзоне расписания. */
  startTime: string
  /** HH:MM в таймзоне расписания. */
  endTime: string
}

/** Исключение на конкретную дату — заменяет регулярные блоки в этот день. */
export interface DateOverride {
  /** YYYY-MM-DD. */
  date: string
  /** Полностью закрытый день — слотов нет. */
  closed?: boolean
  startTime?: string
  endTime?: string
}

/** Свободный слот (моменты в UTC, ISO 8601). */
export interface Slot {
  start: string
  end: string
}

/** Занятый интервал (существующая бронь). */
export interface BusyInterval {
  start: Date
  end: Date
}

export interface ComputeSlotsInput {
  availability: AvailabilityBlock[]
  overrides?: DateOverride[]
  /** IANA-таймзона расписания, напр. "Europe/Moscow". */
  scheduleTimeZone: string
  lengthInMinutes: number
  /** Начало диапазона (включительно), YYYY-MM-DD. */
  rangeStart: string
  /** Конец диапазона (включительно), YYYY-MM-DD. */
  rangeEnd: string
  /** Занятые интервалы — слоты, пересекающиеся с ними, исключаются. */
  busy?: BusyInterval[]
  /** Таймзона для группировки результата по датам (по умолчанию — таймзона расписания). */
  outputTimeZone?: string
  /** Текущий момент — слоты в прошлом отбрасываются. */
  now?: Date
}

// 0=Воскресенье … 6=Суббота (dayjs.day()) → имя дня недели.
const WEEKDAY_BY_INDEX: WeekDay[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

/** "HH:MM" → минуты от начала суток. */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Рабочие окна (в минутах от начала суток) для конкретной даты. */
function windowsForDate(
  date: string,
  weekday: WeekDay,
  availability: AvailabilityBlock[],
  overrides: DateOverride[],
): Array<{ start: number; end: number }> {
  const override = overrides.find((o) => o.date === date)
  if (override) {
    // Закрытый день или исключение без времён → нет окон.
    if (override.closed || !override.startTime || !override.endTime) return []
    return [{ start: toMinutes(override.startTime), end: toMinutes(override.endTime) }]
  }
  return availability
    .filter((block) => block.days.includes(weekday))
    .map((block) => ({ start: toMinutes(block.startTime), end: toMinutes(block.endTime) }))
}

function overlapsBusy(startMs: number, endMs: number, busy: BusyInterval[]): boolean {
  return busy.some((b) => startMs < b.end.getTime() && b.start.getTime() < endMs)
}

/**
 * Свободные слоты за диапазон дат, сгруппированные по дате (ключ YYYY-MM-DD в
 * `outputTimeZone`). Слоты в прошлом и пересекающиеся с занятыми интервалами исключаются.
 */
export function computeSlots(input: ComputeSlotsInput): Record<string, Slot[]> {
  const {
    availability,
    overrides = [],
    scheduleTimeZone,
    lengthInMinutes,
    rangeStart,
    rangeEnd,
    busy = [],
    now = new Date(),
  } = input
  const outputTimeZone = input.outputTimeZone ?? scheduleTimeZone
  // Защита: без положительного шага цикл нарезки слотов не завершается (бесконечный цикл,
  // подвешивающий event-loop). Некорректная длительность → слотов нет.
  if (lengthInMinutes <= 0) return {}
  const lengthMs = lengthInMinutes * 60_000
  const result: Record<string, Slot[]> = {}

  // Идём по локальным датам расписания, захватывая по дню с краёв: слот может попасть
  // в другую календарную дату при выводе в иной таймзоне.
  let cursor = dayjs.tz(rangeStart, scheduleTimeZone).subtract(1, 'day')
  const last = dayjs.tz(rangeEnd, scheduleTimeZone).add(1, 'day')

  for (; !cursor.isAfter(last, 'day'); cursor = cursor.add(1, 'day')) {
    const date = cursor.format('YYYY-MM-DD')
    const weekday = WEEKDAY_BY_INDEX[cursor.day()]
    const windows = windowsForDate(date, weekday, availability, overrides)

    for (const window of windows) {
      for (let t = window.start; t + lengthInMinutes <= window.end; t += lengthInMinutes) {
        const hh = String(Math.floor(t / 60)).padStart(2, '0')
        const mm = String(t % 60).padStart(2, '0')
        const startLocal = dayjs.tz(`${date}T${hh}:${mm}`, scheduleTimeZone)
        const startMs = startLocal.valueOf()
        const endMs = startMs + lengthMs

        if (startMs < now.getTime()) continue
        if (overlapsBusy(startMs, endMs, busy)) continue

        // Ключ группировки — календарная дата слота в таймзоне вывода.
        const key = dayjs(startMs).tz(outputTimeZone).format('YYYY-MM-DD')
        if (key < rangeStart || key > rangeEnd) continue

        ;(result[key] ??= []).push({
          start: new Date(startMs).toISOString(),
          end: new Date(endMs).toISOString(),
        })
      }
    }
  }

  return result
}
