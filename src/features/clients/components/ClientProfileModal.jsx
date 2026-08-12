import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import Modal from '@/components/ui/Modal'
import { fmtDate, num } from '@/utils/format'

const STATUS_TONE = { نشط: 'success', 'غير نشط': 'neutral' }

const ACTIVITY_TONE = {
  'حجز جلسة': 'teal',
  'دفع رسوم': 'soft',
  'تقييم أخصائي': 'warning',
  'انضمام للقاء': 'mint',
  'تسجيل في برنامج': 'success',
}

/* ---------- Profile modal ---------- */
export default function ClientProfileModal({ client, onClose }) {
  const c = client
  return (
    <Modal
      open
      onClose={onClose}
      title="ملف العميل"
      subtitle={c.email}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
          <Button
            icon={<Icon name="chat" size={16} />}
            onClick={() => {
              window.location.href = `mailto:${c.email}`
            }}
          >
            مراسلة العميل
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={c.name} size={64} rounded="rounded-2xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-extrabold text-ink">{c.name}</h4>
              {c.vip && <Badge tone="warning" icon="star">عميل مميز</Badge>}
              <Badge tone={STATUS_TONE[c.status]} dot>{c.status}</Badge>
            </div>
            <p className="mt-1 text-sm font-semibold text-ink-soft">{c.city}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: 'clipboard', label: 'الجلسات', value: num(c.sessions) },
            { icon: 'wallet', label: 'إجمالي الإنفاق', value: `${num(c.spent)} ر.س` },
            { icon: 'star', label: 'التقييم', value: Number(c.rating).toFixed(1) },
            { icon: 'calendar', label: 'آخر زيارة', value: fmtDate(c.lastVisit) },
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

        <div className="flex flex-wrap gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-ink-soft">
            <Icon name="phone" size={14} className="text-primary" />
            {c.phone}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-ink-soft">
            <Icon name="mail" size={14} className="text-primary" />
            {c.email}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-ink-soft">
            <Icon name="calendar" size={14} className="text-primary" />
            انضم في {fmtDate(c.joinedAt)}
          </span>
        </div>

        <div>
          <p className="mb-2 text-sm font-extrabold text-ink">آخر النشاطات</p>
          {c.activity?.length ? (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {c.activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <Badge tone={ACTIVITY_TONE[a.type]} compact>{a.type}</Badge>
                  <span className="text-xs font-semibold text-ink-mute">{fmtDate(a.date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-line bg-surface/50 px-4 py-3 text-xs font-semibold text-ink-mute">
              لا توجد نشاطات حديثة لهذا العميل
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
