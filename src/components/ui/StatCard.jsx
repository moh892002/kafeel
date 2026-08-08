import Icon from './Icon'

const TINTS = {
  teal: 'bg-mint text-primary',
  soft: 'bg-accent/15 text-accent-soft',
  white: 'bg-primary text-white',
  amber: 'bg-amber-100 text-amber-600',
  rose: 'bg-rose-100 text-rose-500',
  emerald: 'bg-emerald-100 text-emerald-600',
}

export default function StatCard({ label, value, icon, delta, tint = 'teal', note, hint }) {
  const up = delta >= 0
  return (
    <div className="group relative overflow-hidden rounded-card border border-line bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${TINTS[tint]} transition-transform duration-300 group-hover:scale-105`}>
          <Icon name={icon} size={22} />
        </div>
        {delta !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}
            title={note || hint}
          >
            <Icon name={up ? 'arrow-up' : 'arrow-down'} size={12} strokeWidth={2.2} />
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-sm font-medium text-ink-soft">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-ink-mute">{hint}</p>}
    </div>
  )
}
