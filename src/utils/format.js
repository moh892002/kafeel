/** Shared formatting helpers */

export const fmtDate = (iso) => {
  if (!iso) return '—'
  // Bare YYYY-MM-DD values (API LocalDate fields) must stay on their calendar day —
  // parsing them as UTC shifts a day back in Asia/Riyadh (UTC+3).
  const bare = /^\d{4}-\d{2}-\d{2}$/.test(iso)
  const d = bare ? new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) : new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export const num = (n) => n.toLocaleString('en-US')

/** Arabic relative time ("الآن", "منذ ٥ دقائق"...) for ISO timestamps. */
export const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'الآن'
  if (min < 60) return `منذ ${num(min)} دقيقة`
  const h = Math.floor(min / 60)
  if (h < 24) return `منذ ${num(h)} ساعة`
  const d = Math.floor(h / 24)
  return d === 1 ? 'منذ يوم' : `منذ ${num(d)} أيام`
}

/** Local YYYY-MM-DD for a Date — avoids UTC day-shifts from toISOString. */
export const localDateStr = (d) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
