// Ресурс /event-types — CRUD типов встреч владельца.
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../db.ts'
import { newId } from '../lib/ids.ts'
import { toEventType, toJson } from '../lib/serialize.ts'
import { getOwner } from '../lib/owner.ts'
import { badRequest, notFound } from '../lib/http.ts'

interface EventTypeBody {
  title?: string
  slug?: string
  description?: string
  lengthInMinutes?: number
  locations?: unknown[]
  scheduleId?: string
  hidden?: boolean
  confirmation?: string
  bookingFields?: unknown[]
}

export const eventTypeRoutes = {
  async EventTypes_list() {
    const owner = await getOwner()
    const rows = await prisma.eventType.findMany({ where: { userId: owner.id } })
    return { items: rows.map(toEventType) }
  },

  async EventTypes_read(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string }
    const row = await prisma.eventType.findUnique({ where: { id } })
    if (!row) return notFound(reply, 'Тип встречи не найден')
    return toEventType(row)
  },

  async EventTypes_create(req: FastifyRequest, reply: FastifyReply) {
    const owner = await getOwner()
    const b = req.body as EventTypeBody
    // Длительность должна быть положительной, иначе расчёт слотов зациклится (см. slots.ts).
    if ((b.lengthInMinutes ?? 0) < 1) {
      return badRequest(reply, 'Длительность встречи должна быть не меньше 1 минуты')
    }
    const row = await prisma.eventType.create({
      data: {
        id: newId('evt'),
        userId: owner.id,
        title: b.title!,
        slug: b.slug!,
        description: b.description ?? null,
        lengthInMinutes: b.lengthInMinutes!,
        locations: toJson(b.locations ?? [])!,
        scheduleId: b.scheduleId ?? null,
        hidden: b.hidden ?? false,
        confirmation: b.confirmation ?? 'auto',
        bookingFields: toJson(b.bookingFields),
      },
    })
    return toEventType(row)
  },

  async EventTypes_update(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string }
    if (!(await prisma.eventType.findUnique({ where: { id } }))) {
      return notFound(reply, 'Тип встречи не найден')
    }
    const b = req.body as EventTypeBody
    if (b.lengthInMinutes !== undefined && b.lengthInMinutes < 1) {
      return badRequest(reply, 'Длительность встречи должна быть не меньше 1 минуты')
    }
    const data: Record<string, unknown> = {}
    if (b.title !== undefined) data.title = b.title
    if (b.slug !== undefined) data.slug = b.slug
    if (b.description !== undefined) data.description = b.description
    if (b.lengthInMinutes !== undefined) data.lengthInMinutes = b.lengthInMinutes
    if (b.locations !== undefined) data.locations = toJson(b.locations)
    if (b.scheduleId !== undefined) data.scheduleId = b.scheduleId
    if (b.hidden !== undefined) data.hidden = b.hidden
    if (b.confirmation !== undefined) data.confirmation = b.confirmation
    if (b.bookingFields !== undefined) data.bookingFields = toJson(b.bookingFields)
    const row = await prisma.eventType.update({ where: { id }, data })
    return toEventType(row)
  },

  async EventTypes_delete(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string }
    try {
      await prisma.eventType.delete({ where: { id } })
    } catch {
      return notFound(reply, 'Тип встречи не найден')
    }
    reply.code(204)
  },
}
