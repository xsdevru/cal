import "@typespec/http";

using Http;

namespace SchedulingService;

/** Публичная страница бронирования — то, что видит гость по расшаренной ссылке. */
@example(#{
  user: #{ username: "aleksandr", name: "Александр Иванов", timeZone: "Europe/Moscow" },
  eventType: #{
    id: "evt_01",
    title: "Созвон 30 минут",
    slug: "30min",
    description: "Быстрое знакомство и обсуждение вашей задачи.",
    lengthInMinutes: 30,
    locations: #[#{ type: "video", integration: "google-meet" }],
    hidden: false,
    confirmation: ConfirmationPolicy.auto,
  },
})
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
