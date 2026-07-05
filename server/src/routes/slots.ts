// Ресурс /slots — свободные слоты типа встречи за диапазон дат (публичный).
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../db.ts'
import { notFound } from '../lib/http.ts'
import { availableSlots } from '../lib/availability.ts'

interface SlotsQuery {
  eventTypeId: string
  start: string
  end: string
  timeZone?: string
}

export const slotRoutes = {
  async Slots_list(req: FastifyRequest, reply: FastifyReply) {
    const { eventTypeId, start, end, timeZone } = req.query as SlotsQuery

    const eventType = await prisma.eventType.findUnique({ where: { id: eventTypeId } })
    if (!eventType) return notFound(reply, 'Тип встречи не найден')

    return { slots: await availableSlots(eventType, start, end, timeZone) }
  },
}
