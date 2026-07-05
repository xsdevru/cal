// В MVP владелец один. Админские ручки работают от его лица.
import { prisma } from '../db.ts'

export async function getOwner() {
  const owner = await prisma.user.findFirst()
  if (!owner) throw new Error('Нет владельца в БД — запустите наполнение: make seed')
  return owner
}
