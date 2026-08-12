import Button from './Button'
import Icon from './Icon'
import Modal from './Modal'

/**
 * Shared destructive-action confirmation — the standard trash layout every
 * delete flow uses. The page supplies the copy and the async handler.
 */
export default function ConfirmDeleteModal({
  open,
  title,
  message,
  confirmLabel = 'حذف',
  busy = false,
  onConfirm,
  onClose,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle="لا يمكن التراجع عن هذا الإجراء"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            إلغاء
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={busy}
            icon={busy ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="trash" size={16} />}
          >
            {busy ? 'جارٍ الحذف...' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
          <Icon name="trash" size={20} />
        </span>
        <p className="text-sm leading-relaxed text-ink-soft">{message}</p>
      </div>
      {children}
    </Modal>
  )
}
