import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import { SORT_OPTIONS } from '../constants'

export default function SortModal({ current, onApply, onClose }) {
  const [selected, setSelected] = useState(`${current.key}:${current.dir}`)

  return (
    <Modal
      open
      onClose={onClose}
      title="ترتيب النتائج"
      subtitle="اختر طريقة الترتيب المفضلة"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => onApply(selected)}>تطبيق الترتيب</Button>
        </>
      }
    >
      <ul className="space-y-1.5">
        {SORT_OPTIONS.map((o) => {
          const val = `${o.key}:${o.dir}`
          const active = selected === val
          return (
            <li key={val}>
              <button
                onClick={() => setSelected(val)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                  active
                    ? 'border-accent-soft bg-mint text-primary'
                    : 'border-line bg-white text-ink-soft hover:border-primary/30 hover:text-primary'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`grid size-5 place-items-center rounded-full border-2 transition-all ${
                      active ? 'border-primary' : 'border-line'
                    }`}
                  >
                    {active && <span className="size-2.5 rounded-full bg-primary" />}
                  </span>
                  {o.label}
                </span>
                {active && <Icon name="check" size={16} strokeWidth={2.4} />}
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
