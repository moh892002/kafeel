import { MONTHS } from './mock'

export const PERIODS = [
  { key: 'week', label: 'أسبوع', title: 'آخر 7 أيام' },
  { key: 'month', label: 'شهر', title: 'آخر 30 يوم' },
  { key: 'year', label: 'سنة', title: 'آخر 12 شهر' },
]

const WEEK_DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

export const SERVICE_NAMES = ['الجلسات', 'الدورات', 'اللقاءات', 'الاشتراكات']
export const SERVICE_COLORS = ['#075e66', '#2d7f83', '#75bcba', '#c4e2e0']

const SPECIALIST_POOL = [
  'د. خالد السالم', 'أ. سارة الأحمد', 'د. عبدالله المطيري', 'أ. نورة القحطاني',
  'د. فهد العتيبي', 'أ. ريم الشهري', 'د. ماجد العنزي', 'أ. لطيفة الدوسري',
]

const CLIENT_POOL = [
  'أحمد الشمري', 'منى الحربي', 'سعود الدوسري', 'لمى الغامدي', 'خالد الزهراني',
  'نورة السبيعي', 'عبدالعزيز القحطاني', 'هند العسيري', 'راكان الجهني', 'جواهر الخالدي',
]

const SERVICE_ITEMS = ['جلسة استشارية', 'دورة تدريبية', 'لقاء مرئي', 'اشتراك شهري']
const PAYMENT_METHODS = ['مدى', 'Apple Pay', 'فيزا', 'تحويل بنكي']
const TX_STATUS = ['مكتمل', 'مكتمل', 'مكتمل', 'مكتمل', 'مكتمل', 'مسترد', 'قيد المعالجة']

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

const round2 = (n) => Math.round(n * 100) / 100

/* Seeded Fisher–Yates shuffle (deterministic across engines) */
function shuffle(arr, rand) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const buildLabels = (period) => {
  if (period === 'week') return WEEK_DAYS
  if (period === 'month') return Array.from({ length: 30 }, (_, i) => String(i + 1))
  return MONTHS
}

/**
 * Deterministic earnings dataset for the requested period.
 * All monetary values are in thousands of SAR.
 */
export function getEarnings(period = 'month') {
  const rand = mulberry32(period === 'week' ? 11 : period === 'month' ? 22 : 33)
  const labels = buildLabels(period)
  const n = labels.length

  // Growing trend + daily/weekly noise
  const series = []
  const prev = []
  const base = period === 'week' ? 9 : period === 'month' ? 6.2 : 5.4
  for (let i = 0; i < n; i += 1) {
    const trend = 1 + (i / n) * 0.45
    const wave = 1 + Math.sin(i / (n / 3)) * 0.22
    const noise = 0.82 + rand() * 0.36
    const value = round2(base * trend * wave * noise)
    const prevNoise = 0.7 + rand() * 0.3
    series.push(value)
    prev.push(round2(value * 0.82 * prevNoise))
  }

  const total = round2(series.reduce((a, b) => a + b, 0))
  const prevTotal = round2(prev.reduce((a, b) => a + b, 0))
  const delta = round2(((total - prevTotal) / prevTotal) * 100)

  // Service split (rounded values that always sum to 100)
  const s0 = Math.round(38 + rand() * 12)
  const s1 = Math.round(22 + rand() * 8)
  const s2 = Math.round(14 + rand() * 6)
  const split = [
    { name: SERVICE_NAMES[0], value: s0, color: SERVICE_COLORS[0] },
    { name: SERVICE_NAMES[1], value: s1, color: SERVICE_COLORS[1] },
    { name: SERVICE_NAMES[2], value: s2, color: SERVICE_COLORS[2] },
    { name: SERVICE_NAMES[3], value: Math.max(0, 100 - s0 - s1 - s2), color: SERVICE_COLORS[3] },
  ]

  // Top specialists leaderboard (seeded earnings)
  const top = shuffle(SPECIALIST_POOL, rand)
    .slice(0, 5)
    .map((name, i) => ({
      name,
      earnings: Math.round((30 - i * 4.5 + rand() * 6) * (period === 'week' ? 0.35 : period === 'month' ? 1 : 8)),
    }))
    .sort((a, b) => b.earnings - a.earnings)

  // Aggregate transaction stats for the period
  const totalTx = Math.round(
    period === 'week' ? 180 + rand() * 220 : period === 'month' ? 850 + rand() * 900 : 9000 + rand() * 6000,
  )
  const avgTx = Math.round((total * 1000) / totalTx)

  // Transactions
  const txCount = period === 'week' ? 6 : period === 'month' ? 10 : 12
  const transactions = Array.from({ length: txCount }, (_, i) => {
    const date = new Date(Date.now() - (i * 3 + Math.floor(rand() * 3)) * 86400000)
    const amount = Math.round((120 + rand() * 900) / 5) * 5
    return {
      id: `TRX-${2841 - i * 7}`,
      client: CLIENT_POOL[Math.floor(rand() * CLIENT_POOL.length)],
      service: SERVICE_ITEMS[Math.floor(rand() * SERVICE_ITEMS.length)],
      method: PAYMENT_METHODS[Math.floor(rand() * PAYMENT_METHODS.length)],
      date: date.toISOString().slice(0, 10),
      amount,
      commission: round2(amount * 0.15),
      status: TX_STATUS[Math.floor(rand() * TX_STATUS.length)],
    }
  })

  return {
    period,
    labels,
    series, // current period values (thousands)
    prev, // previous period values
    total,
    prevTotal,
    delta,
    split,
    top,
    transactions,
    totalTx,
    avgTx,
  }
}
