// Типизированный клиент к API планировщика. Запросы идут на /api, Vite проксирует их
// на реальный бэкенд (:3000, см. vite.config.ts). Типы больше не дублируются вручную —
// они сгенерированы из TypeSpec/OpenAPI в api-types.ts (обновляются командой `make types`).
import type { components } from './api-types'

type Schemas = components['schemas']

export type EventType = Schemas['EventType']
export type Attendee = Schemas['Attendee']
export type Booking = Schemas['Booking']
export type Schedule = Schemas['Schedule']
export type AvailabilityBlock = Schemas['AvailabilityBlock']
export type Slot = Schemas['Slot']
export type PublicUser = Schemas['PublicUser']
export type PublicEventPage = Schemas['PublicEventPage']

// В спеке slots — это Record<Slot[]> (ключ-дата → слоты), но openapi-typescript
// рендерит unevaluatedProperties как Record<string, never>. Переопределяем корректно.
export type AvailableSlots = { slots: Record<string, Slot[]> }

const BASE = '/api'

/** Ошибка API с HTTP-статусом — чтобы UI отличал 409 (слот недоступен) от прочего. */
export class ApiError extends Error {
  status: number
  constructor(status: number, message?: string) {
    super(message ?? `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  // Content-Type ставим только когда есть тело: пустой POST с application/json Fastify
  // отклоняет как FST_ERR_CTP_EMPTY_JSON_BODY (400) — ломало accept/reject брони.
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      ...(init?.body != null ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) throw new ApiError(res.status)
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

const post = (path: string) => http<Booking>(path, { method: 'POST' })

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
  acceptBooking: (uid: string) => post(`/bookings/${encodeURIComponent(uid)}/accept`),
  rejectBooking: (uid: string) => post(`/bookings/${encodeURIComponent(uid)}/reject`),
  publicEventPage: (username: string, slug: string) =>
    http<PublicEventPage>(
      `/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`,
    ),
}
