import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from './app.ts'
import { seed } from './seed.ts'
import { prisma } from './db.ts'

// Интеграционные тесты гоняют реальное приложение поверх dev.db через inject() (без сети).
// beforeEach пере-сидирует БД, чтобы тесты были независимы.
let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

beforeEach(async () => {
  await seed()
})

afterAll(async () => {
  await app.close()
  await prisma.$disconnect()
})

const DATE = '2026-07-06' // понедельник, рабочий день по сид-расписанию

function slotsCount(body: { slots: Record<string, unknown[]> }): number {
  return body.slots[DATE]?.length ?? 0
}

describe('event-types', () => {
  it('GET /event-types возвращает засиженные типы', async () => {
    const res = await app.inject({ method: 'GET', url: '/event-types' })
    expect(res.statusCode).toBe(200)
    expect(res.json().items).toHaveLength(2)
  })

  it('GET /event-types/{id} для несуществующего → 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/event-types/nope' })
    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({ code: 404 })
  })

  it('POST создаёт тип встречи, он появляется в списке', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/event-types',
      payload: {
        title: 'Интервью',
        slug: 'interview',
        lengthInMinutes: 45,
        locations: [{ type: 'video', integration: 'zoom' }],
      },
    })
    expect(create.statusCode).toBe(200)
    const id = create.json().id as string
    expect(id).toMatch(/^evt_/)

    const list = await app.inject({ method: 'GET', url: '/event-types' })
    expect(list.json().items).toHaveLength(3)
  })

  it('PATCH обновляет только переданные поля', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/event-types/evt_consult',
      headers: { 'content-type': 'application/merge-patch+json' },
      payload: JSON.stringify({ title: 'Консультация 90' }),
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().title).toBe('Консультация 90')
    expect(res.json().slug).toBe('consult') // не тронуто
  })

  it('создание типа с занятым slug → 409, а не 500', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/event-types',
      payload: {
        title: 'Дубликат',
        slug: 'consult', // slug уже занят засиженным evt_consult
        lengthInMinutes: 30,
        locations: [],
      },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json()).toMatchObject({ code: 409 })
  })

  it('смена slug на занятый через PATCH → 409, а не 500', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/event-types/evt_30min',
      headers: { 'content-type': 'application/merge-patch+json' },
      payload: JSON.stringify({ slug: 'consult' }), // slug занят evt_consult
    })
    expect(res.statusCode).toBe(409)
    expect(res.json()).toMatchObject({ code: 409 })
  })
})

describe('booking lifecycle ↔ slots', () => {
  it('бронь занимает слот, отмена — освобождает', async () => {
    const url = `/slots?eventTypeId=evt_30min&start=${DATE}&end=${DATE}`

    const before = slotsCount((await app.inject({ method: 'GET', url })).json())
    expect(before).toBe(18)

    const booking = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        start: `${DATE}T06:00:00Z`,
        eventTypeId: 'evt_30min',
        attendee: { name: 'Гость', email: 'g@e.com', timeZone: 'Europe/Moscow' },
      },
    })
    expect(booking.statusCode).toBe(200)
    const uid = booking.json().uid as string

    const afterBooking = slotsCount((await app.inject({ method: 'GET', url })).json())
    expect(afterBooking).toBe(17)

    const cancel = await app.inject({ method: 'POST', url: `/bookings/${uid}/cancel` })
    expect(cancel.statusCode).toBe(200)
    expect(cancel.json().status).toBe('cancelled')

    const afterCancel = slotsCount((await app.inject({ method: 'GET', url })).json())
    expect(afterCancel).toBe(18)
  })
})

describe('публичные страницы', () => {
  it('скрытые типы встреч не попадают в публичный профиль', async () => {
    await app.inject({
      method: 'POST',
      url: '/event-types',
      payload: {
        title: 'Секретная',
        slug: 'secret',
        lengthInMinutes: 15,
        locations: [],
        hidden: true,
      },
    })
    const res = await app.inject({ method: 'GET', url: '/aleksandr' })
    const slugs = res.json().items.map((e: { slug: string }) => e.slug)
    expect(slugs).not.toContain('secret')
  })

  it('публичный профиль не отдаёт приватные поля владельца', async () => {
    const res = await app.inject({ method: 'GET', url: '/aleksandr/30min' })
    expect(res.statusCode).toBe(200)
    expect(res.json().user).not.toHaveProperty('email')
    expect(res.json().user).toMatchObject({ username: 'aleksandr' })
  })
})

const SLOT_0600 = '2026-07-06T06:00:00.000Z' // 09:00 MSK, первый слот рабочего дня
const VALID_BOOKING = {
  start: '2026-07-06T06:00:00Z',
  eventTypeId: 'evt_30min',
  attendee: { name: 'Гость', email: 'g@e.com', timeZone: 'Europe/Moscow' },
}

async function slotStarts(eventTypeId: string): Promise<string[]> {
  const res = await app.inject({
    method: 'GET',
    url: `/slots?eventTypeId=${eventTypeId}&start=2026-07-06&end=2026-07-06`,
  })
  const slots = (res.json().slots as Record<string, Array<{ start: string }>>)['2026-07-06']
  return (slots ?? []).map((s) => s.start)
}

async function setManual(eventTypeId: string) {
  await app.inject({
    method: 'PATCH',
    url: `/event-types/${eventTypeId}`,
    headers: { 'content-type': 'application/merge-patch+json' },
    payload: JSON.stringify({ confirmation: 'manual' }),
  })
}

