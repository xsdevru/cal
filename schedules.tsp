import "@typespec/http";

using Http;

namespace SchedulingService;

@route("/schedules")
@tag("Schedules")
interface Schedules {
  /** Список расписаний доступности */
  @get list(): ScheduleList | Error;

  /** Получить расписание */
  @get read(@path id: string): Schedule | Error;

  /** Создать расписание */
  @post create(@body body: Schedule): Schedule | Error;

  /** Обновить расписание */
  @patch update(@path id: string, @body body: MergePatchUpdate<Schedule>): Schedule | Error;

  /** Удалить расписание */
  @delete delete(@path id: string): void | Error;
}
