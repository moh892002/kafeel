import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import { api } from '@/app/api'
import { fmtDate, num } from '@/utils/format'
import { options, useMeta } from '@/app/meta'
import { STATUS_TONE } from '../constants'

const ENROLL_SELECT_TONE = {
  'مكتمل الدفع': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'بانتظار الدفع': 'border-amber-200 bg-amber-50 text-amber-700',
  مسترد: 'border-red-200 bg-red-50 text-red-600',
}

export default function ProgramDetailsModal({ program, onClose, onRegister }) {
  const p = program
  const meta = useMeta()
  const pct = Math.round((p.enrolled / Math.max(1, p.capacity)) * 100)

  const [enrollments, setEnrollments] = useState([])
  const [enrollBusy, setEnrollBusy] = useState(null) // enrollment id being patched
  const [removing, setRemoving] = useState(null) // enrollment id being deleted

  // Live enrollment list so status changes reflect immediately (not just the count)
  useEffect(() => {
    let cancelled = false
    api
      .programEnrollments(p.id)
      .then((list) => {
        if (!cancelled) setEnrollments(list ?? [])
      })
      .catch(() => {
        /* list is secondary — the register flow still works */
      })
    return () => {
      cancelled = true
    }
  }, [p.id])

  const changeStatus = async (enrollment, next) => {
    if (next === enrollment.status) return
    setEnrollBusy(enrollment.id)
    try {
      await api.updateProgramEnrollmentStatus(p.id, enrollment.id, next)
      setEnrollments((prev) => prev.map((e) => (e.id === enrollment.id ? { ...e, status: next } : e)))
    } catch {
      /* keep the previous status on failure */
    } finally {
      setEnrollBusy(null)
    }
  }

  const removeEnrollment = async (enrollment) => {
    setRemoving(enrollment.id)
    try {
      await api.deleteProgramEnrollment(p.id, enrollment.id)
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollment.id))
    } catch {
      /* keep the row on failure */
    } finally {
      setRemoving(null)
    }
  }

  // The status select stays valid even before meta loads
  const enrollStatusOptions = options(meta, 'enrollmentStatus')
  const statusesFor = (current) =>
    enrollStatusOptions.includes(current) ? enrollStatusOptions : [current, ...enrollStatusOptions]

  return (
    <Modal
      open
      onClose={onClose}
      title="تفاصيل البرنامج"
      subtitle={`${p.category} · ${p.sessions} جلسات`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
          {p.status === 'مفتوح' &&
            (p.capacity > 0 && p.enrolled >= p.capacity ? (
              <Button disabled>
                <Icon name="x" size={16} strokeWidth={2.4} className="mr-1" />
                البرنامج ممتلئ
              </Button>
            ) : (
              <Button icon={<Icon name="check" size={16} />} onClick={onRegister}>
                سجّل الآن
              </Button>
            ))}
        </>
      }
    >
      <div className="space-y-4">
        <div className={`h-24 overflow-hidden rounded-2xl bg-gradient-to-l ${p.cover ?? 'from-primary to-accent-soft'}`}>
          <div className="flex h-full items-center justify-between px-5">
            <p className="max-w-[70%] text-lg font-extrabold text-white">{p.title}</p>
            <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-ink-soft">{p.description}</p>

        <div className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
          <Avatar name={p.instructor?.name ?? '—'} size={40} />
          <div>
            <p className="text-sm font-bold text-ink">
              {p.instructor?.title ?? ''} {p.instructor?.name ?? '—'}
            </p>
            <p className="text-xs text-ink-mute">{p.instructor?.specialty ?? ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: 'calendar', label: 'تاريخ البدء', value: fmtDate(p.startDate) },
            { icon: 'clipboard', label: 'عدد الجلسات', value: `${p.sessions} جلسة` },
            { icon: 'wallet', label: 'السعر', value: Number(p.price) === 0 ? 'مجاني' : `${num(p.price)} ر.س` },
            { icon: 'star', label: 'التقييم', value: Number(p.rating ?? 0).toFixed(1) },
          ].map((x) => (
            <div key={x.label} className="rounded-xl border border-line bg-white px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-mute">
                <Icon name={x.icon} size={13} className="text-primary" />
                {x.label}
              </p>
              <p className="mt-1 truncate text-sm font-extrabold text-ink">{x.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-mint px-4 py-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-ink-soft">المسجلون</span>
            <span className="text-primary">
              {num(p.enrolled)} من {num(p.capacity)} ({pct}%)
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-soft to-primary transition-all duration-700"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        {/* Live enrollments */}
        <div>
          <p className="mb-2 text-xs font-extrabold text-ink-mute">المسجلون ({enrollments.length})</p>
          {enrollments.length === 0 ? (
            <p className="rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-ink-mute">
              لا توجد تسجيلات بعد — استخدم «سجّل الآن» لإضافة أول مسجل.
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-white">
              {enrollments.map((e) => (
                <li key={e.id} className="group flex items-center gap-3 p-2.5 transition-colors hover:bg-mint/30">
                  <Avatar name={e.clientName} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{e.clientName}</p>
                    <p className="truncate text-xs text-ink-mute">
                      {fmtDate(e.date)} · {e.method}
                    </p>
                  </div>
                  <select
                    value={e.status}
                    disabled={enrollBusy === e.id}
                    onChange={(ev) => changeStatus(e, ev.target.value)}
                    aria-label={`حالة تسجيل ${e.clientName}`}
                    className={`shrink-0 cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-extrabold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-wait disabled:opacity-60 ${
                      ENROLL_SELECT_TONE[e.status] ?? 'border-line bg-surface text-ink-soft'
                    }`}
                  >
                    {statusesFor(e.status).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    title="حذف التسجيل"
                    aria-label={`حذف تسجيل ${e.clientName}`}
                    disabled={removing === e.id}
                    onClick={() => removeEnrollment(e)}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-mute opacity-60 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:cursor-wait disabled:opacity-40"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
