import Icon from './Icon'

export function Input({ label, icon, className = '', id, ...rest }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <Icon
            name={icon}
            size={18}
            className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-mute"
          />
        )}
        <input
          id={id}
          className={`w-full rounded-xl border border-line bg-surface py-2.5 text-sm text-ink placeholder:text-ink-mute transition-all focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 ${
            icon ? 'ps-10' : 'px-4'
          } ${className}`}
          {...rest}
        />
      </div>
    </div>
  )
}

export function Textarea({ label, className = '', id, rows = 4, ...rest }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`w-full resize-y rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-mute transition-all focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 ${className}`}
        {...rest}
      />
    </div>
  )
}

export function Select({ label, icon, className = '', id, children, ...rest }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <Icon
            name={icon}
            size={18}
            className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-mute"
          />
        )}
        <select
          id={id}
          className={`w-full appearance-none rounded-xl border border-line bg-surface py-2.5 text-sm text-ink transition-all focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 ${
            icon ? 'ps-10' : 'px-4'
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
        <Icon
          name="chevron-down"
          size={16}
          className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-ink-mute"
        />
      </div>
    </div>
  )
}
