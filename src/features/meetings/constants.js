// UI-only vocabulary + view helpers for the meetings feature.
// meetingStatus / meetingType labels come from GET /api/meta via src/meta.js.

export const STATUS_TONE = { مجدول: 'teal', منعقد: 'success', منتهي: 'neutral', ملغي: 'danger' }

export const fmtTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'ص' : 'م'}`
}
