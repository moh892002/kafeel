import Icon from './Icon'

/**
 * Shared inline error banner for forms and modals — the red ✕ strip shown
 * above form fields. `rounded` picks the 2xl (page-level) or xl (in-modal)
 * corner radius, `className` allows layout overrides (e.g. `sm:col-span-2`),
 * and `onDismiss` renders the close ✕ (static banners omit it).
 */
const RADIUS = {
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
}

export default function FormError({ children, rounded = 'xl', className = '', onDismiss }) {
  return (
    <div
      className={`flex items-center ${onDismiss ? 'justify-between' : ''} gap-2 ${RADIUS[rounded] ?? 'rounded-xl'} border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 animate-slide-in ${className}`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon name="x" size={16} strokeWidth={2.4} className="shrink-0" />
        <span className="min-w-0">{children}</span>
      </span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="إغلاق"
          className="grid size-6 shrink-0 place-items-center rounded-md transition-colors hover:bg-red-100"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}
