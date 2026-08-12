import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import { allFilter, options, useMeta } from '@/app/meta'
import { STATUS_DESC, STATUS_TONE } from '../constants'

export default function StatusModal({ specialist, busy, onConfirm, onClose }) {
  const statusOptions = allFilter(options(useMeta(), 'specialistStatus'))
  const [selected, setSelected] = useState(specialist.status)

  return (
    <Modal
      open
      onClose={onClose}
      title="تغيير حالة الأخصائي"
      subtitle={`${specialist.title} ${specialist.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
          <Button
            onClick={() => onConfirm(selected)}
            disabled={busy || selected === specialist.status}
            icon={busy ? <Icon name="loader" size={16} className="animate-spin" /> : undefined}
          >
            حفظ الحالة
          </Button>
        </>
      }
    >
      <ul className="space-y-2">
        {statusOptions.filter((s) => s !== 'الكل').map((s) => {
          const active = selected === s
          return (
            <li key={s}>
              <button
                onClick={() => setSelected(s)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start transition-all ${
                  active
                    ? 'border-primary bg-mint text-primary'
                    : 'border-line bg-white text-ink-soft hover:border-primary/30 hover:text-primary'
                }`}
              >
                <span>
                  <span className="flex items-center gap-2.5 text-sm font-extrabold">
                    <Badge tone={STATUS_TONE[s]} dot>{s}</Badge>
                  </span>
                  <span className="mt-1 block text-xs text-ink-mute">{STATUS_DESC[s]}</span>
                </span>
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-all ${
                    active ? 'border-primary' : 'border-line'
                  }`}
                >
                  {active && <span className="size-2.5 rounded-full bg-primary" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
