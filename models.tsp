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

model EventTypeList {
  items: EventType[];
}

model ScheduleList {
  items: Schedule[];
}

model BookingList {
  items: Booking[];
}

@error
model Error {
  code: int32;
  message: string;
}