describe('валидация брони на записи', () => {
  it('время вне окна доступности → 409', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: { ...VALID_BOOKING, start: '2026-07-06T03:00:00Z' }, // 06:00 MSK, до 09:00
    })
    expect(res.statusCode).toBe(409)
  })

  it('двойная бронь одного слота → 409', async () => {
    const first = await app.inject({ method: 'POST', url: '/bookings', payload: VALID_BOOKING })
    expect(first.statusCode).toBe(200)
    const second = await app.inject({ method: 'POST', url: '/bookings', payload: VALID_BOOKING })
    expect(second.statusCode).toBe(409)
  })

  it('перенос: невалид → 409, свободный слот и своё же время → 200', async () => {
    const b = await app.inject({ method: 'POST', url: '/bookings', payload: VALID_BOOKING })
    const uid = b.json().uid
    const bad = await app.inject({
      method: 'POST',
      url: `/bookings/${uid}/reschedule`,
      payload: { start: '2026-07-06T03:00:00Z' },
    })
    expect(bad.statusCode).toBe(409)
    const free = await app.inject({
      method: 'POST',
      url: `/bookings/${uid}/reschedule`,
      payload: { start: '2026-07-06T06:30:00Z' },
    })
    expect(free.statusCode).toBe(200)
    // self-exclusion: перенос на своё же (новое) время не конфликтует сам с собой
    const same = await app.inject({
      method: 'POST',
      url: `/bookings/${uid}/reschedule`,
      payload: { start: '2026-07-06T06:30:00Z' },
    })
    expect(same.statusCode).toBe(200)
  })
})

describe('занятость по владельцу', () => {
  it('бронь одного типа встречи убирает пересекающийся слот другого', async () => {
    expect(await slotStarts('evt_consult')).toContain(SLOT_0600)
    await app.inject({ method: 'POST', url: '/bookings', payload: VALID_BOOKING }) // evt_30min @06:00Z
    expect(await slotStarts('evt_consult')).not.toContain(SLOT_0600)
  })
})

describe('удаление типа встречи', () => {
  it('DELETE типа с активной бронью → 409, тип и бронь на месте', async () => {
    const b = await app.inject({ method: 'POST', url: '/bookings', payload: VALID_BOOKING })
    expect(b.statusCode).toBe(200)
    const uid = b.json().uid

    const del = await app.inject({ method: 'DELETE', url: '/event-types/evt_30min' })
    expect(del.statusCode).toBe(409)

    // тип встречи не удалён, бронь не потеряна каскадом
    expect((await app.inject({ method: 'GET', url: '/event-types/evt_30min' })).statusCode).toBe(200)
    expect((await app.inject({ method: 'GET', url: `/bookings/${uid}` })).statusCode).toBe(200)
  })

  it('DELETE типа без активных броней → 204', async () => {
    const del = await app.inject({ method: 'DELETE', url: '/event-types/evt_consult' })
    expect(del.statusCode).toBe(204)
  })
})

describe('политика подтверждения', () => {
  const bookConsult = {
    start: '2026-07-06T06:00:00Z',
    eventTypeId: 'evt_consult',
    attendee: { name: 'P', email: 'p@e.com', timeZone: 'Europe/Moscow' },
  }

  it('manual → бронь pending, accept → accepted', async () => {
    await setManual('evt_consult')
    const b = await app.inject({ method: 'POST', url: '/bookings', payload: bookConsult })
    expect(b.json().status).toBe('pending')
    const acc = await app.inject({ method: 'POST', url: `/bookings/${b.json().uid}/accept` })
    expect(acc.statusCode).toBe(200)
    expect(acc.json().status).toBe('accepted')
  })

  it('pending держит слот, reject освобождает', async () => {
    await setManual('evt_consult')
    const b = await app.inject({ method: 'POST', url: '/bookings', payload: bookConsult })
    expect(await slotStarts('evt_consult')).not.toContain(SLOT_0600) // pending занял
    const rej = await app.inject({ method: 'POST', url: `/bookings/${b.json().uid}/reject` })
    expect(rej.json().status).toBe('rejected')
    expect(await slotStarts('evt_consult')).toContain(SLOT_0600) // rejected освободил
  })

  it('accept не-pending (auto accepted) → 409', async () => {
    const b = await app.inject({ method: 'POST', url: '/bookings', payload: VALID_BOOKING })
    const acc = await app.inject({ method: 'POST', url: `/bookings/${b.json().uid}/accept` })
    expect(acc.statusCode).toBe(409)
  })
})

describe('расписание', () => {
  it('закрытый день (override closed) → нет слотов', async () => {
    await app.inject({
      method: 'PATCH',
      url: '/schedules/sch_work',
      headers: { 'content-type': 'application/merge-patch+json' },
      payload: JSON.stringify({ overrides: [{ date: '2026-07-07', closed: true }] }),
    })
    const res = await app.inject({
      method: 'GET',
      url: '/slots?eventTypeId=evt_30min&start=2026-07-07&end=2026-07-07',
    })
    expect(Object.keys(res.json().slots)).toHaveLength(0)
  })

  it('создание второго дефолтного снимает флаг с первого', async () => {
    await app.inject({
      method: 'POST',
      url: '/schedules',
      payload: {
        name: 'Второе',
        timeZone: 'Europe/Moscow',
        isDefault: true,
        availability: [{ days: ['Monday'], startTime: '10:00', endTime: '12:00' }],
      },
    })
    const list = await app.inject({ method: 'GET', url: '/schedules' })
    const defaults = list.json().items.filter((s: { isDefault: boolean }) => s.isDefault)
    expect(defaults).toHaveLength(1)
  })
})
