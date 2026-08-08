import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import { getSpecialistDetail } from '../data/specialistDetails'
import { fmtDate, num } from '../utils/format'

const STATUS_TONE = { نشط: 'success', معلق: 'warning', موقوف: 'danger' }
const SESSION_TONE = { مكتملة: 'success', ملغاة: 'danger' }

function Stars({ rating, size = 14, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          className={i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}
        />
      ))}
    </span>
  )
}

export default function SpecialistDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const detail = useMemo(() => getSpecialistDetail(Number(id)), [id])

  if (!detail) {
    return (
      <Card className="flex flex-col items-center px-6 py-24 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
          <Icon name="user" size={38} strokeWidth={1.6} />
        </div>
        <h2 className="mt-6 text-2xl font-extrabold text-ink">الأخصائي غير موجود</h2>
        <p className="mt-2 max-w-md text-sm text-ink-soft">
          لم نتمكن من العثور على هذا الأخصائي، قد يكون محذوفاً أو أن الرابط غير صحيح.
        </p>
        <Button variant="outline" className="mt-6" icon={<Icon name="chevron-right" size={16} />} onClick={() => navigate('/specialists')}>
          العودة لقائمة الأخصائيين
        </Button>
      </Card>
    )
  }

  const { specialist: s, sessions, breakdown, totalReviews, reviews, stats } = detail
  const completed = sessions.filter((x) => x.status === 'مكتملة').length

  const exportReport = () => {
    const header = ['العميل', 'النوع', 'التاريخ', 'الوقت', 'الرسوم (ر.س)', 'الحالة']
    const lines = sessions.map((x) =>
      [x.client, x.type, x.date, x.time, x.fee, x.status].join(','),
    )
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `specialist-${s.id}-sessions.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statCards = [
    { label: 'الجلسات المنفذة', value: num(s.sessions), icon: 'clipboard', tint: 'teal', delta: stats.deltas.sessions, hint: '+منذ الشهر الماضي' },
    { label: 'ساعات العمل', value: `${num(stats.hours)} ساعة`, icon: 'clock', tint: 'soft', delta: stats.deltas.hours, hint: 'خلال آخر 90 يوم' },
    { label: 'نسبة الحضور', value: `${stats.attendance}%`, icon: 'check', tint: 'emerald', delta: stats.deltas.attendance, hint: 'التزام العملاء بالمواعيد' },
    { label: 'أرباح آخر 30 يوم', value: `${num(stats.earnings)} ر.س`, icon: 'wallet', tint: 'white', delta: stats.deltas.earnings, hint: 'صافي عمولات المنصة' },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/specialists')}
            aria-label="رجوع"
            className="grid size-10 place-items-center rounded-xl border border-line bg-white text-ink-soft transition-colors hover:bg-mint hover:text-primary"
          >
            <Icon name="chevron-right" size={20} />
          </button>
          <div>
            <p className="text-[11px] font-medium text-ink-mute">إدارة الأخصائيين</p>
            <h2 className="text-2xl font-extrabold text-ink">تفاصيل الأخصائي</h2>
          </div>
        </div>
        <Button variant="outline" icon={<Icon name="download" size={18} />} onClick={exportReport}>
          تصدير التقرير
        </Button>
      </div>

      {/* Hero profile card */}
      <Card className="overflow-hidden">
        <div className="relative h-28 overflow-hidden bg-gradient-to-l from-primary via-primary-soft to-accent-soft">
          <div className="absolute -start-8 -top-10 size-44 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-14 end-10 size-48 rounded-full bg-accent/20 blur-2xl" />
        </div>

        <div className="relative px-5 pb-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="-mt-12 flex items-end gap-4">
              <Avatar name={s.name} size={104} rounded="rounded-2xl" className="border-4 border-white shadow-pop" />
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-extrabold text-ink">
                    {s.title} {s.name}
                  </h3>
                  {s.verified && (
                    <Badge tone="soft" compact icon="check">موثق</Badge>
                  )}
                  <Badge tone={STATUS_TONE[s.status]} dot>{s.status}</Badge>
                </div>
                <p className="mt-1 text-sm font-semibold text-ink-soft">{s.specialty}</p>
                <p className="mt-0.5 text-xs text-ink-mute">
                  انضم في {fmtDate(s.joinedAt)} · {num(s.fee)} ر.س للجلسة
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pb-1">
              <Button
                variant="outline"
                icon={<Icon name="download" size={17} />}
                onClick={exportReport}
              >
                تصدير التقرير
              </Button>
              <Button
                icon={<Icon name="chat" size={17} />}
                onClick={() => {
                  window.location.href = `mailto:${s.email}`
                }}
              >
                تواصل مع الأخصائي
              </Button>
            </div>
          </div>

          {/* Contact chips */}
          <div className="mt-4 flex flex-wrap gap-2.5 border-t border-line pt-4">
            <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-ink-soft">
              <Icon name="mail" size={15} className="text-primary" />
              {s.email}
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-ink-soft">
              <Icon name="phone" size={15} className="text-primary" />
              {s.phone}
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-ink-soft">
              <Icon name="calendar" size={15} className="text-primary" />
              {s.sessions} جلسة إجمالية
            </span>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Rating + sessions */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="التقييم العام" subtitle={`بناءً على ${num(totalReviews)} تقييم`} />
          <div className="flex flex-col items-center px-5 pb-6 pt-2">
            <p className="text-5xl font-extrabold text-ink">{s.rating.toFixed(1)}</p>
            <Stars rating={s.rating} size={18} className="mt-2" />
            <p className="mt-1.5 text-xs font-semibold text-ink-mute">من 5.0</p>

            <ul className="mt-6 w-full space-y-2">
              {breakdown.map((b) => (
                <li key={b.stars} className="flex items-center gap-3">
                  <span className="flex w-8 items-center justify-end gap-1 text-xs font-bold text-ink-soft">
                    {b.stars}
                    <Icon name="star" size={12} className="text-amber-400" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-mint">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-soft to-primary transition-all duration-700"
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-end text-xs font-bold text-ink-mute">{b.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="آخر الجلسات" subtitle={`أحدث ${sessions.length} جلسات مسجلة خلال آخر 90 يوم`} />
          <div className="overflow-x-auto pb-3">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                  <th className="px-4 py-2.5 text-start">العميل</th>
                  <th className="px-4 py-2.5 text-start">النوع</th>
                  <th className="px-4 py-2.5 text-start">التاريخ</th>
                  <th className="px-4 py-2.5 text-start">الوقت</th>
                  <th className="px-4 py-2.5 text-start">الرسوم</th>
                  <th className="px-4 py-2.5 text-start">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sessions.slice(0, 6).map((se) => (
                  <tr key={se.id} className="transition-colors hover:bg-mint/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={se.client} size={32} />
                        <span className="font-bold text-ink">{se.client}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{se.type}</td>
                    <td className="px-4 py-3 text-ink-soft">{fmtDate(se.date)}</td>
                    <td className="px-4 py-3 text-ink-soft">{se.time}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{num(se.fee)} ر.س</td>
                    <td className="px-4 py-3">
                      <Badge tone={SESSION_TONE[se.status]} dot>{se.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sessions.length > 6 && (
            <p className="px-4 pb-4 text-xs font-semibold text-ink-mute">
              + {sessions.length - 6} جلسات أخرى
            </p>
          )}
        </Card>
      </div>

      {/* Reviews */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-ink">آراء العملاء</h3>
          <Badge tone="mint">{num(reviews.length)} تقييم حديث</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-pop">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={r.client} size={40} />
                  <div>
                    <p className="text-sm font-bold text-ink">{r.client}</p>
                    <p className="text-xs text-ink-mute">{fmtDate(r.date)}</p>
                  </div>
                </div>
                <Stars rating={r.rating} size={13} />
              </div>
              <p className="mt-3.5 text-sm leading-relaxed text-ink-soft">{r.comment}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* completion note */}
      <p className="flex items-center justify-center gap-2 text-xs text-ink-mute">
        <Icon name="check" size={14} className="text-primary" />
        {completed} جلسة مكتملة من أصل {sessions.length} في آخر 90 يوم
      </p>
    </div>
  )
}
