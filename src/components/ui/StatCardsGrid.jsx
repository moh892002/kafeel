import StatCard from './StatCard'

/**
 * Shared stat-cards row — the responsive grid every page uses to present its
 * StatCard items. `items` are plain StatCard props ({ label, value, icon,
 * tint, delta, hint }); `cols` overrides the default 1/2/4-column grid.
 */
export default function StatCardsGrid({ items, cols = 'sm:grid-cols-2 xl:grid-cols-4' }) {
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols}`}>
      {items.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  )
}
