// Сборка Fastify-приложения: маршруты и валидация поднимаются из OpenAPI-спеки
// (сгенерированной из TypeSpec) через fastify-openapi-glue. Вынесено отдельно от
// index.ts, чтобы интеграционные тесты могли поднять приложение через inject() без сети.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import openapiGlue from 'fastify-openapi-glue'
import { parse as parseYaml } from 'yaml'
import { service } from './service.ts'

const specPath = fileURLToPath(
  new URL('../../tsp-output/schema/openapi.yaml', import.meta.url),
)

// По OpenAPI readOnly+required означает «обязателен только в ответе», но Ajv это не
// учитывает и требует readOnly-поля (id, uid, createdAt…) в теле запроса — из-за чего
// POST на схемы с readOnly-полями падал с 400. Убираем readOnly-поля из required перед
// валидацией запросов. На ответы это не влияет (сервер их всегда возвращает), а контроль
// ответов по оригинальной спеке делает Prism (make verify-contract).
function stripReadOnlyFromRequired(node: unknown): void {
  if (Array.isArray(node)) {
    for (const item of node) stripReadOnlyFromRequired(item)
    return
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, any>
    if (Array.isArray(obj.required) && obj.properties) {
      obj.required = obj.required.filter(
        (key: string) => obj.properties[key]?.readOnly !== true,
      )
    }
    for (const value of Object.values(obj)) stripReadOnlyFromRequired(value)
  }
}

const specification = parseYaml(readFileSync(specPath, 'utf8'))
stripReadOnlyFromRequired(specification)

export async function buildApp() {
  const app = Fastify({
    logger: false,
    // OpenAPI 3.1 (JSON Schema 2020-12) использует ключевые слова вроде
    // unevaluatedProperties, которых нет в draft-07 Ajv Fastify. strict:false — не падать
    // на них; coerceTypes — приводить query/path-параметры (числа, булевы) из строк.
    ajv: { customOptions: { strict: false, coerceTypes: true } },
  })

  // PATCH-ручки в спеке используют application/merge-patch+json — парсим как обычный JSON.
  app.addContentTypeParser(
    'application/merge-patch+json',
    { parseAs: 'string' },
    (_req, body, done) => {
      try {
        done(null, JSON.parse(body as string))
      } catch (err) {
        done(err as Error)
      }
    },
  )

  // Ответы сериализуем обычным JSON.stringify, а не по схеме из спеки: TypeSpec для
  // Record<T> (напр. slots в AvailableSlots) эмитит unevaluatedProperties, которое
  // fast-json-stringify не понимает и вырезает динамические ключи. Соответствие ответов
  // контракту проверяется отдельно — Prism в режиме прокси (make verify-contract).
  app.setSerializerCompiler(() => (data) => JSON.stringify(data))

  await app.register(openapiGlue, { specification, serviceHandlers: service })
  return app
}
