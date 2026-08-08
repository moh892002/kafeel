// Deterministic mock data (seeded) so the table is stable between renders.
const FIRST = [
  'خالد', 'سارة', 'عبدالله', 'نورة', 'فهد', 'ريم', 'ماجد', 'لطيفة', 'سلطان', 'هند',
  'بدر', 'غادة', 'يوسف', 'عبير', 'تركي', 'شهد', 'عمر', 'جواهر', 'ناصر', 'منى',
  'سامي', 'رغد', 'وليد', 'أمل', 'فاطمة', 'إبراهيم', 'خلود', 'مشعل', 'دانة', 'راكان',
  'ليان', 'سلوى', 'بندر', 'أريج', 'زياد', 'مها', 'عبدالرحمن', 'وصال', 'طارق', 'نجلاء',
  'حمود', 'رنا', 'عادل', 'شذا', 'مازن', 'غالية', 'فارس', 'جمانة',
]

const LAST = [
  'السالم', 'الأحمد', 'المطيري', 'القحطاني', 'العتيبي', 'الشهري', 'العنزي', 'الدوسري',
  'الحربي', 'الزهراني', 'الشمري', 'القصبي', 'الغامدي', 'المالكي', 'السبيعي', 'البقمي',
  'الحازمي', 'الراشد', 'القرني', 'العوفي', 'المطرفي', 'العمري', 'الشهراني', 'الخالدي',
]

const SPECIALTIES = ['استشاري نفسي', 'أخصائي تغذية', 'أخصائي أسري', 'مدرب مهارات', 'أخصائي علاقات', 'استشاري تربوي']
const TITLES = ['د.', 'أ.', 'د.', 'أ.']
const STATUS_POOL = ['نشط', 'نشط', 'نشط', 'نشط', 'معلق', 'موقوف'] // weighted towards active

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

const rand = mulberry32(20260805)

function build() {
  const used = new Set()
  const list = []
  let id = 1
  while (list.length < 48) {
    const first = FIRST[Math.floor(rand() * FIRST.length)]
    const last = LAST[Math.floor(rand() * LAST.length)]
    const key = `${first} ${last}`
    if (used.has(key)) continue
    used.add(key)

    const joinedDaysAgo = Math.floor(rand() * 540) // up to ~18 months back
    const joined = new Date(Date.now() - joinedDaysAgo * 86400000)

    list.push({
      id,
      name: key,
      title: TITLES[Math.floor(rand() * TITLES.length)],
      specialty: SPECIALTIES[Math.floor(rand() * SPECIALTIES.length)],
      rating: Math.round((3.9 + rand() * 1.1) * 10) / 10,
      sessions: Math.floor(12 + rand() * 168),
      status: STATUS_POOL[Math.floor(rand() * STATUS_POOL.length)],
      joinedAt: joined.toISOString().slice(0, 10),
      fee: Math.round((250 + rand() * 450) / 25) * 25,
      verified: rand() > 0.15,
      email: `specialist${id}@kafeel.sa`,
      phone: `05${String(Math.floor(rand() * 89999999 + 10000000))}`,
    })
    id += 1
  }
  return list
}

export const SPECIALISTS = build()
export const SPECIALTY_OPTIONS = SPECIALTIES
export const STATUS_OPTIONS = ['الكل', 'نشط', 'معلق', 'موقوف']
