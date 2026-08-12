// UI label constants that are NOT backend enums (course category is a free-form String).
// Enum-driven labels (courseStatus, courseLevel) come from GET /api/meta via src/meta.js.
export const CATEGORIES = [
  'المهارات الأسرية', 'الصحة النفسية', 'التغذية', 'مهارات التواصل', 'التربية', 'الإدارة المالية',
]
export const COVERS = ['#075e66', '#0b5a62', '#2d7f83', '#3e8e94', '#5aa9a0', '#75bcba']

export const SORT_OPTIONS = [
  { key: 'createdAt', dir: 'desc', label: 'الأحدث أولاً' },
  { key: 'enrolled', dir: 'desc', label: 'الأكثر تسجيلاً' },
  { key: 'rating', dir: 'desc', label: 'الأعلى تقييماً' },
  { key: 'price', dir: 'asc', label: 'السعر الأقل' },
  { key: 'title', dir: 'asc', label: 'العنوان' },
]
