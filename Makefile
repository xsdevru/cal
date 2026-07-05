# Makefile проекта cal — планировщик встреч (аналог cal.com)
# Все команды выполняются на Node 22 (переключается через nvm).

SHELL := /bin/bash

# Активировать Node 22 перед каждой командой
N := source $$HOME/.nvm/nvm.sh && nvm use 22 >/dev/null 2>&1 &&

SPEC         := tsp-output/schema/openapi.yaml
SWAGGER_PORT ?= 8080
MOCK_PORT    ?= 4010
SERVER_PORT  ?= 3000
PROXY_PORT   ?= 4011

.DEFAULT_GOAL := help
.PHONY: help install openapi build swagger mock web demo demo-mock \
        server seed types test coverage verify-contract \
        prisma-generate prisma-migrate prisma-studio db-reset clean

help: ## Показать список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Установить зависимости (npm install)
	@$(N) npm install

openapi: ## Сгенерировать OpenAPI-спеку из TypeSpec (.tsp -> openapi.yaml)
	@$(N) npx tsp compile .

build: openapi ## Синоним openapi (сборка спеки)

swagger: openapi ## Собрать спеку и открыть Swagger UI в браузере (порт 8080)
	@$(N) npx http-server -c-1 -p $(SWAGGER_PORT) -o /swagger.html

mock: openapi ## Поднять мок REST-сервер из спеки — Prism (порт 4010)
	@$(N) npx @stoplight/prism-cli mock $(SPEC) -p $(MOCK_PORT)

web: ## Запустить фронтенд на Mantine (Vite dev, порт 5173)
	@$(N) cd web && npm run dev

server: openapi prisma-generate ## Запустить бэкенд (Fastify, порт 3000, tsx watch)
	@$(N) PORT=$(SERVER_PORT) npx tsx watch server/src/index.ts

seed: ## Наполнить БД демо-данными
	@$(N) npx tsx server/src/seed.ts

types: openapi ## Сгенерировать TS-типы фронта из OpenAPI (web/src/api-types.ts)
	@$(N) npx openapi-typescript $(SPEC) -o web/src/api-types.ts

test: ## Прогнать юнит/интеграционные тесты (Vitest)
	@$(N) npx vitest run

coverage: ## Тесты с отчётом покрытия (v8; отчёт в coverage/)
	@$(N) npx vitest run --coverage --coverage.include='server/src/**' --coverage.exclude='**/*.test.ts'

demo: openapi prisma-generate ## Бэкенд (Fastify :3000) + фронтенд (Vite :5173) вместе
	@$(N) PORT=$(SERVER_PORT) npx tsx server/src/index.ts & \
		SRV=$$!; trap "kill $$SRV 2>/dev/null" EXIT INT TERM; \
		cd web && npm run dev

demo-mock: openapi ## Старый режим: мок Prism (:4010) + фронтенд (:5173)
	@$(N) npx @stoplight/prism-cli mock $(SPEC) -p $(MOCK_PORT) -d & \
		PRISM=$$!; trap "kill $$PRISM 2>/dev/null" EXIT INT TERM; \
		cd web && npm run dev

verify-contract: openapi ## Prism-прокси перед бэком (:3000) — валидирует ответы против спеки
	@$(N) npx @stoplight/prism-cli proxy $(SPEC) http://localhost:$(SERVER_PORT) -p $(PROXY_PORT)

prisma-generate: ## Сгенерировать Prisma Client из schema.prisma
	@$(N) npx prisma generate

prisma-migrate: ## Применить миграции к БД (prisma migrate dev)
	@$(N) npx prisma migrate dev

prisma-studio: ## Открыть Prisma Studio — GUI для базы данных
	@$(N) npx prisma studio

db-reset: ## Пересоздать БД с нуля и наполнить демо-данными
	@$(N) npx prisma migrate reset --force && npx tsx server/src/seed.ts

clean: ## Удалить сгенерированные артефакты (tsp-output, generated)
	rm -rf tsp-output generated
