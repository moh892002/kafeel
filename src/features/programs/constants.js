// UI label constant that is NOT a backend enum (program category is a free-form String).
// programStatus labels come from GET /api/meta via src/meta.js.
export const PROGRAM_CATEGORIES = ['تأهيل مهني', 'تطوير ذاتي', 'إرشاد أسري', 'صحة نفسية', 'مهارات قيادية']

export const STATUS_TONE = { مفتوح: 'success', مكتمل: 'neutral', معلق: 'warning' }

export const SORT_OPTIONS = [
  { key: 'startDate', dir: 'asc', label: 'الأقرب بداية' },
  { key: 'enrolled', dir: 'desc', label: 'الأكثر تسجيلاً' },
  { key: 'rating', dir: 'desc', label: 'الأعلى تقييماً' },
  { key: 'price', dir: 'asc', label: 'السعر الأقل' },
]
