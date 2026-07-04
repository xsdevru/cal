import "@typespec/http";

using Http;

namespace SchedulingService;

/** Пользователь-владелец расписания. */
model User {
  @visibility(Lifecycle.Read) id: string;

  /** Уникальное имя для публичной ссылки: `/{username}/{slug}`. */
  username: string;

  name: string;
  email: string;

  /** IANA-таймзона, напр. "Europe/Moscow". */
  timeZone: string;
}

/** Публичный профиль владельца (без приватных полей). */
model PublicUser {
  username: string;
  name: string;
  timeZone: string;
}

/** День недели. */
enum WeekDay {
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

/** Регулярный блок доступности (повторяется в указанные дни). */
model AvailabilityBlock {
  days: WeekDay[];

  /** Время начала, формат HH:MM. */
  startTime: string;

  /** Время конца, формат HH:MM. */
  endTime: string;
}

/** Исключение на конкретную дату (напр. выходной или особые часы). */
model DateOverride {
  date: plainDate;
  startTime: string;
  endTime: string;
}

/** Расписание доступности владельца. */
model Schedule {
  @visibility(Lifecycle.Read) id: string;

  name: string;
  timeZone: string;

  /** Основное расписание пользователя (одно на пользователя). */
  isDefault: boolean = false;

  availability: AvailabilityBlock[];
  overrides?: DateOverride[];
}

/** Место проведения встречи. */
union Location {
  address: AddressLocation,
  phone: PhoneLocation,
  video: VideoLocation,
}

model AddressLocation {
  type: "address";
  address: string;
}

model PhoneLocation {
  type: "phone";
  phone: string;
}

model VideoLocation {
  type: "video";

  /** Интеграция видеозвонка, напр. "google-meet", "zoom". */
  integration: string;
}

/** Дополнительное поле формы бронирования. */
model BookingField {
  name: string;
  label: string;
  type: "text" | "textarea" | "email" | "phone" | "number" | "select";
  required: boolean = false;
  options?: string[];
}

/** Тип встречи — то, чем делятся по публичной ссылке. */
model EventType {
  @visibility(Lifecycle.Read) id: string;

  title: string;

  /** Часть публичной ссылки: `/{username}/{slug}`. */
  slug: string;

  description?: string;

  /** Длительность встречи в минутах. */
  lengthInMinutes: int32;

  locations: Location[];

  /** Привязанное расписание доступности; если не задано — дефолтное. */
  scheduleId?: string;

  /** Скрыт со страницы бронирования. */
  hidden: boolean = false;

  bookingFields?: BookingField[];
}

/** Гость, который бронирует встречу. */
model Attendee {
  name: string;
  email: string;
  timeZone: string;
  language?: string;
  phoneNumber?: string;
}

/** Статус брони. */
enum BookingStatus {
  accepted,
  pending,
  cancelled,
  rejected,
}

/** Бронь встречи. */
model Booking {
  @visibility(Lifecycle.Read) id: string;

  /** Публичный идентификатор брони (для ссылок отмены/переноса). */
  @visibility(Lifecycle.Read) uid: string;

  title: string;
  status: BookingStatus;
  start: utcDateTime;
  end: utcDateTime;

  /** Длительность в минутах. */
  duration: int32;

  eventTypeId: string;
  attendee: Attendee;

  /** Email-адреса дополнительных гостей. */
  guests?: string[];

  location?: Location;
  metadata?: Record<string>;

  @visibility(Lifecycle.Read) createdAt: utcDateTime;
  @visibility(Lifecycle.Read) updatedAt: utcDateTime;
}

/** Свободный слот времени. */
model Slot {
  start: utcDateTime;
  end: utcDateTime;
}

@example(#{
  items: #[
    #{
      id: "evt_01",
      title: "Созвон 30 минут",
      slug: "30min",
      description: "Быстрое знакомство и обсуждение задачи",
      lengthInMinutes: 30,
      locations: #[#{ type: "video", integration: "google-meet" }],
      hidden: false,
    },
    #{
      id: "evt_02",
      title: "Консультация 60 минут",
      slug: "consult",
      description: "Подробный разбор вашего проекта",
      lengthInMinutes: 60,
      locations: #[#{ type: "phone", phone: "+7 900 000-00-00" }],
      hidden: false,
    },
  ],
})
model EventTypeList {
  items: EventType[];
}

@example(#{
  items: #[
    #{
      id: "sch_01",
      name: "Рабочие часы",
      timeZone: "Europe/Moscow",
      isDefault: true,
      availability: #[
        #{
          days: #[
            WeekDay.Monday,
            WeekDay.Tuesday,
            WeekDay.Wednesday,
            WeekDay.Thursday,
            WeekDay.Friday
          ],
          startTime: "09:00",
          endTime: "18:00",
        }
      ],
    }
  ],
})
model ScheduleList {
  items: Schedule[];
}

@example(#{
  items: #[
    #{
      id: "bkg_01",
      uid: "a1b2c3d4",
      title: "Созвон 30 минут между Иван Петров и Мария",
      status: BookingStatus.accepted,
      start: utcDateTime.fromISO("2026-07-10T09:00:00Z"),
      end: utcDateTime.fromISO("2026-07-10T09:30:00Z"),
      duration: 30,
      eventTypeId: "evt_01",
      attendee: #{
        name: "Иван Петров",
        email: "ivan@example.com",
        timeZone: "Europe/Moscow",
      },
      createdAt: utcDateTime.fromISO("2026-07-04T12:00:00Z"),
      updatedAt: utcDateTime.fromISO("2026-07-04T12:00:00Z"),
    },
    #{
      id: "bkg_02",
      uid: "e5f6g7h8",
      title: "Консультация 60 минут",
      status: BookingStatus.pending,
      start: utcDateTime.fromISO("2026-07-11T14:00:00Z"),
      end: utcDateTime.fromISO("2026-07-11T15:00:00Z"),
      duration: 60,
      eventTypeId: "evt_02",
      attendee: #{
        name: "Анна Смирнова",
        email: "anna@example.com",
        timeZone: "Europe/Moscow",
      },
      createdAt: utcDateTime.fromISO("2026-07-03T18:30:00Z"),
      updatedAt: utcDateTime.fromISO("2026-07-03T18:30:00Z"),
    },
  ],
})
model BookingList {
  items: Booking[];
}

@error
model Error {
  code: int32;
  message: string;
}
