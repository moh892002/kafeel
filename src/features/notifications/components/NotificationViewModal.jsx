import Badge from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import Modal from '@/components/ui/Modal'
import { timeAgo } from '@/utils/format'
import { TYPE_ICON, TYPE_TILE, TYPE_TONE } from '@/utils/notificationStyle'

/* ---------- Detail modal ---------- */
export default function NotificationViewModal({ notification: n, onClose }) {
  return (
    <Modal open onClose={onClose} title={n.title} subtitle={timeAgo(n.time)} size="sm">
      <div className="flex items-start gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${TYPE_TILE[n.type]}`}>
          <Icon name={TYPE_ICON[n.type]} size={20} />
        </span>
        <div>
          <Badge tone={TYPE_TONE[n.type]} compact>{n.type}</Badge>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{n.body}</p>
        </div>
      </div>
    </Modal>
  )
}
