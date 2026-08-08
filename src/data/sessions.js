// Deterministic mock sessions + localStorage persistence so bookings survive refresh.
import { SPECIALISTS } from './specialists'

export const SESSION_STATUSES = ['الكل', 'محجوزة', 'مكتملة', 'ملغاة', 'قيد الانتظار']
export const SESSION_TYPES = [
  { name: 'جلسة استشارية', mult: 1 },
  { name: 'جلسة مكثفة', mult: 1.4 },
  { name: 'لقاء مرئي', mult: 0.8 },
]
export const PAYMENT_METHODS = ['مدى', 'فيزا', 'Apple Pay']

export const CLIENT_OPTIONS = [
  'أحمد الشمري', 'منى الحربي', 'سعود الدوسري', 'لمى الغامدي', 'خالد الزهراني',
  'نورة السبيعي', 'عبدالعزيز القحطاني', 'هند العسيري', 'راكان الجهني', 'جواهر الخالدي',
  'ماجد النفيسة', 'ريم الدوسري', 'سلطان المطيري', 'دانة العنزي', 'بدر الراشد', 'شهد العمري',
]

const TIMES = ['09:00', '10:30', '12:00', '13:30', '16:00', '18:30', '20:00', '21:30']
const PAST_POOL = ['مكتملة', 'مكتملة', 'مكتملة', 'ملغاة'] // weighted towards completed
const FUTURE_POOL = ['محجوزة', 'محجوزة', 'قيد الانتظار']
const LOCATIONS = ['عن بُعد (فيديو)', 'عن بُعد (فيديو)', 'في العيادة']
const NOTES = [
  '',
  '',
  'العميل يفضل الجلسات الصباحية',
  'متابعة الحالة بعد الجلسة السابقة',
  'طلب إعادة جدولة بسبب السفر',
  'جلسة أولى لتقييم الحالة',
]

function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad = (n) => String(n).padStart(2, '0')

/** Local YYYY-MM-DD for a Date — avoids UTC day-shifts from toISOString. */
export const localDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const nextSessionId = (list) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1

export const feeFor = (specialistFee, typeName) => {
  const type = SESSION_TYPES.find((t) => t.name === typeName) ?? SESSION_TYPES[0]
  return Math.round((specialistFee * type.mult) / 25) * 25
}

const build = () => {
  const rand = mulberry32(20260806)
  const list = []
  for (let i = 0; i < 96; i += 1) {
    const specialist = SPECIALISTS[Math.floor(rand() * SPECIALISTS.length)]
    const type = SESSION_TYPES[Math.floor(rand() * SESSION_TYPES.length)]

    // Spread across ±45 days so the calendar around "today" looks full.
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const d = new Date(today)
    d.setDate(d.getDate() + Math.floor(rand() * 91) - 45)

    const time = TIMES[Math.floor(rand() * TIMES.length)]
    const pool = d < today ? PAST_POOL : FUTURE_POOL
    const status = pool[Math.floor(rand() * pool.length)]

    list.push({
      id: i + 1,
      client: CLIENT_OPTIONS[Math.floor(rand() * CLIENT_OPTIONS.length)],
      specialistId: specialist.id,
      specialistName: specialist.name,
      specialistTitle: specialist.title,
      specialty: specialist.specialty,
      type: type.name,
      date: localDateStr(d),
      time,
      datetime: new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(time.slice(0, 2)), Number(time.slice(3))).toISOString(),
      fee: feeFor(specialist.fee, type.name),
      payment: PAYMENT_METHODS[Math.floor(rand() * PAYMENT_METHODS.length)],
      location: LOCATIONS[Math.floor(rand() * LOCATIONS.length)],
      status,
      note: NOTES[Math.floor(rand() * NOTES.length)],
    })
  }
  return list.sort((a, b) => (a.datetime < b.datetime ? -1 : 1))
}

const KEY = 'kafeel.sessions.v1'

export function loadSessions() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* corrupted storage — regenerate */
  }
  const seed = build()
  persistSessions(seed)
  return seed
}

export function persistSessions(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* storage full/unavailable — keep in memory only */
  }
}
