import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import { fmtDate, num } from '@/utils/format'
import { STATUS_TONE, fmtTime } from '../constants'

/* ---------- Info row helper ---------- */
function Info({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-mint text-primary">
        <Icon name={icon} size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-ink-mute">{label}</p>
        <p className="truncate text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  )
}

export default function SessionDetailsModal({ session, onClose, onUpdate }) {
  const s = session
  const canConfirm = s.status === 'محجوزة'
  const canApprove = s.status === 'قيد الانتظار'

  return (
    <Modal
      open
      onClose={onClose}
      title="تفاصيل الجلسة"
      subtitle={`رقم الجلسة #${s.id} · ${s.specialty}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
          {(canConfirm || canApprove) && (
            <Button
              variant="danger"
              icon={<Icon name="x" size={16} />}
              onClick={() => onUpdate({ ...s, status: 'ملغاة' })}
            >
              {canConfirm ? 'إلغاء الجلسة' : 'رفض الحجز'}
            </Button>
          )}
          {canConfirm && (
            <Button
              icon={<Icon name="check" size={16} />}
              onClick={() => onUpdate({ ...s, status: 'مكتملة' })}
            >
              تأكيد الحضور
            </Button>
          )}
          {canApprove && (
            <Button
              icon={<Icon name="check" size={16} />}
              onClick={() => onUpdate({ ...s, status: 'محجوزة' })}
            >
              تأكيد الحجز
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={s.client} size={52} />
          <div>
            <p className="text-base font-extrabold text-ink">{s.client}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge tone={STATUS_TONE[s.status]} dot>
                {s.status}
              </Badge>
              <span className="text-xs font-semibold text-ink-mute">{s.payment}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Info icon="user-check" label="الأخصائي" value={`${s.specialistTitle} ${s.specialistName}`} />
          <Info icon="video" label="نوع الجلسة" value={s.type} />
          <Info icon="calendar" label="الموعد" value={`${fmtDate(s.date)} · ${fmtTime(s.time)}`} />
          <Info icon="clock" label="المدة" value="ساعة واحدة" />
          <Info icon="wallet" label="الرسوم" value={`${num(s.fee)} ر.س`} />
          <Info icon="banknote" label="وسيلة الدفع" value={s.payment} />
          <Info icon="target" label="مكان الانعقاد" value={s.location} />
          <Info icon="shield" label="رقم الجلسة" value={`#${s.id}`} />
        </div>
        {s.note && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-bold text-amber-700">
              <Icon name="bell" size={14} />
              ملاحظات
            </p>
            <p className="mt-1 text-sm text-ink-soft">{s.note}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
