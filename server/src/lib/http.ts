// Ответы-ошибки в форме модели Error из TypeSpec: { code, message }.
import type { FastifyReply } from 'fastify'

export function fail(reply: FastifyReply, code: number, message: string) {
  reply.code(code)
  return { code, message }
}

export const notFound = (reply: FastifyReply, message: string) => fail(reply, 404, message)
export const badRequest = (reply: FastifyReply, message: string) => fail(reply, 400, message)
