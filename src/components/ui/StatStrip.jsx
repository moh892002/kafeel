/**
 * Shared filter stat-strip — the clickable count cards every list page uses
 * as its primary filter. The page supplies precomputed items; the component
 * owns the card markup and active-state styling.
 */
export default function StatStrip({ items, active, onSelect, cols = 'sm:grid-cols-3 xl:grid-cols-5' }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${cols}`}>
      {items.map(({ key, value, label, valueClass, labelClass }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`rounded-2xl border px-4 py-3.5 text-start transition-all hover:-translate-y-0.5 ${
              isActive
                ? 'border-primary bg-primary text-white shadow-[0_6px_16px_rgba(7,94,102,0.35)]'
                : 'border-line bg-card shadow-card hover:shadow-pop'
            }`}
          >
            <p className={`text-2xl font-extrabold ${isActive ? 'text-white' : valueClass ?? 'text-ink'}`}>
              {value}
            </p>
            <p className={`text-xs font-semibold ${isActive ? 'text-white/70' : labelClass ?? 'text-ink-mute'}`}>
              {label}
            </p>
          </button>
        )
      })}
    </div>
  )
}
