// Преобразование строк БД (где вложенные структуры хранятся как JSON-текст) в модели
// API из TypeSpec и обратно. Prisma-строки типизируем структурно, чтобы не тянуть
// сгенерированные типы клиента в чистую логику.

/** Разобрать JSON-поле; null/undefined → undefined. */
function parse<T>(value: string | null | undefined): T | undefined {
  return value == null ? undefined : (JSON.parse(value) as T)
}

/** Сериализовать значение в JSON-строку; null/undefined → SQL-null (для nullable-колонок). */
export function toJson(value: unknown): string | null {
  return value == null ? null : JSON.stringify(value)
}

interface EventTypeRow {
  id: string
  title: string
  slug: string
  description: string | null
  lengthInMinutes: number
  locations: string
  scheduleId: string | null
  hidden: boolean
  confirmation: string
  bookingFields: string | null
}

export function toEventType(row: EventTypeRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    ...(row.description != null && { description: row.description }),
    lengthInMinutes: row.lengthInMinutes,
    locations: parse<unknown[]>(row.locations) ?? [],
    ...(row.scheduleId != null && { scheduleId: row.scheduleId }),
    hidden: row.hidden,
    confirmation: row.confirmation,
    ...(row.bookingFields != null && { bookingFields: parse<unknown[]>(row.bookingFields) }),
  }
}

interface ScheduleRow {
  id: string
  name: string
  timeZone: string
  isDefault: boolean
  availability: string
  overrides: string | null
}

export function toSchedule(row: ScheduleRow) {
  return {
    id: row.id,
    name: row.name,
    timeZone: row.timeZone,
    isDefault: row.isDefault,
    availability: parse<unknown[]>(row.availability) ?? [],
    ...(row.overrides != null && { overrides: parse<unknown[]>(row.overrides) }),
  }
}

interface BookingRow {
  id: string
  uid: string
  title: string
  status: string
  start: Date
  end: Date
  duration: number
  eventTypeId: string
  attendee: string
  guests: string | null
  location: string | null
  metadata: string | null
  createdAt: Date
  updatedAt: Date
}

export function toBooking(row: BookingRow) {
  return {
    id: row.id,
    uid: row.uid,
    title: row.title,
    status: row.status,
    start: row.start.toISOString(),
    end: row.end.toISOString(),
    duration: row.duration,
    eventTypeId: row.eventTypeId,
    attendee: parse<unknown>(row.attendee),
    ...(row.guests != null && { guests: parse<string[]>(row.guests) }),
    ...(row.location != null && { location: parse<unknown>(row.location) }),
    ...(row.metadata != null && { metadata: parse<Record<string, string>>(row.metadata) }),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function toPublicUser(row: { username: string; name: string; timeZone: string }) {
  return { username: row.username, name: row.name, timeZone: row.timeZone }
}
