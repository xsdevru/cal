import "@typespec/http";

using Http;

namespace SchedulingService;

@route("/event-types")
@tag("Event Types")
interface EventTypes {
  /** Список типов встреч владельца */
  @get list(): EventTypeList | Error;

  /** Получить тип встречи */
  @get read(@path id: string): EventType | Error;

  /** Создать тип встречи */
  @post create(@body body: EventType): EventType | Error;

  /** Обновить тип встречи */
  @patch update(@path id: string, @body body: MergePatchUpdate<EventType>): EventType | Error;

  /** Удалить тип встречи */
  @delete delete(@path id: string): void | Error;
}
