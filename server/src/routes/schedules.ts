// Ресурс /schedules — CRUD расписаний доступности владельца.
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../db.ts'
import { newId } from '../lib/ids.ts'
import { toSchedule, toJson } from '../lib/serialize.ts'
import { getOwner } from '../lib/owner.ts'
import { notFound } from '../lib/http.ts'

interface ScheduleBody {
  name?: string
  timeZone?: string
  isDefault?: boolean
  availability?: unknown[]
  overrides?: unknown[]
}

export const scheduleRoutes = {
  async Schedules_list() {
    const owner = await getOwner()
    const rows = await prisma.schedule.findMany({ where: { userId: owner.id } })
    return { items: rows.map(toSchedule) }
  },

  async Schedules_read(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string }
    const row = await prisma.schedule.findUnique({ where: { id } })
    if (!row) return notFound(reply, 'Расписание не найдено')
    return toSchedule(row)
  },

  async Schedules_create(req: FastifyRequest) {
    const owner = await getOwner()
    const b = req.body as ScheduleBody
    const row = await prisma.$transaction(async (tx) => {
      // Инвариант: у владельца не больше одного дефолтного расписания.
      if (b.isDefault) {
        await tx.schedule.updateMany({
          where: { userId: owner.id, isDefault: true },
          data: { isDefault: false },
        })
      }
      return tx.schedule.create({
        data: {
          id: newId('sch'),
          userId: owner.id,
          name: b.name!,
          timeZone: b.timeZone!,
          isDefault: b.isDefault ?? false,
          availability: toJson(b.availability ?? [])!,
          overrides: toJson(b.overrides),
        },
      })
    })
    return toSchedule(row)
  },

  async Schedules_update(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string }
    const existing = await prisma.schedule.findUnique({ where: { id } })
    if (!existing) return notFound(reply, 'Расписание не найдено')

    const b = req.body as ScheduleBody
    const data: Record<string, unknown> = {}
    if (b.name !== undefined) data.name = b.name
    if (b.timeZone !== undefined) data.timeZone = b.timeZone
    if (b.isDefault !== undefined) data.isDefault = b.isDefault
    if (b.availability !== undefined) data.availability = toJson(b.availability)
    if (b.overrides !== undefined) data.overrides = toJson(b.overrides)

    const row = await prisma.$transaction(async (tx) => {
      // Инвариант: не больше одного дефолтного расписания у владельца.
      if (data.isDefault === true) {
        await tx.schedule.updateMany({
          where: { userId: existing.userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        })
      }
      return tx.schedule.update({ where: { id }, data })
    })
    return toSchedule(row)
  },

  async Schedules_delete(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string }
    try {
      await prisma.schedule.delete({ where: { id } })
    } catch {
      return notFound(reply, 'Расписание не найдено')
    }
    reply.code(204)
  },
}
