// UI-only vocabulary + view helpers for the sessions feature.
// sessionStatus / paymentMethod labels come from GET /api/meta via src/meta.js.

export const STATUS_TONE = { محجوزة: 'teal', مكتملة: 'success', ملغاة: 'danger', 'قيد الانتظار': 'warning' }
export const DOT = { محجوزة: 'bg-accent-soft', مكتملة: 'bg-emerald-500', ملغاة: 'bg-red-400', 'قيد الانتظار': 'bg-amber-400' }
export const CHIP_STYLE = {
  محجوزة: 'bg-accent-soft text-white',
  مكتملة: 'bg-emerald-100 text-emerald-700',
  ملغاة: 'bg-red-100 text-red-400 line-through',
  'قيد الانتظار': 'bg-amber-100 text-amber-600',
}

export const SORT_OPTIONS = [
  { key: 'datetime', dir: 'asc', label: 'الأقرب موعداً' },
  { key: 'datetime', dir: 'desc', label: 'الأبعد موعداً' },
  { key: 'fee', dir: 'desc', label: 'الأعلى رسوماً' },
  { key: 'client', dir: 'asc', label: 'اسم العميل' },
]

export const STAT_LABEL = {
  'الكل': 'إجمالي الجلسات',
  محجوزة: 'جلسة محجوزة',
  مكتملة: 'جلسة مكتملة',
  ملغاة: 'جلسة ملغاة',
  'قيد الانتظار': 'بانتظار التأكيد',
}

export const DAY_HEADERS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

export const fmtTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'ص' : 'م'}`
}

/** Day cells for a month, Saturday-first — flows right-to-left inside the RTL grid. */
export function buildMonthGrid(y, m) {
  const days = new Date(y, m + 1, 0).getDate()
  const offset = (new Date(y, m, 1).getDay() + 1) % 7
  const cells = Array(offset).fill(null)
  for (let d = 1; d <= days; d += 1) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
