// Доступность владельца — единый слой поверх расчёта слотов. Инкапсулирует выбор
// расписания, сбор занятого времени по ВСЕМ активным броням владельца (не по одному типу
// встречи) и проверку «запрошенное время = свободный слот». Переиспользуется роутом /slots
// и валидацией создания/переноса брони, чтобы правила доступности жили в одном месте.
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import { prisma } from '../db.ts'
import {
  computeSlots,
  type AvailabilityBlock,
  type DateOverride,
  type Slot,
} from './slots.ts'

dayjs.extend(utc)
dayjs.extend(timezone)

// Брони в этих статусах занимают время владельца; cancelled/rejected — освобождают.
const BUSY_STATUSES = ['accepted', 'pending']

interface EventTypeLike {
  userId: string
  scheduleId: string | null
  lengthInMinutes: number
}

/** Расписание типа встречи: привязанное, иначе дефолтное владельца, иначе любое. */
async function resolveSchedule(eventType: EventTypeLike) {
  if (eventType.scheduleId) {
    return prisma.schedule.findUnique({ where: { id: eventType.scheduleId } })
  }
  return (
    (await prisma.schedule.findFirst({
      where: { userId: eventType.userId, isDefault: true },
    })) ?? (await prisma.schedule.findFirst({ where: { userId: eventType.userId } }))
  )
}

/** Занятые интервалы владельца по ВСЕМ его активным броням (по всем типам встреч). */
async function ownerBusyIntervals(userId: string, excludeUid?: string) {
  const rows = await prisma.booking.findMany({
    where: {
      eventType: { userId },
      status: { in: BUSY_STATUSES },
      ...(excludeUid ? { uid: { not: excludeUid } } : {}),
    },
  })
  return rows.map((b) => ({ start: b.start, end: b.end }))
}

/** Свободные слоты типа встречи за диапазон дат (учитывает занятость всего владельца). */
export async function availableSlots(
  eventType: EventTypeLike,
  rangeStart: string,
  rangeEnd: string,
  timeZone?: string,
  excludeUid?: string,
): Promise<Record<string, Slot[]>> {
  const schedule = await resolveSchedule(eventType)
  if (!schedule) return {}
  return computeSlots({
    availability: JSON.parse(schedule.availability) as AvailabilityBlock[],
    overrides: schedule.overrides ? (JSON.parse(schedule.overrides) as DateOverride[]) : [],
    scheduleTimeZone: schedule.timeZone,
    lengthInMinutes: eventType.lengthInMinutes,
    rangeStart,
    rangeEnd,
    busy: await ownerBusyIntervals(eventType.userId, excludeUid),
    outputTimeZone: timeZone,
  })
}

/**
 * Является ли `startISO` свободным слотом типа встречи *прямо сейчас*. Используется при
 * создании (без excludeUid) и переносе брони (excludeUid — сама бронь не мешает себе).
 */
export async function isSlotAvailable(
  eventType: EventTypeLike,
  startISO: string,
  excludeUid?: string,
): Promise<boolean> {
  const schedule = await resolveSchedule(eventType)
  if (!schedule) return false
  // День слота в таймзоне расписания — считаем слоты за этот день и ищем точное совпадение.
  const day = dayjs(startISO).tz(schedule.timeZone).format('YYYY-MM-DD')
  const slots = await availableSlots(eventType, day, day, undefined, excludeUid)
  const target = new Date(startISO).toISOString()
  return Object.values(slots).some((list) => list.some((s) => s.start === target))
}
