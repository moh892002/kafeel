import Button from './Button'
import Card from './Card'
import Icon from './Icon'

/**
 * Shared full-page state block — every page's loading spinner, error card,
 * not-found card, and empty-list card all share the same card + icon + title +
 * message structure, so this one component renders every variant:
 *
 * - `mode="loading"`  — centered spinner + label
 * - `mode="error"`    — red ✕ card + title + message + «إعادة المحاولة»
 * - `mode="notFound"` — mint card + title + message (+ optional children actions)
 * - `mode="empty"`    — same shell as notFound, for empty lists
 *
 * `icon` switches the circle glyph (default ✕ for error, override for the
 * mint variants); `onRetry` replaces the default page reload; `children`
 * renders extra action buttons below the message.
 */
export default function PageState({
  mode,
  title,
  message,
  label,
  icon = 'x',
  tone = 'mint',
  onRetry,
  children,
}) {
  if (mode === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Icon name="loader" size={18} className="animate-spin" />
          {label}
        </div>
      </div>
    )
  }

  const isError = mode === 'error'
  const iconWrap = isError
    ? 'bg-red-50 text-red-500'
    : tone === 'red'
      ? 'bg-red-50 text-red-500'
      : 'bg-mint text-primary'
  const shownIcon = isError ? 'x' : icon
  const bigTitle = mode === 'notFound' || mode === 'empty'

  return (
    <Card className="flex flex-col items-center px-6 py-20 text-center">
      <div className={`grid size-20 place-items-center rounded-3xl ${iconWrap}`}>
        <Icon name={shownIcon} size={38} strokeWidth={1.6} />
      </div>
      {bigTitle ? (
        <h2 className="mt-6 text-2xl font-extrabold text-ink">{title}</h2>
      ) : (
        <h3 className="mt-5 text-lg font-extrabold text-ink">{title}</h3>
      )}
      {message && <p className="mt-2 max-w-md text-sm text-ink-soft">{message}</p>}
      {(onRetry || isError) && (
        <Button
          variant="outline"
          className="mt-6"
          onClick={onRetry ?? (() => window.location.reload())}
        >
          إعادة المحاولة
        </Button>
      )}
      {children}
    </Card>
  )
}
