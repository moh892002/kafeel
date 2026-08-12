import Icon from './Icon'

/**
 * Shared page-level notice toast. Accepts either the { text, tone } shape the
 * pages already use (`tone: 'success' | 'error'`) or a plain string (treated
 * as success), and always renders the dismiss ✕ via `onDismiss`.
 */
export default function Notice({ text, tone = 'success', onDismiss }) {
  const isError = tone === 'error'
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold animate-slide-in ${
        isError ? 'border-red-200 bg-red-50 text-red-600' : 'border-accent-soft/30 bg-mint text-primary'
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon name={isError ? 'x' : 'check'} size={16} strokeWidth={2.4} />
        {text}
      </span>
      <button
        onClick={onDismiss}
        aria-label="إغلاق"
        className={`grid size-6 place-items-center rounded-md transition-colors ${
          isError ? 'hover:bg-red-100' : 'hover:bg-accent/30'
        }`}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}
