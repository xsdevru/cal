# Бэкенд управляется спекой: TypeSpec как источник истины

TypeSpec (корень репо) — единственный источник контракта API: из него компилируется
OpenAPI, и уже из спеки `fastify-openapi-glue` поднимает маршруты и валидацию запросов
(методы в `server/src/service.ts` названы по `operationId`, напр. `EventTypes_list`), а
`openapi-typescript` генерирует типы фронта. Выбрали это вместо code-first (роуты и типы,
описанные в коде), чтобы контракт, бэкенд и фронтенд не расходились: правка `.tsp`
автоматически меняет валидацию и типы по обе стороны.

## Consequences

Спека диктует реализацию, но OpenAPI 3.1 (JSON Schema 2020-12) требует обходов на стороне
Fastify (нестрогий Ajv для `unevaluatedProperties`, снятие `readOnly` из `required`,
сериализация ответов через `JSON.stringify`, парсер `application/merge-patch+json`) — все
задокументированы комментариями в `server/src/app.ts`. Не «чините» их, не проверив спеку.
