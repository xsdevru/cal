import "@typespec/http";

using Http;

namespace SchedulingService;

/** Свободные слоты, сгруппированные по дате: ключ `YYYY-MM-DD` → массив слотов. */
model AvailableSlots {
  slots: Record<Slot[]>;
}

@route("/slots")
@tag("Slots")
interface Slots {
  /** Свободные слоты типа встречи за диапазон дат (публичный) */
  @get list(
    @query eventTypeId: string,

    /** Начало диапазона, YYYY-MM-DD */
    @query start: plainDate,

    /** Конец диапазона, YYYY-MM-DD */
    @query end: plainDate,

    /** Таймзона для расчёта слотов, напр. "Europe/Moscow" */
    @query timeZone?: string,
  ): AvailableSlots | Error;
}
