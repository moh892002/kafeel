import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { allFilter, options, useMeta } from '@/app/meta'
import { num } from '@/utils/format'
import { RATING_OPTIONS, matchSpecialist } from '../constants'

export default function FilterModal({ initial, search, specialists, specialtyOptions, onApply, onClose }) {
  const statusOptions = allFilter(options(useMeta(), 'specialistStatus'))
  const [status, setStatus] = useState(initial.status)
  const [specialties, setSpecialties] = useState(initial.specialties)
  const [minRating, setMinRating] = useState(initial.minRating)

  // Live count based on the draft selections (not the already-applied filters)
  const count = useMemo(
    () =>
      specialists.filter((s) => matchSpecialist(s, { status, specialties, minRating, search })).length,
    [specialists, search, status, specialties, minRating],
  )

  const toggleSpecialty = (s) =>
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  return (
    <Modal
      open
      onClose={onClose}
      title="تصفية الأخصائيين"
      subtitle="حدد المعايير لعرض النتائج المطابقة"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              setStatus('الكل')
              setSpecialties([])
              setMinRating(0)
            }}
          >
            إعادة تعيين
          </Button>
          <Button onClick={() => onApply({ status, specialties, minRating })}>
            عرض النتائج ({num(count)})
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Status */}
        <div>
          <p className="mb-2 text-sm font-bold text-ink">الحالة</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-xl border px-3 py-2 text-sm font-bold transition-all ${
                  status === s
                    ? 'border-primary bg-primary text-white shadow-[0_4px_10px_rgba(7,94,102,0.3)]'
                    : 'border-line bg-surface text-ink-soft hover:border-primary/30 hover:text-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div>
          <p className="mb-2 text-sm font-bold text-ink">التخصص</p>
          <div className="flex flex-wrap gap-2">
            {specialtyOptions.map((s) => {
              const active = specialties.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'border-accent-soft bg-mint text-primary'
                      : 'border-line bg-surface text-ink-soft hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Min rating */}
        <div>
          <p className="mb-2 text-sm font-bold text-ink">الحد الأدنى للتقييم</p>
          <Select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} icon="star">
            {RATING_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Modal>
  )
}
