// Точка входа бэкенда: собирает приложение (app.ts) и слушает порт.
import { buildApp } from './app.ts'

const app = await buildApp()
const port = Number(process.env.PORT ?? 3000)
await app.listen({ port, host: '0.0.0.0' })
