import { SPECIALISTS } from './specialists'

export const CATEGORIES = [
  'المهارات الأسرية', 'الصحة النفسية', 'التغذية', 'مهارات التواصل', 'التربية', 'الإدارة المالية',
]
export const LEVELS = ['مبتدئ', 'متوسط', 'متقدم']
export const COURSE_STATUSES = ['منشورة', 'مسودة']
export const COVERS = ['#075e66', '#0b5a62', '#2d7f83', '#3e8e94', '#5aa9a0', '#75bcba']

const TITLE_POOL = [
  'دورة المهارات الأسرية المتقدمة', 'إدارة الضغوط النفسية', 'التغذية السليمة للأسرة',
  'فن الحوار الزوجي', 'تربية الأبناء في العصر الرقمي', 'التواصل الفعال بين الزوجين',
  'مهارات إدارة الوقت للأسرة', 'الصحة النفسية للمراهقين', 'بناء الثقة بالنفس',
  'التخطيط المالي للأسرة', 'فن الاستماع والتأثير', 'تنمية الذكاء العاطفي',
  'مهارات حل الخلافات الأسرية', 'الوقاية من الإدمان الرقمي', 'التفكير الإيجابي والامتنان',
  'مقدمة في الإرشاد الأسري', 'مهارات التفاوض الفعال', 'العناية بالصحة النفسية للأطفال',
  'مبادئ الاستثمار للعائلات', 'التوازن بين العمل والحياة الأسرية',
  'فن إدارة المشاعر', 'التربية الإيجابية بالأمثلة', 'تنظيم الحياة الأسرية', 'صناعة الأهداف الواقعية',
]

const LESSON_TITLES = [
  'مقدمة تعريفية بالدورة', 'أساسيات المهارة', 'تطبيقات عملية', 'دراسة حالة واقعية',
  'التمارين التطبيقية', 'الأسئلة الشائعة', 'ملخص شامل', 'تقييم المنتصف', 'الاختبار النهائي',
]

const ENROLL_CLIENTS = [
  'أحمد الشمري', 'منى الحربي', 'سعود الدوسري', 'لمى الغامدي', 'خالد الزهراني',
  'نورة السبيعي', 'عبدالعزيز القحطاني', 'هند العسيري', 'راكان الجهني', 'جواهر الخالدي',
]

const PAY_STATUS = ['مكتمل الدفع', 'مكتمل الدفع', 'مكتمل الدفع', 'بانتظار الدفع', 'مسترد']

const INSTRUCTORS = [...new Set(SPECIALISTS.map((s) => `${s.title} ${s.name}`))].slice(0, 12)

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

const STORAGE_KEY = 'kafeel.courses.v1'

/* Deterministic lessons for a course (also used for freshly added courses) */
export function buildLessons(id) {
  const rand = mulberry32(id * 104729 + 7)
  const count = 6 + Math.floor(rand() * 5)
  return Array.from({ length: count }, (_, i) => ({
    n: i + 1,
    title: LESSON_TITLES[i % LESSON_TITLES.length],
    minutes: 10 + Math.floor(rand() * 35),
    preview: i === 0 || rand() > 0.75,
  }))
}

function buildCourses() {
  const rand = mulberry32(20260101)
  const used = new Set()
  const list = []
  let id = 1
  while (list.length < 24) {
    const title = TITLE_POOL[Math.floor(rand() * TITLE_POOL.length)]
    if (used.has(title)) continue
    used.add(title)

    const enrolled = 40 + Math.floor(rand() * 460)
    const createdDays = Math.floor(rand() * 600)

    list.push({
      id,
      title,
      category: CATEGORIES[Math.floor(rand() * CATEGORIES.length)],
      level: LEVELS[Math.floor(rand() * LEVELS.length)],
      instructor: INSTRUCTORS[Math.floor(rand() * INSTRUCTORS.length)],
      price: [0, 99, 149, 199, 249, 299, 399][Math.floor(rand() * 7)],
      enrolled,
      capacity: Math.round((enrolled / (0.55 + rand() * 0.4)) / 10) * 10,
      rating: Math.round((3.8 + rand() * 1.2) * 10) / 10,
      sessions: 4 + Math.floor(rand() * 8),
      hours: 3 + Math.floor(rand() * 14),
      status: rand() > 0.22 ? 'منشورة' : 'مسودة',
      cover: COVERS[Math.floor(rand() * COVERS.length)],
      createdAt: new Date(Date.now() - createdDays * 86400000).toISOString().slice(0, 10),
      description:
        'دورة تدريبية شاملة تقدم للأسرة الأدوات والمهارات العملية اللازمة لتحقيق حياة أكثر توازناً وسعادة، من خلال محاضرات تفاعلية وتمارين تطبيقية ودراسات حالة من الواقع.',
    })
    id += 1
  }
  return list
}

/* ---------- localStorage-backed CRUD ---------- */
export function loadCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore corrupted storage */
  }
  const list = buildCourses()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* storage may be unavailable */
  }
  return list
}

export function findCourse(id) {
  return loadCourses().find((c) => c.id === Number(id)) ?? null
}

export function upsertCourse(course) {
  const list = loadCourses()
  const idx = list.findIndex((c) => c.id === course.id)
  if (idx >= 0) list[idx] = course
  else list.push(course)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* storage may be unavailable — keep in-memory copy for this session */
  }
  return course
}

export function removeCourse(id) {
  const list = loadCourses().filter((c) => c.id !== Number(id))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* storage may be unavailable */
  }
}

export function nextCourseId() {
  const list = loadCourses()
  return list.reduce((max, c) => Math.max(max, c.id), 0) + 1
}

/* Deterministic recent enrollments for the details page */
export function buildEnrollments(id) {
  const rand = mulberry32(id * 31337 + 5)
  const count = 5 + Math.floor(rand() * 3)
  const seen = new Set()
  const rows = []
  for (let i = 0; i < count; i += 1) {
    let client = ENROLL_CLIENTS[Math.floor(rand() * ENROLL_CLIENTS.length)]
    while (seen.has(client)) client = ENROLL_CLIENTS[Math.floor(rand() * ENROLL_CLIENTS.length)]
    seen.add(client)
    rows.push({
      id: `${id}-e${i}`,
      client,
      date: new Date(Date.now() - Math.floor(rand() * 60) * 86400000).toISOString().slice(0, 10),
      method: ['مدى', 'Apple Pay', 'فيزا', 'تحويل بنكي'][Math.floor(rand() * 4)],
      status: PAY_STATUS[Math.floor(rand() * PAY_STATUS.length)],
    })
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1))
}
