import { useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/Icon'

/**
 * Shared page header — the title + subtitle + action(s) row every page opens
 * with. `kicker` renders the small eyebrow line above the title (used on
 * detail/form pages); `backTo` renders the back button and navigates there.
 */
function BackButton({ to }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      aria-label="رجوع"
      className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink-soft transition-colors hover:bg-mint hover:text-primary"
    >
      <Icon name="chevron-right" size={20} />
    </button>
  )
}

export default function PageHeader({ title, subtitle, kicker, backTo, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className={backTo ? 'flex items-center gap-3' : ''}>
        {backTo && <BackButton to={backTo} />}
        <div>
          {kicker && <p className="text-[11px] font-medium text-ink-mute">{kicker}</p>}
          <h2 className="text-2xl font-extrabold text-ink">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}
