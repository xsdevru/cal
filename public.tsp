import "@typespec/http";

using Http;

namespace SchedulingService;

/** Публичная страница бронирования — то, что видит гость по расшаренной ссылке. */
model PublicEventPage {
  user: PublicUser;
  eventType: EventType;
}

@route("/{username}")
@tag("Public Booking Page")
interface PublicBookingPage {
  /** Публичный профиль владельца: список видимых типов встреч */
  @get profile(@path username: string): EventTypeList | Error;

  /** Страница бронирования типа встречи по ссылке `/{username}/{slug}` */
  @route("{slug}")
  @get
  eventPage(@path username: string, @path slug: string): PublicEventPage | Error;
}
