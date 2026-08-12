// UI label constants that are NOT backend enums (specialist specialty is a free-form String,
// and experience/qualification ranges are UI-only vocabulary).
// specialistStatus labels come from GET /api/meta via src/meta.js.
export const SPECIALTY_OPTIONS = [
  'استشاري نفسي', 'أخصائي تغذية', 'أخصائي أسري', 'مدرب مهارات', 'أخصائي علاقات', 'استشاري تربوي',
]

export const TITLE_OPTIONS = ['د.', 'أ.']

export const EXPERIENCE_OPTIONS = ['أقل من سنة', '1 - 3 سنوات', '3 - 5 سنوات', '5 - 10 سنوات', 'أكثر من 10 سنوات']

export const QUALIFICATION_OPTIONS = ['بكالوريوس', 'ماجستير', 'دكتوراه', 'زمالة']

/* Presentation config shared by the page table and its modals. */
export const STATUS_TONE = {
  نشط: 'success',
  معلق: 'warning',
  موقوف: 'danger',
}

export const STATUS_DESC = {
  نشط: 'الأخصائي معتمد ويمكنه استقبال الجلسات',
  معلق: 'بانتظار مراجعة المستندات والمؤهلات',
  موقوف: 'تم إيقاف الحساب ولا يمكنه استقبال الجلسات',
}

export const RATING_OPTIONS = [
  { value: 0, label: 'أي تقييم' },
  { value: 3.5, label: '3.5 فأكثر' },
  { value: 4, label: '4 فأكثر' },
  { value: 4.5, label: '4.5 فأكثر' },
]

export const SORT_OPTIONS = [
  { key: 'joinedAt', dir: 'desc', label: 'الأحدث انضماماً' },
  { key: 'joinedAt', dir: 'asc', label: 'الأقدم انضماماً' },
  { key: 'rating', dir: 'desc', label: 'الأعلى تقييماً' },
  { key: 'sessions', dir: 'desc', label: 'الأكثر جلسات' },
  { key: 'name', dir: 'asc', label: 'الاسم (أ → ي)' },
  { key: 'name', dir: 'desc', label: 'الاسم (ي → أ)' },
]

/** Shared filter predicate — used by the page table and the filter modal's live result count. */
export function matchSpecialist(s, { status = 'الكل', specialties = [], minRating = 0, search = '' } = {}) {
  if (status !== 'الكل' && s.status !== status) return false
  if (specialties.length > 0 && !specialties.includes(s.specialty)) return false
  if (minRating > 0 && Number(s.rating ?? 0) < minRating) return false
  const q = String(search).trim().toLowerCase()
  if (q && !`${s.name} ${s.specialty} ${s.email}`.toLowerCase().includes(q)) return false
  return true
}
