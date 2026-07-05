// Обработчики API, собранные в один объект. Имена методов = operationId из OpenAPI
// (fastify-openapi-glue сопоставляет их с маршрутами и вешает валидацию из спеки).
import { eventTypeRoutes } from './routes/event-types.ts'
import { scheduleRoutes } from './routes/schedules.ts'
import { slotRoutes } from './routes/slots.ts'
import { bookingRoutes } from './routes/bookings.ts'
import { publicRoutes } from './routes/public.ts'

export const service = {
  ...eventTypeRoutes,
  ...scheduleRoutes,
  ...slotRoutes,
  ...bookingRoutes,
  ...publicRoutes,
}
