import Icon from './Icon'

const TONES = {
  mint: 'bg-mint text-primary',
  teal: 'bg-primary text-white',
  soft: 'bg-accent/20 text-accent-soft',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  neutral: 'bg-gray-100 text-ink-soft',
}

export default function Badge({ children, tone = 'mint', className = '', dot = false, icon, compact = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-xs font-semibold ${
        compact ? 'px-1.5 py-0.5' : 'px-2.5 py-1'
      } ${TONES[tone]} ${className}`}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}
