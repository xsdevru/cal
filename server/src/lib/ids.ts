// Генерация идентификаторов в стиле примеров спеки: evt_/sch_/bkg_ + короткий суффикс,
// и публичный uid брони (8 символов) для ссылок отмены/переноса.
import { customAlphabet } from 'nanoid'

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
const short = customAlphabet(alphabet, 8)

export const newId = (prefix: 'evt' | 'sch' | 'bkg' | 'usr'): string => `${prefix}_${short()}`
export const newUid = (): string => short()
