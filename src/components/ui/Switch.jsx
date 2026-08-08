export default function Switch({ checked, onChange, label, description, id }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-start transition-colors hover:bg-mint/50"
    >
      <span className="min-w-0">
        {label && <span className="block text-sm font-bold text-ink">{label}</span>}
        {description && <span className="mt-0.5 block text-xs text-ink-mute">{description}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-primary' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-200 ${
            checked ? 'start-[22px]' : 'start-0.5'
          }`}
        />
      </span>
    </button>
  )
}
