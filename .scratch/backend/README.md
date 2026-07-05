# Backend — вертикальные слайсы (issues)

Ретроспективная нарезка плана **«Реальный бэкенд для `cal` (SQLite + TypeSpec)»** на
tracer-bullet задачи. Каждый слайс — тонкий сквозной путь через все слои (схема → API →
тесты/контракт → фронт).

> **Статус:** код уже реализован в `server/` и `web/` (незакоммичен). Эти issues оформлены
> ретроспективно — для истории и отслеживания, а не как открытая работа.

## Порядок и зависимости

```
01-foundation ──┬── 02-event-types-crud
                ├── 03-schedules-crud ── 04-slots ── 05-bookings
                ├── 06-public-pages
                └── 07-frontend-real-backend
```

| # | Слайс | Blocked by |
|---|-------|-----------|
| 01 | Фундамент + трейсер: spec-first бэкенд на SQLite | — |
| 02 | Event Types — полный CRUD | 01 |
| 03 | Schedules — CRUD | 01 |
| 04 | Slots — расчёт свободных слотов | 03, 01 |
| 05 | Bookings — create / read / cancel / reschedule | 04 |
| 06 | Public pages | 01 |
| 07 | Фронт на реальном бэке | 01 |
