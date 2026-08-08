// Deterministic mock clients.
const FIRST = [
  'أحمد', 'سارة', 'عبدالله', 'نورة', 'فهد', 'ريم', 'ماجد', 'لطيفة', 'سلطان', 'هند',
  'بدر', 'غادة', 'يوسف', 'عبير', 'تركي', 'شهد', 'عمر', 'جواهر', 'ناصر', 'منى',
  'سامي', 'رغد', 'وليد', 'أمل', 'فاطمة', 'إبراهيم', 'خلود', 'مشعل', 'دانة', 'راكان',
]

const LAST = [
  'السالم', 'الأحمد', 'المطيري', 'القحطاني', 'العتيبي', 'الشهري', 'العنزي', 'الدوسري',
  'الحربي', 'الزهراني', 'الشمري', 'الغامدي', 'المالكي', 'السبيعي', 'البقمي', 'الحازمي',
]

export const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الخبر', 'الطائف', 'تبوك', 'أبها', 'حائل']

const ACTIVITY_TYPES = ['حجز جلسة', 'دفع رسوم', 'تقييم أخصائي', 'انضمام للقاء', 'تسجيل في برنامج']

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
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const rand = mulberry32(20260809)

function build() {
  const used = new Set()
  const list = []
  let id = 1
  while (list.length < 40) {
    const name = `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`
    if (used.has(name)) continue
    used.add(name)

    const now = new Date()
    const joined = new Date(now)
    joined.setDate(joined.getDate() - Math.floor(rand() * 600))
    const lastVisit = new Date(now)
    lastVisit.setDate(lastVisit.getDate() - Math.floor(rand() * 30))

    const sessions = Math.floor(1 + rand() * 40)
    const spent = Math.round(sessions * (180 + rand() * 260))
    const status = rand() < 0.76 ? 'نشط' : 'غير نشط'
    const vip = sessions >= 25 && rand() > 0.35

    // Recent activity feed for the profile modal
    const activity = []
    const count = 3 + Math.floor(rand() * 3)
    for (let i = 0; i < count; i += 1) {
      const ad = new Date(now)
      ad.setDate(ad.getDate() - Math.floor(rand() * 25))
      activity.push({
        id: `${id}-a${i}`,
        type: ACTIVITY_TYPES[Math.floor(rand() * ACTIVITY_TYPES.length)],
        date: dateStr(ad),
      })
    }
    activity.sort((a, b) => (a.date < b.date ? 1 : -1))

    list.push({
      id,
      name,
      email: `client${id}@kafeel.sa`,
      phone: `05${String(Math.floor(rand() * 89999999 + 10000000))}`,
      city: CITIES[Math.floor(rand() * CITIES.length)],
      joinedAt: dateStr(joined),
      lastVisit: dateStr(lastVisit),
      sessions,
      spent,
      rating: Math.round((3.6 + rand() * 1.3) * 10) / 10,
      status,
      vip,
      activity,
    })
    id += 1
  }
  return list
}

export const CLIENTS = build()
