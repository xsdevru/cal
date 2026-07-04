import "@typespec/http";
import "./models.tsp";
import "./event-types.tsp";
import "./schedules.tsp";
import "./slots.tsp";
import "./bookings.tsp";
import "./public.tsp";

using Http;

/**
 * API планировщика встреч (аналог cal.com / Calendly).
 *
 * Владелец задаёт расписание доступности и типы встреч, получает публичную
 * ссылку `/{username}/{slug}` и делится ею. Гости по ссылке видят свободные
 * слоты и бронируют встречу.
 */
@service(#{ title: "Scheduling Service" })
namespace SchedulingService;
