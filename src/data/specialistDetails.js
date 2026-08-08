import { SPECIALISTS } from './specialists'

const CLIENTS = [
  'أحمد الشمري', 'منى الحربي', 'سعود الدوسري', 'لمى الغامدي', 'خالد الزهراني',
  'نورة السبيعي', 'عبدالعزيز القحطاني', 'هند العسيري', 'راكان الجهني', 'جواهر الخالدي',
  'ماجد النفيسة', 'ريم الدوسري', 'سلطان المطيري', 'دانة العنزي', 'بدر الراشد', 'شهد العمري',
]

const SESSION_TYPES = [
  { name: 'جلسة استشارية', mult: 1 },
  { name: 'جلسة مكثفة', mult: 1.4 },
  { name: 'لقاء مرئي', mult: 0.8 },
]

const SESSION_STATUS = ['مكتملة', 'مكتملة', 'مكتملة', 'مكتملة', 'ملغاة']

const TIMES = ['09:00 ص', '10:30 ص', '12:00 م', '01:30 م', '04:00 م', '06:30 م', '08:00 م', '09:30 م']

const REVIEWS_5 = [
  'أخصائي ممتاز جداً، استفدت كثيراً من الجلسات ووصلت لأهدافي بسرعة.',
  'خبرة واضحة وأسلوب راقٍ في التعامل، أنصح به بشدة.',
  'الجلسة غيرت نظرتي للأمور، طريقة ممتازة في التواصل والشرح.',
  'احترافية عالية ونتائج ملموسة من الجلسات الأولى.',
  'أفضل تجربة استشارية مررت بها، يتابع حالة العميل بدقة.',
]

const REVIEWS_4 = [
  'جلسات مفيدة جداً، أنصح بالاستمرار معه.',
  'شرح وافٍ وتفاعل جيد، تجربة إيجابية.',
  'معلومات قيمة وأسلوب مقنع، الجدول الزمني كان مرناً.',
]

const REVIEWS_3 = [
  'جلسة متوسطة، يمكن تحسين تنظيم الوقت بشكل أكبر.',
  'معلومات مفيدة لكن الجلسة كانت قصيرة بعض الشيء.',
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

const round25 = (n) => Math.round(n / 25) * 25

/**
 * Deterministic detail data for a given specialist id — the same id always
 * yields the same sessions, reviews and breakdown.
 */
export function getSpecialistDetail(id) {
  const specialist = SPECIALISTS.find((s) => s.id === id)
  if (!specialist) return null

  const rand = mulberry32(id * 7919 + 101)

  /* --- Sessions (last ~90 days) --- */
  const sessionCount = 8 + Math.floor(rand() * 6)
  const sessions = []
  const usedClients = new Set()
  for (let i = 0; i < sessionCount; i += 1) {
    let client = CLIENTS[Math.floor(rand() * CLIENTS.length)]
    while (usedClients.has(client)) client = CLIENTS[Math.floor(rand() * CLIENTS.length)]
    usedClients.add(client)

    const type = SESSION_TYPES[Math.floor(rand() * SESSION_TYPES.length)]
    const date = new Date(Date.now() - Math.floor(rand() * 90) * 86400000)
    sessions.push({
      id: `${id}-${i}`,
      client,
      type: type.name,
      date: date.toISOString().slice(0, 10),
      time: TIMES[Math.floor(rand() * TIMES.length)],
      fee: round25(specialist.fee * type.mult),
      status: SESSION_STATUS[Math.floor(rand() * SESSION_STATUS.length)],
    })
  }
  sessions.sort((a, b) => (a.date < b.date ? 1 : -1))

  /* --- Rating breakdown (weighted so the average ≈ specialist.rating) --- */
  let five = Math.round(8 + ((specialist.rating - 3.9) / 1.1) * 52)
  const four = Math.round(14 + rand() * 12)
  const three = Math.round(6 + rand() * 8)
  const two = Math.round(2 + rand() * 5)
  let one = 100 - five - four - three - two
  if (one < 0) {
    five += one
    one = 0
  }
  const breakdown = [
    { stars: 5, pct: five },
    { stars: 4, pct: four },
    { stars: 3, pct: three },
    { stars: 2, pct: two },
    { stars: 1, pct: one },
  ]

  /* --- Reviews --- */
  const totalReviews = 18 + Math.floor(rand() * 62)
  const reviewCount = 5 + Math.floor(rand() * 4)
  const reviews = []
  const revClients = new Set()
  for (let i = 0; i < reviewCount; i += 1) {
    let client = CLIENTS[Math.floor(rand() * CLIENTS.length)]
    while (revClients.has(client)) client = CLIENTS[Math.floor(rand() * CLIENTS.length)]
    revClients.add(client)

    const r = rand()
    const rating = r < 0.62 ? 5 : r < 0.88 ? 4 : 3
    const pool = rating === 5 ? REVIEWS_5 : rating === 4 ? REVIEWS_4 : REVIEWS_3
    reviews.push({
      id: `${id}-r${i}`,
      client,
      rating,
      comment: pool[Math.floor(rand() * pool.length)],
      date: new Date(Date.now() - Math.floor(rand() * 120) * 86400000).toISOString().slice(0, 10),
    })
  }

  /* --- Profile stats --- */
  const completed = sessions.filter((s) => s.status === 'مكتملة').length
  const avgFee = specialist.fee
  const hours = Math.round(completed * (0.5 + rand() * 1) * 10) / 10
  const attendance = 88 + Math.floor(rand() * 11)
  const earnings = Math.round((completed * avgFee) / 3)

  return {
    specialist,
    sessions,
    breakdown,
    totalReviews,
    reviews,
    stats: {
      sessions: specialist.sessions,
      hours,
      attendance,
      earnings,
      deltas: { sessions: 12.4, hours: 8.1, attendance: 1.2, earnings: 9.5 },
    },
  }
}
