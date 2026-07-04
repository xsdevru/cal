// Типизированный клиент к API планировщика. Запросы идут на /api,
// Vite проксирует их на мок-сервер Prism (см. vite.config.ts).

const BASE = '/api'

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export interface EventType {
  id: string
  title: string
  slug: string
  description?: string
  lengthInMinutes: number
  hidden: boolean
}

export interface Attendee {
  name: string
  email: string
  timeZone: string
  language?: string
  phoneNumber?: string
}

export interface Booking {
  id: string
  uid: string
  title: string
  status: string
  start: string
  end: string
  duration: number
  eventTypeId: string
  attendee: Attendee
}

export interface AvailabilityBlock {
  days: string[]
  startTime: string
  endTime: string
}

export interface Schedule {
  id: string
  name: string
  timeZone: string
  isDefault: boolean
  availability: AvailabilityBlock[]
}

export interface Slot {
  start: string
  end: string
}

export interface AvailableSlots {
  slots: Record<string, Slot[]>
}

export const api = {
  eventTypes: () => http<{ items: EventType[] }>('/event-types'),
  createEventType: (b: Partial<EventType>) =>
    http<EventType>('/event-types', { method: 'POST', body: JSON.stringify(b) }),
  schedules: () => http<{ items: Schedule[] }>('/schedules'),
  bookings: () => http<{ items: Booking[] }>('/bookings'),
  slots: (eventTypeId: string, start: string, end: string) =>
    http<AvailableSlots>(
      `/slots?eventTypeId=${encodeURIComponent(eventTypeId)}&start=${start}&end=${end}`,
    ),
  createBooking: (b: unknown) =>
    http<Booking>('/bookings', { method: 'POST', body: JSON.stringify(b) }),
}
