// Наполнение БД демо-данными (в духе примеров @example из спеки): один владелец,
// дефолтное расписание, два типа встреч и одна бронь. Идемпотентно — чистит и создаёт заново.
// Экспортируется как seed() (используется интеграционными тестами) и запускается как
// CLI при прямом вызове `tsx server/src/seed.ts`.
import { pathToFileURL } from 'node:url'
import { prisma } from './db.ts'

const WORKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export async function seed() {
  // Чистим в порядке зависимостей.
  await prisma.booking.deleteMany()
  await prisma.eventType.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.user.deleteMany()

  const user = await prisma.user.create({
    data: {
      id: 'usr_owner',
      username: 'aleksandr',
      name: 'Александр Иванов',
      email: 'aleksandr@example.com',
      timeZone: 'Europe/Moscow',
    },
  })

  await prisma.schedule.create({
    data: {
      id: 'sch_work',
      userId: user.id,
      name: 'Рабочие часы',
      timeZone: 'Europe/Moscow',
      isDefault: true,
      availability: JSON.stringify([
        { days: WORKDAYS, startTime: '09:00', endTime: '18:00' },
      ]),
    },
  })

  const evt30 = await prisma.eventType.create({
    data: {
      id: 'evt_30min',
      userId: user.id,
      title: 'Созвон 30 минут',
      slug: '30min',
      description: 'Быстрое знакомство и обсуждение задачи',
      lengthInMinutes: 30,
      locations: JSON.stringify([{ type: 'video', integration: 'google-meet' }]),
      hidden: false,
    },
  })

  await prisma.eventType.create({
    data: {
      id: 'evt_consult',
      userId: user.id,
      title: 'Консультация 60 минут',
      slug: 'consult',
      description: 'Подробный разбор вашего проекта',
      lengthInMinutes: 60,
      locations: JSON.stringify([{ type: 'phone', phone: '+7 900 000-00-00' }]),
      hidden: false,
    },
  })

  await prisma.booking.create({
    data: {
      id: 'bkg_demo',
      uid: 'a1b2c3d4',
      title: 'Созвон 30 минут — Иван Петров',
      status: 'accepted',
      start: new Date('2026-07-10T09:00:00Z'),
      end: new Date('2026-07-10T09:30:00Z'),
      duration: 30,
      eventTypeId: evt30.id,
      attendee: JSON.stringify({
        name: 'Иван Петров',
        email: 'ivan@example.com',
        timeZone: 'Europe/Moscow',
      }),
    },
  })

}

// Прямой запуск как скрипт (не при импорте из тестов).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .then(() => {
      console.log('Seed завершён: владелец aleksandr, 1 расписание, 2 типа встреч, 1 бронь.')
      return prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
}
