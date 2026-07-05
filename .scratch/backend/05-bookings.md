# 05 — Bookings: create / read / cancel / reschedule

> Статус: реализовано (ретроспективный issue).

## What to build

Ресурс броней, замыкающий цикл бронирования. Гость бронирует тип встречи на конкретное
время → создаётся `Booking` с публичным `uid`. Активные брони (статусы `accepted`/`pending`)
занимают время и **вычитаются из `/slots`** (замыкает логику слайса #04); `cancel`/`reject`
освобождают слот. Начальный статус определяется политикой подтверждения типа встречи
(`auto` → `accepted`, `manual` → `pending`).

## Acceptance criteria

- [ ] `POST /bookings` создаёт бронь с `bkg_…` id и публичным коротким `uid`.
- [ ] `GET /bookings` (с фильтром `?status`) и `GET /bookings/{uid}` отдают брони.
- [ ] `POST /bookings/{uid}/cancel` переводит бронь в `cancelled`; `POST /bookings/{uid}/reschedule`
      меняет время.
- [ ] Начальный статус зависит от политики подтверждения (`auto`/`manual`).
- [ ] Активная бронь убирает соответствующий слот из `/slots`; `cancel` возвращает его.
- [ ] Интеграционные тесты (в т.ч. persist через рестарт) и `make verify-contract` зелёные.

## Blocked by

- #04 — Slots: расчёт свободных слотов.
