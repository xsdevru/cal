// Единый экземпляр PrismaClient. Prisma 7 подключается к SQLite через driver adapter;
// путь к файлу БД берётся из DATABASE_URL (.env), по умолчанию — ./dev.db в корне репо.
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../generated/prisma/client.ts'

// Node не грузит .env автоматически — подхватываем вручную (если файл есть).
try {
  process.loadEnvFile(new URL('../../.env', import.meta.url))
} catch {
  // .env отсутствует — используем значения по умолчанию
}

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url })

export const prisma = new PrismaClient({ adapter })
