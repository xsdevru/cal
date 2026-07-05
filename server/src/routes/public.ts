// Публичная страница бронирования — то, что видит гость по расшаренной ссылке.
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../db.ts'
import { toEventType, toPublicUser } from '../lib/serialize.ts'
import { notFound } from '../lib/http.ts'

export const publicRoutes = {
  // GET /{username} — профиль владельца: список видимых типов встреч.
  async PublicBookingPage_profile(req: FastifyRequest, reply: FastifyReply) {
    const { username } = req.params as { username: string }
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return notFound(reply, 'Пользователь не найден')

    const rows = await prisma.eventType.findMany({
      where: { userId: user.id, hidden: false },
    })
    return { items: rows.map(toEventType) }
  },

  // GET /{username}/{slug} — страница бронирования конкретного типа встречи.
  async PublicBookingPage_eventPage(req: FastifyRequest, reply: FastifyReply) {
    const { username, slug } = req.params as { username: string; slug: string }
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return notFound(reply, 'Пользователь не найден')

    const eventType = await prisma.eventType.findFirst({
      where: { userId: user.id, slug, hidden: false },
    })
    if (!eventType) return notFound(reply, 'Тип встречи не найден')

    return { user: toPublicUser(user), eventType: toEventType(eventType) }
  },
}
