import { describe, it, expect } from 'vitest'
import { computeSlots, type ComputeSlotsInput } from './slots.ts'

// Фиксируем «сейчас» глубоко в прошлом относительно тестовых дат, чтобы фильтр
// прошедших слотов не мешал (кроме теста, который его проверяет отдельно).
const PAST_NOW = new Date('2026-07-01T00:00:00Z')

const WORKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

function base(overrides: Partial<ComputeSlotsInput> = {}): ComputeSlotsInput {
  return {
    availability: [{ days: [...WORKDAYS], startTime: '09:00', endTime: '18:00' }],
    scheduleTimeZone: 'Europe/Moscow',
    lengthInMinutes: 30,
    rangeStart: '2026-07-06', // понедельник
    rangeEnd: '2026-07-06',
    now: PAST_NOW,
    ...overrides,
  }
}

describe('computeSlots', () => {
  it('режет рабочее окно на слоты по длительности', () => {
    const slots = computeSlots(base())['2026-07-06']
    // 09:00–18:00 = 9ч = 18 слотов по 30 мин
    expect(slots).toHaveLength(18)
  })

  it('переводит локальное время расписания в UTC', () => {
    const slots = computeSlots(base())['2026-07-06']
    // 09:00 MSK = 06:00 UTC
    expect(slots[0]).toEqual({
      start: '2026-07-06T06:00:00.000Z',
      end: '2026-07-06T06:30:00.000Z',
    })
    // последний слот начинается в 17:30 MSK = 14:30 UTC
    expect(slots.at(-1)!.start).toBe('2026-07-06T14:30:00.000Z')
  })

  it('в выходной без блоков доступности слотов нет', () => {
    const result = computeSlots(base({ rangeStart: '2026-07-05', rangeEnd: '2026-07-05' })) // вс
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('исключение на дату заменяет регулярное расписание', () => {
    const result = computeSlots(
      base({ overrides: [{ date: '2026-07-06', startTime: '10:00', endTime: '12:00' }] }),
    )
    const slots = result['2026-07-06']
    // 10:00–12:00 = 4 слота
    expect(slots).toHaveLength(4)
    expect(slots[0].start).toBe('2026-07-06T07:00:00.000Z') // 10:00 MSK
  })

  it('вычитает слоты, пересекающиеся с занятыми бронями', () => {
    const result = computeSlots(
      base({
        busy: [
          {
            start: new Date('2026-07-06T06:00:00Z'), // 09:00 MSK
            end: new Date('2026-07-06T06:30:00Z'),
          },
        ],
      }),
    )
    const slots = result['2026-07-06']
    expect(slots).toHaveLength(17)
    expect(slots[0].start).toBe('2026-07-06T06:30:00.000Z') // 09:30 MSK
  })

  it('отбрасывает слоты в прошлом', () => {
    const result = computeSlots(base({ now: new Date('2026-07-06T07:30:00Z') })) // 10:30 MSK
    const slots = result['2026-07-06']
    // остаются слоты начиная с 10:30 MSK (07:30 UTC): 10:30..17:30 = 15 слотов
    expect(slots[0].start).toBe('2026-07-06T07:30:00.000Z')
    expect(slots).toHaveLength(15)
  })

  it('не создаёт хвостовой слот, не влезающий в окно целиком', () => {
    const result = computeSlots(
      base({
        availability: [{ days: [...WORKDAYS], startTime: '09:00', endTime: '10:00' }],
        lengthInMinutes: 45,
      }),
    )
    // 09:00–10:00, шаг 45 → только один слот 09:00–09:45
    expect(result['2026-07-06']).toHaveLength(1)
  })

  it('группирует слоты по нескольким дням диапазона', () => {
    const result = computeSlots(base({ rangeStart: '2026-07-06', rangeEnd: '2026-07-08' }))
    expect(Object.keys(result).sort()).toEqual(['2026-07-06', '2026-07-07', '2026-07-08'])
  })

  it('закрытый день (override closed) не даёт слотов', () => {
    const result = computeSlots(base({ overrides: [{ date: '2026-07-06', closed: true }] }))
    expect(Object.keys(result)).toHaveLength(0)
  })
})
