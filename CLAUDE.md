# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`cal` — планировщик встреч (аналог cal.com / Calendly). Владелец задаёт расписание доступности и типы встреч, получает публичную ссылку `/{username}/{slug}` и делится ею; гости по ссылке видят свободные слоты и бронируют встречу.

Проект **spec-first**: API описан в TypeSpec, из него генерируется OpenAPI. Из той же спеки поднимается либо реальный бэкенд (Fastify + SQLite через Prisma), либо мок-сервер Prism. Фронтенд ходит на `/api` (Vite проксирует на бэкенд `:3000`, см. `web/vite.config.ts`).

## Architecture

Три слоя, соединённые кодогенерацией:

1. **TypeSpec spec (корень репозитория)** — источник истины для API. `main.tsp` импортирует остальные `.tsp` файлы, все они в одном namespace `SchedulingService`.
   - `models.tsp` — все модели данных и примеры (`@example`) для мока: `User`/`PublicUser`, `Schedule` (+ `AvailabilityBlock`, `DateOverride`), `EventType` (+ `Location` union, `BookingField`), `Booking` (+ `Attendee`, `BookingStatus`), `Slot`.
   - Файлы-интерфейсы = REST-ресурсы: `event-types.tsp`, `schedules.tsp`, `slots.tsp`, `bookings.tsp`, `public.tsp`. Каждый `interface` соответствует одному `@route`.
   - `tsp compile .` эмитит `tsp-output/schema/openapi.yaml` (OpenAPI 3.1.0, настроено в `tspconfig.yaml`). Эта директория в `.gitignore` — генерируется, не коммитится.
   - Примеры в `@example` — это данные, которые Prism отдаёт как мок-ответы. Меняя контракт, обновляй и примеры.

2. **Backend (`server/`)** — Fastify + TypeScript, БД SQLite через Prisma 7 (driver adapter). `fastify-openapi-glue` поднимает маршруты и валидацию запросов **прямо из `openapi.yaml`**: методы в `server/src/service.ts` названы по `operationId` из спеки (напр. `EventTypes_list`). Реализации ресурсов — в `server/src/routes/`, вся нетривиальная логика (расчёт свободных слотов) — в `server/src/lib/slots.ts`. Вложенные структуры моделей хранятся в SQLite как JSON-строки (см. `server/src/lib/serialize.ts`). MVP на одного владельца (сид создаёт `User`). `make server` — запуск на `:3000`, `make seed` — демо-данные.
   - Особенности связки OpenAPI 3.1 ↔ Fastify (все с комментариями в `server/src/app.ts`): нестрогий Ajv (`unevaluatedProperties`), парсер `application/merge-patch+json` для PATCH, сериализация ответов через `JSON.stringify` (иначе теряются динамические ключи `slots`), снятие `readOnly`-полей из `required` для валидации тел запросов.

3. **Mock server (Prism)** — `make demo-mock`/`make mock` поднимает REST-мок из `openapi.yaml` на `:4010` (бизнес-логики нет, ответы из `@example`). Полезен для контрактных проверок: `make verify-contract` ставит Prism прокси перед реальным бэком и валидирует ответы против спеки.

4. **Web frontend (`web/`)** — React 19 + Vite + Mantine 9, роутинг через react-router-dom 7.
   - `web/src/api.ts` — типизированный fetch-клиент. Запросы идут на `/api`, Vite проксирует на `:3000` со срезанием префикса `/api` (см. `web/vite.config.ts`). Типы **генерируются** из OpenAPI в `web/src/api-types.ts` командой `make types` (руками не дублируются) — при изменении контракта перегенерируй.
   - `web/src/App.tsx` — маршруты. Публичная страница `/:username/:slug` рендерится без админ-меню; всё остальное обёрнуто в `AdminLayout` (админка владельца: типы встреч `/`, расписания, брони, страница бронирования).

**Поток данных при разработке:** правка `.tsp` → `tsp compile` → (`make types` для фронта) → бэкенд отдаёт данные из SQLite → фронтенд их потребляет. `make demo` запускает бэкенд и фронтенд вместе.

## Commands

Всё через `Makefile`; каждая команда сама активирует Node 22 через nvm. Запускай `make <target>` из корня.

- `make install` — установить зависимости.
- `make openapi` (= `make build`) — скомпилировать TypeSpec в `tsp-output/schema/openapi.yaml`.
- `make types` — сгенерировать TS-типы фронта из OpenAPI в `web/src/api-types.ts`.
- `make server` — запустить бэкенд (Fastify, `:3000`, `tsx watch`).
- `make seed` — наполнить БД демо-данными.
- `make web` — dev-сервер фронтенда (Vite, `:5173`).
- `make demo` — **бэкенд + фронтенд** одновременно (основной режим разработки).
- `make demo-mock` — старый режим: мок Prism (`:4010`) + фронтенд.
- `make test` — юнит + интеграционные тесты (Vitest).
- `make verify-contract` — Prism-прокси перед бэком (`:3000`), валидирует ответы против спеки.
- `make swagger` — Swagger UI на `:8080`. `make mock` — только Prism-мок на `:4010`.
- `make clean` — удалить сгенерированные артефакты.

БД (SQLite, `DATABASE_URL=file:./dev.db` в `.env`):
- `make prisma-migrate` — применить миграции; `make prisma-generate` — сгенерировать клиент.
- `make prisma-studio` — GUI к БД. `make db-reset` — пересоздать БД и наполнить сидом.

Внутри `web/` (npm-скрипты, требуют Node 22):
- `npm run dev` — Vite dev-сервер.
- `npm run build` — `tsc -b && vite build`.
- `npm run lint` — oxlint (не eslint; конфиг `web/.oxlintrc.json`).

## Conventions

- Комментарии и документация в коде — на русском (см. существующие `.tsp` и `.tsx`).
- Node 22 обязателен (переключается через nvm; Makefile делает это сам, при ручном запуске `npm`/`npx` — сделай `nvm use 22`).
- Git-коммиты — в формате Conventional Commits.
