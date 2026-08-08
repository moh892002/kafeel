export default function Card({ children, className = '', ...rest }) {
  return (
    <div
      className={`rounded-card border border-line bg-card shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-2 ${className}`}>
      <div>
        <h3 className="text-base font-bold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-mute">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
