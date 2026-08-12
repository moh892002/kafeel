import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import { fmtDate, num } from '@/utils/format'
import { STATUS_TONE, fmtTime } from '../constants'

export default function MeetingDetailsModal({ meeting, onClose, onJoin }) {
  const m = meeting
  const pct = Math.round((m.attendees / Math.max(1, m.capacity)) * 100)
  const actionable = m.status === 'مجدول' || m.status === 'منعقد'

  return (
    <Modal
      open
      onClose={onClose}
      title="تفاصيل اللقاء"
      subtitle={`${m.type} · ${m.duration} دقيقة`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
          {actionable && (
            <Button icon={<Icon name="video" size={16} />} onClick={() => onJoin(m)}>
              {m.status === 'منعقد' ? 'الانضمام الآن' : 'الدخول للقاء'}
            </Button>
          )}
          {m.recording && (
            <Button variant="outline" icon={<Icon name="play" size={16} />} onClick={() => onJoin(m)}>
              مشاهدة التسجيل
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-lg font-extrabold text-ink">{m.title}</h4>
          <Badge tone={STATUS_TONE[m.status]} dot>
            {m.status}
          </Badge>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
          <Avatar name={m.host?.name ?? '—'} size={40} />
          <div>
            <p className="text-sm font-bold text-ink">
              {m.host?.title ?? ''} {m.host?.name ?? '—'}
            </p>
            <p className="text-xs text-ink-mute">{m.host?.specialty ?? ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: 'calendar', label: 'التاريخ', value: fmtDate(m.date) },
            { icon: 'clock', label: 'الوقت', value: fmtTime(m.time) },
            { icon: 'clock', label: 'المدة', value: `${m.duration} دقيقة` },
            { icon: 'users', label: 'المشاركون', value: `${num(m.attendees)}` },
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
            <span className="text-ink-soft">الحضور</span>
            <span className="text-primary">
              {num(m.attendees)} من {num(m.capacity)} ({pct}%)
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-soft to-primary transition-all duration-700"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3">
          <Icon name="link" size={16} className="text-primary" />
          <span className="text-sm font-semibold text-ink-soft" dir="ltr">
            {m.link ?? 'يُرسل رابط اللقاء عند بدئه'}
          </span>
        </div>
      </div>
    </Modal>
  )
}
