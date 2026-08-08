// Deterministic mock meetings (group video sessions / live broadcasts).
import { SPECIALISTS } from './specialists'

export const MEETING_TYPES = ['لقاء جماعي', 'ورشة عمل', 'بث مباشر']
export const MEETING_STATUSES = ['الكل', 'مجدول', 'منعقد', 'منتهي', 'ملغي']

const TITLES = [
  'لقاء أسبوعي للمقبلين على الزواج',
  'ورشة إدارة الضغوط للموظفين',
  'بث مباشر: أسئلة وأجوبة مع أخصائي',
  'لقاء توعوي عن الصحة النفسية',
  'ورشة مهارات التواصل الأسري',
  'بث مباشر: كيف تتعامل مع القلق؟',
  'لقاء تعريفي ببرامج المنصة',
  'ورشة بناء الثقة في بيئة العمل',
  'لقاء مفتوح لمناقشة التحديات الأسرية',
  'ورشة الذكاء العاطفي',
  'بث مباشر: نصائح لتعديل سلوك الأبناء',
  'لقاء ختامي لبرنامج التأهيل المهني',
]

const TIMES = ['09:00', '11:00', '14:00', '17:00', '19:30', '20:30']
const DURATIONS = [45, 60, 90, 120]

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
const localDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const rand = mulberry32(20260808)

function build() {
  const list = []
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  for (let i = 0; i < 14; i += 1) {
    const d = new Date(today)
    d.setDate(d.getDate() + Math.floor(rand() * 61) - 25)
    const type = MEETING_TYPES[Math.floor(rand() * MEETING_TYPES.length)]
    const time = TIMES[Math.floor(rand() * TIMES.length)]

    let status
    if (d < today) status = rand() < 0.85 ? 'منتهي' : 'ملغي'
    else if (d.getTime() === today.getTime()) status = rand() < 0.3 ? 'منعقد' : 'مجدول'
    else status = rand() < 0.08 ? 'ملغي' : 'مجدول'

    const capacity = 40 + Math.floor(rand() * 160)
    const attendees = Math.min(capacity, Math.floor(rand() * capacity))
    const id = i + 1

    list.push({
      id,
      title: TITLES[Math.floor(rand() * TITLES.length)],
      host: SPECIALISTS[Math.floor(rand() * SPECIALISTS.length)],
      type,
      date: localDateStr(d),
      time,
      duration: DURATIONS[Math.floor(rand() * DURATIONS.length)],
      attendees,
      capacity,
      status,
      recording: status === 'منتهي' && rand() > 0.35,
      link: `meet.kafeel.sa/room-${id}`,
    })
  }
  return list.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1))
}

export const MEETINGS = build()
