# Changelog

Все заметные изменения проекта. Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
проект следует [Semantic Versioning](https://semver.org/lang/ru/).

## [0.1.0] — 2026-07-05

Первый релиз `cal` — spec-first планировщика встреч (аналог cal.com / Calendly): TypeSpec-контракт
как источник истины, реальный бэкенд Fastify + SQLite/Prisma, мок Prism и фронтенд на React + Mantine.

### Features

- api: realistic `@example` data and make web/demo targets ([1782c5e](https://github.com/xsdevru/cal/commit/1782c5e))
- web: Mantine frontend backed by Prism mock ([15220e6](https://github.com/xsdevru/cal/commit/15220e6))
- api: example for public event page ([9761c05](https://github.com/xsdevru/cal/commit/9761c05))
- web: standalone public booking page at `/:username/:slug` ([af8820d](https://github.com/xsdevru/cal/commit/af8820d))
- api: extend scheduling contract with confirmation policy ([a589e72](https://github.com/xsdevru/cal/commit/a589e72))
- server: real SQLite/Fastify backend implementing the contract ([52e9dad](https://github.com/xsdevru/cal/commit/52e9dad))
- web: connect frontend to the real backend ([9f7187a](https://github.com/xsdevru/cal/commit/9f7187a))
- event-types: return 409 on slug conflict and delete with active bookings ([b95ef5b](https://github.com/xsdevru/cal/commit/b95ef5b))
- schedules: reject invalid date override with 400 ([145b141](https://github.com/xsdevru/cal/commit/145b141))
- bookings: reject additional guest duplicating attendee ([373b42f](https://github.com/xsdevru/cal/commit/373b42f))

Фундамент: TypeSpec-спека API (`SchedulingService`) и инструментарий (Prisma, Swagger UI, Makefile).

[0.1.0]: https://github.com/xsdevru/cal/releases/tag/v0.1.0
