// Deterministic mock programs (training programs with enrollment).
import { SPECIALISTS } from './specialists'

export const PROGRAM_CATEGORIES = ['تأهيل مهني', 'تطوير ذاتي', 'إرشاد أسري', 'صحة نفسية', 'مهارات قيادية']
export const PROGRAM_STATUSES = ['الكل', 'مفتوح', 'مكتمل', 'معلق']

export const PROGRAM_COVERS = [
  'from-[#075e66] to-[#2d7f83]',
  'from-[#2d7f83] to-[#75bcba]',
  'from-[#054b52] to-[#206e75]',
  'from-[#3e8e94] to-[#6ab8b4]',
  'from-[#04424a] to-[#2d7f83]',
  'from-[#28737a] to-[#75bcba]',
]

const TITLES = [
  'برنامج تأهيل المقبلين على الزواج',
  'برنامج إدارة الضغوط النفسية',
  'برنامج بناء الثقة بالنفس',
  'برنامج التوازن بين العمل والأسرة',
  'برنامج مهارات القيادة الفاعلة',
  'برنامج تعديل السلوك للأبناء',
  'برنامج الإرشاد المهني والتوظيف',
  'برنامج الصحة النفسية للعاملين',
  'برنامج التواصل الزوجي الفعّال',
  'برنامج إدارة الوقت والأولويات',
  'برنامج الذكاء العاطفي في بيئة العمل',
  'برنامج الاستشارات الأسرية المتقدمة',
]

const DESCRIPTIONS = [
  'برنامج متكامل يهدف إلى تأهيل المشاركين للحياة الزوجية بمهارات التواصل والتفاهم.',
  'جلسات عملية لإدارة الضغوط اليومية وبناء المرونة النفسية.',
  'برنامج تدريبي لبناء الثقة بالنفس وتطوير الصورة الذاتية الإيجابية.',
  'يساعدك على تحقيق توازن صحي بين مسؤوليات العمل والحياة الأسرية.',
  'برنامج متقدم لتطوير المهارات القيادية واتخاذ القرار.',
  'إرشادات عملية لتعديل سلوك الأبناء بطريقة إيجابية وآمنة.',
  'برنامج شامل لدعم الباحثين عن عمل وبناء المسار المهني.',
  'مبادرات عملية لتعزيز الصحة النفسية في بيئة العمل.',
  'برنامج متخصص لتحسين جودة التواصل بين الزوجين.',
  'استراتيجيات فعّالة لتنظيم الوقت وإدارة الأولويات.',
  'تطوير مهارات الذكاء العاطفي للقيادات والموظفين.',
  'برنامج متقدم للأخصائيين في مجال الإرشاد الأسري.',
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

const rand = mulberry32(20260807)

function build() {
  const list = []
  const used = new Set()
  let id = 1
  while (list.length < 12) {
    const title = TITLES[Math.floor(rand() * TITLES.length)]
    if (used.has(title)) continue
    used.add(title)

    const instructor = SPECIALISTS[Math.floor(rand() * SPECIALISTS.length)]
    const start = new Date()
    start.setDate(start.getDate() + Math.floor(rand() * 60) - 15)
    const enrolled = Math.floor(rand() * 90)
    const capacity = 50 + Math.floor(rand() * 100)
    const pct = enrolled / Math.max(capacity, enrolled)
    const status = pct >= 1 ? 'مكتمل' : rand() < 0.12 ? 'معلق' : 'مفتوح'

    list.push({
      id,
      title,
      category: PROGRAM_CATEGORIES[Math.floor(rand() * PROGRAM_CATEGORIES.length)],
      instructor,
      description: DESCRIPTIONS[TITLES.indexOf(title)],
      sessions: 6 + Math.floor(rand() * 8),
      price: Math.round((150 + rand() * 550) / 25) * 25,
      enrolled,
      capacity: Math.max(capacity, enrolled),
      rating: Math.round((3.8 + rand() * 1.1) * 10) / 10,
      status,
      startDate: start.toISOString().slice(0, 10),
      cover: PROGRAM_COVERS[id % PROGRAM_COVERS.length],
    })
    id += 1
  }
  return list
}

export const PROGRAMS = build()
