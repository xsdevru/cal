# 01 — Фундамент + трейсер: spec-first бэкенд на SQLite

> Статус: реализовано (ретроспективный issue).

## What to build

Заменить Prism-мок настоящим бэкендом, подняв весь spec-first конвейер на минимальном
сквозном пути. TypeSpec остаётся источником истины: из `openapi.yaml` поднимаются роуты и
валидация (`fastify-openapi-glue`) и генерируются общие TS-типы. БД — SQLite через Prisma.

Сквозной трейсер, доказывающий, что весь стек живой: `GET /event-types` и
`GET /event-types/{id}` отдают данные из SQLite, фронтовый список типов встреч загружается
с реального бэкенда (`:3000`), а не из мока.

Входит:
- Prisma `datasource` → `sqlite` (`DATABASE_URL="file:./dev.db"`), модели `User` и `EventType`
  (вложенные структуры — JSON-колонки), миграция.
- Бутстрап Fastify + `fastify-openapi-glue`: методы `service.ts` названы по `operationId`
  из спеки; особенности связки OpenAPI 3.1 ↔ Fastify (нестрогий Ajv, снятие `readOnly` из
  `required`, сериализация ответов) — задокументированы в коде.
- Сид владельца и демо-типов встреч (данные согласованы с `@example`).
- Генерация общих типов из OpenAPI (`make types`).
- Makefile-цели: `server`, `seed`, `types`, `verify-contract`.
- `web/vite.config.ts`: прокси `/api` → `http://localhost:3000` (Prism остаётся под `make mock`).

## Acceptance criteria

- [ ] `make server` поднимает Fastify на `:3000`; роуты подняты из `openapi.yaml`.
- [ ] `make seed` создаёт одного владельца и демо-типы встреч в SQLite.
- [ ] `GET /event-types` и `GET /event-types/{id}` возвращают данные из БД.
- [ ] `make types` генерирует TS-типы из OpenAPI без ручного дублирования.
- [ ] `make verify-contract` (Prism-прокси перед бэком) не находит расхождений на этих роутах.
- [ ] Фронтовый список типов встреч рендерится с реального бэка; в devtools `/api/*` идут на `:3000`.

## Blocked by

- None — can start immediately.
