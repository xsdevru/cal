# 02 — Event Types: полный CRUD

> Статус: реализовано (ретроспективный issue).

## What to build

Дополнить ресурс типов встреч до полного CRUD поверх фундамента: create, update (семантика
PATCH merge через `application/merge-patch+json`) и delete. Уникальность `(userId, slug)`
гарантирует пригодность slug для публичной ссылки `/{username}/{slug}`. Изменения из
админки отражаются и в UI, и в SQLite.

## Acceptance criteria

- [ ] `POST /event-types` создаёт тип встречи с сгенерированным `evt_…` id.
- [ ] `PATCH /event-types/{id}` меняет только переданные поля (merge-patch), остальные сохраняются.
- [ ] `DELETE /event-types/{id}` удаляет тип встречи.
- [ ] Попытка создать дубликат `slug` у того же владельца отклоняется.
- [ ] Интеграционные тесты (`fastify.inject()`) на CRUD round-trip зелёные.
- [ ] Из админки create/edit/delete видны в UI и в БД; `make verify-contract` без расхождений.

## Blocked by

- #01 — Фундамент + трейсер.
