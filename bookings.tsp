import "@typespec/http";

using Http;

namespace SchedulingService;

/** Данные для создания брони (заполняет гость на странице бронирования). */
model CreateBooking {
  /** Время начала встречи, ISO 8601 UTC. */
  start: utcDateTime;

  eventTypeId: string;
  attendee: Attendee;

  /** Email-адреса дополнительных гостей. */
  guests?: string[];

  location?: Location;
  metadata?: Record<string>;
}

/** Данные для переноса брони. */
model RescheduleBooking {
  /** Новое время начала, ISO 8601 UTC. */
  start: utcDateTime;

  reason?: string;
}

@route("/bookings")
@tag("Bookings")
interface Bookings {
  /** Список броней владельца (с фильтром по статусу) */
  @get list(@query status?: BookingStatus): BookingList | Error;

  /** Получить бронь */
  @get read(@path uid: string): Booking | Error;

  /** Создать бронь — гость подписывается на встречу по ссылке (публичный) */
  @post create(@body body: CreateBooking): Booking | Error;

  /** Перенести бронь на другое время */
  @route("{uid}/reschedule")
  @post
  reschedule(@path uid: string, @body body: RescheduleBooking): Booking | Error;

  /** Отменить бронь */
  @route("{uid}/cancel")
  @post
  cancel(@path uid: string): Booking | Error;
}
