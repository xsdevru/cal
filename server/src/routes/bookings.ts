// Ресурс /bookings — список/чтение для владельца, создание (публичное), перенос, отмена.
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../db.ts'
import { newId, newUid } from '../lib/ids.ts'
import { toBooking, toJson } from '../lib/serialize.ts'
import { getOwner } from '../lib/owner.ts'
import { isSlotAvailable } from '../lib/availability.ts'
import { fail, notFound } from '../lib/http.ts'

interface Attendee {
  name: string
  email: string
  timeZone: string
  language?: string
  phoneNumber?: string
}

interface CreateBookingBody {
  start: string
  eventTypeId: string
  attendee: Attendee
  guests?: string[]
  location?: unknown
  metadata?: Record<string, string>
}

interface RescheduleBody {
  start: string
  reason?: string
}

export const bookingRoutes = {
  async Bookings_list(req: FastifyRequest) {
    const owner = await getOwner()
    const { status } = req.query as { status?: string }
    const rows = await prisma.booking.findMany({
      where: {
        eventType: { userId: owner.id },
        ...(status ? { status } : {}),
      },
      orderBy: { start: 'asc' },
    })
    return { items: rows.map(toBooking) }
  },

  async Bookings_read(req: FastifyRequest, reply: FastifyReply) {
    const { uid } = req.params as { uid: string }
    const row = await prisma.booking.findUnique({ where: { uid } })
    if (!row) return notFound(reply, 'Бронь не найдена')
    return toBooking(row)
  },

  async Bookings_create(req: FastifyRequest, reply: FastifyReply) {
    const b = req.body as CreateBookingBody
    const eventType = await prisma.eventType.findUnique({ where: { id: b.eventTypeId } })
    if (!eventType) return notFound(reply, 'Тип встречи не найден')

    // Инвариант: бронь стоит только на реальном свободном слоте владельца.
    if (!(await isSlotAvailable(eventType, b.start))) {
      return fail(reply, 409, 'Запрошенное время недоступно для брони')
    }

    const start = new Date(b.start)
    const end = new Date(start.getTime() + eventType.lengthInMinutes * 60_000)
    // Политика подтверждения типа встречи задаёт начальный статус.
    const status = eventType.confirmation === 'manual' ? 'pending' : 'accepted'

    const row = await prisma.booking.create({
      data: {
        id: newId('bkg'),
        uid: newUid(),
        title: `${eventType.title} — ${b.attendee.name}`,
        status,
        start,
        end,
        duration: eventType.lengthInMinutes,
        eventTypeId: eventType.id,
        attendee: toJson(b.attendee)!,
        guests: toJson(b.guests),
        location: toJson(b.location),
        metadata: toJson(b.metadata),
      },
    })
    return toBooking(row)
  },

  async Bookings_reschedule(req: FastifyRequest, reply: FastifyReply) {
    const { uid } = req.params as { uid: string }
    const existing = await prisma.booking.findUnique({ where: { uid } })
    if (!existing) return notFound(reply, 'Бронь не найдена')
    // Переносить можно только активную бронь.
    if (!ACTIVE_STATUSES.includes(existing.status)) {
      return fail(reply, 409, 'Перенести можно только активную бронь')
    }

    const eventType = await prisma.eventType.findUnique({
      where: { id: existing.eventTypeId },
    })
    if (!eventType) return notFound(reply, 'Тип встречи не найден')

    const { start } = req.body as RescheduleBody
    // Новое время должно быть свободным слотом; сама бронь не мешает себе (excludeUid).
    if (!(await isSlotAvailable(eventType, start, uid))) {
      return fail(reply, 409, 'Новое время недоступно для брони')
    }

    const newStart = new Date(start)
    const newEnd = new Date(newStart.getTime() + existing.duration * 60_000)
    const row = await prisma.booking.update({
      where: { uid },
      data: { start: newStart, end: newEnd },
    })
    return toBooking(row)
  },

  async Bookings_cancel(req: FastifyRequest, reply: FastifyReply) {
    const { uid } = req.params as { uid: string }
    const existing = await prisma.booking.findUnique({ where: { uid } })
    if (!existing) return notFound(reply, 'Бронь не найдена')
    // Отменить можно только активную бронь (accepted/pending).
    if (!ACTIVE_STATUSES.includes(existing.status)) {
      return fail(reply, 409, 'Отменить можно только активную бронь')
    }

    const row = await prisma.booking.update({
      where: { uid },
      data: { status: 'cancelled' },
    })
    return toBooking(row)
  },

  async Bookings_accept(req: FastifyRequest, reply: FastifyReply) {
    return resolvePending(req, reply, 'accepted')
  },

  async Bookings_reject(req: FastifyRequest, reply: FastifyReply) {
    return resolvePending(req, reply, 'rejected')
  },
}

// Активные статусы: занимают слот, допускают отмену/перенос.
export const ACTIVE_STATUSES = ['accepted', 'pending']

// accept/reject: разрешить ожидающую бронь. Валидно только из pending.
async function resolvePending(
  req: FastifyRequest,
  reply: FastifyReply,
  status: 'accepted' | 'rejected',
) {
  const { uid } = req.params as { uid: string }
  const existing = await prisma.booking.findUnique({ where: { uid } })
  if (!existing) return notFound(reply, 'Бронь не найдена')
  if (existing.status !== 'pending') {
    return fail(reply, 409, 'Подтвердить/отклонить можно только ожидающую бронь')
  }
  const row = await prisma.booking.update({ where: { uid }, data: { status } })
  return toBooking(row)
}
