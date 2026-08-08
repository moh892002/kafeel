import Icon from './Icon'

export default function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const start = Math.max(1, Math.min(page - 2, pages - 4))
  const end = Math.min(pages, start + 4)
  const nums = []
  for (let i = start; i <= end; i += 1) nums.push(i)

  const navBtn =
    'grid size-9 place-items-center rounded-xl border border-line bg-white text-sm font-bold text-ink-soft transition-all hover:border-primary/30 hover:text-primary disabled:pointer-events-none disabled:opacity-40'
  const pageBtn = (active) =>
    `grid size-9 place-items-center rounded-xl border text-sm font-bold transition-all ${
      active
        ? 'border-primary bg-primary text-white shadow-[0_4px_10px_rgba(7,94,102,0.35)]'
        : 'border-line bg-white text-ink-soft hover:border-primary/30 hover:text-primary'
    }`

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
      <p className="text-xs font-semibold text-ink-mute">
        عرض <span className="font-extrabold text-ink">{from.toLocaleString('en-US')}–{to.toLocaleString('en-US')}</span> من{' '}
        <span className="font-extrabold text-ink">{total.toLocaleString('en-US')}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          className={navBtn}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="الصفحة السابقة"
        >
          <Icon name="chevron-right" size={16} />
        </button>
        {nums.map((n) => (
          <button
            key={n}
            className={pageBtn(n === page)}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
        <button
          className={navBtn}
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          aria-label="الصفحة التالية"
        >
          <Icon name="chevron-left" size={16} />
        </button>
      </div>
    </div>
  )
}
