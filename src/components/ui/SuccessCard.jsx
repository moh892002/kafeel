import Card from './Card'
import Icon from './Icon'

/**
 * Shared post-submit confirmation screen — the animated ✓ card shown after a
 * form succeeds (CourseForm, AddSpecialist). `title` is the headline, `message`
 * is rendered as-is below it (callers may pass JSX — the rich message in
 * CourseForm embeds a highlighted course title), and `actions` renders the
 * action-button row.
 */
export default function SuccessCard({ title, message, actions }) {
  return (
    <Card className="flex flex-col items-center px-6 py-16 text-center">
      <div className="grid size-24 animate-pop-in place-items-center rounded-full bg-mint text-primary">
        <Icon name="check" size={44} strokeWidth={2.4} />
      </div>
      <h2 className="mt-6 text-2xl font-extrabold text-ink">{title}</h2>
      {message}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2.5">{actions}</div>}
    </Card>
  )
}
