import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import { api } from '../api'
import { num } from '../utils/format'

/* Stat-card presentation per dashboard slot (label comes from the API). */
const STAT_PRESENTATION = [
  { icon: 'wallet', tint: 'teal', money: true },
  { icon: 'users', tint: 'soft' },
  { icon: 'user-check', tint: 'white' },
  { icon: 'book', tint: 'emerald' },
]

const STATUS_TONE = { نشط: 'success', معلق: 'warning', موقوف: 'danger' }
const SESSION_TONE = { محجوزة: 'success', 'قيد الانتظار': 'warning', مكتملة: 'neutral', ملغاة: 'danger' }

function todayArabic() {
  // ar-SA defaults to the Hijri calendar; pin Gregorian + Latin digits to match the design
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

/* ---------- Recharts tooltip styled to the theme ---------- */
function ChartTooltip({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-pop">
      {label && <p className="mb-1 text-xs font-bold text-ink-mute">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-extrabold text-primary">
          {p.value.toLocaleString('en-US')}
          {suffix}
        </p>
      ))}
    </div>
  )
}

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-pop">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <span className="size-2.5 rounded-full" style={{ background: p.payload.color }} />
        {p.name}: <span className="font-extrabold text-primary">{p.value}%</span>
      </p>
    </div>
  )
}

/* ---------- Dashboard page ---------- */
export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.dashboard()
      .then((d) => {
        if (cancelled) return
        setData({
          ...d,
          stats: d.stats.map((s, i) => ({
            ...s,
            icon: STAT_PRESENTATION[i]?.icon ?? 'chart',
            tint: STAT_PRESENTATION[i]?.tint ?? 'teal',
            value: STAT_PRESENTATION[i]?.money ? `${num(Number(s.value))} ر.س` : num(Number(s.value)),
          })),
          specialists: d.specialists.map((s) => ({ ...s, tone: STATUS_TONE[s.status] ?? 'neutral' })),
          upcomingSessions: d.upcomingSessions.map((s) => ({ ...s, tone: SESSION_TONE[s.status] ?? 'neutral' })),
        })
      })
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <Card className="flex flex-col items-center px-6 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-red-50 text-red-500">
          <Icon name="x" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">تعذر تحميل لوحة المعلومات</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{error}</p>
        <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </Card>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Icon name="loader" size={18} className="animate-spin" />
          جاري تحميل لوحة المعلومات...
        </div>
      </div>
    )
  }

  const { stats, revenueSeries, revenueSplit, specialists, upcomingSessions, topCourses } = data
  const yearTotal = revenueSeries.reduce((sum, p) => sum + Number(p.earnings), 0)
  const yearTotalThousands = num(Math.round(yearTotal / 1000))

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">مرحباً بعودتك، محمد 👋</h2>
          <p className="mt-1 text-sm text-ink-soft">{todayArabic()} — هذه نظرة عامة على أداء منصة كفيل</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" icon={<Icon name="download" size={18} />}>
            تصدير التقرير
          </Button>
          <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => navigate('/specialists/add')}>
            إضافة أخصائي جديد
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="الأرباح الشهرية"
            subtitle="إجمالي الأرباح (ر.س) خلال آخر 12 شهراً"
            actions={
              <Badge tone="teal" dot>محدث الآن</Badge>
            }
          />
          <div className="px-2 pb-3 pt-2" style={{ direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#075e66" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#075e66" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e8eeec" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#8fa3a4', fontFamily: 'Cairo' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8fa3a4' }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<ChartTooltip suffix=" ر.س" />} cursor={{ stroke: '#75bcba', strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#075e66"
                  strokeWidth={3}
                  fill="url(#earningsFill)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#075e66', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="مصادر الأرباح" subtitle="النسبة المئوية حسب الخدمة" />
          <div className="flex flex-col items-center px-5 pb-5">
            <div className="relative h-52 w-full" style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueSplit}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={86}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {revenueSplit.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-ink">{yearTotalThousands}</p>
                  <p className="text-[11px] font-semibold text-ink-mute">ألف ر.س سنوياً</p>
                </div>
              </div>
            </div>
            <ul className="mt-4 w-full space-y-2.5">
              {revenueSplit.map((item) => (
                <li key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-ink-soft">
                    <span className="size-2.5 rounded-full" style={{ background: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-extrabold text-ink">{item.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Specialists + upcoming sessions */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="أحدث الأخصائيين"
            subtitle="أحدث الأخصائيين المنضمين للمنصة"
            actions={<Button variant="ghost" size="sm">عرض الكل</Button>}
          />
          <div className="overflow-x-auto px-2 pb-3">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-start text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                  <th className="px-3 py-2.5 text-start">الأخصائي</th>
                  <th className="px-3 py-2.5 text-start">التقييم</th>
                  <th className="px-3 py-2.5 text-start">الجلسات</th>
                  <th className="px-3 py-2.5 text-start">الحالة</th>
                  <th className="px-3 py-2.5 text-end">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {specialists.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-mint/40">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size={38} />
                        <div>
                          <p className="font-bold text-ink">{s.name}</p>
                          <p className="text-xs text-ink-mute">{s.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 font-bold text-ink">
                        <Icon name="star" size={14} className="text-amber-400" />
                        {s.rating}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink-soft">{s.sessions}</td>
                    <td className="px-3 py-3">
                      <Badge tone={s.tone} dot>{s.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-end">
                      <button className="rounded-lg p-2 text-ink-mute transition-colors hover:bg-mint hover:text-primary">
                        <Icon name="more-v" size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="الجلسات القادمة"
            subtitle="أقرب الجلسات المجدولة"
            actions={<Button variant="ghost" size="sm">الجدول</Button>}
          />
          <ul className="space-y-1 px-3 pb-4">
            {upcomingSessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-mint/40"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint text-primary">
                  <Icon name="calendar" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{s.client}</p>
                  <p className="truncate text-xs text-ink-mute">
                    {s.specialist} · {s.time}
                  </p>
                </div>
                <Badge tone={s.tone} className="shrink-0">{s.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Top courses */}
      <Card>
        <CardHeader
          title="الدورات الأكثر إقبالاً"
          subtitle="نسبة اكتمال التسجيل في الدورات"
          actions={<Button variant="outline" size="sm" icon={<Icon name="eye" size={15} />}>عرض التفاصيل</Button>}
        />
        <div className="space-y-5 px-5 pb-6 pt-2">
          {topCourses.map((c) => {
            const pct = c.total > 0 ? Math.round((c.enrolled / c.total) * 100) : 0
            return (
              <div key={c.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <p className="font-bold text-ink">{c.title}</p>
                  <p className="font-semibold text-ink-soft">
                    {c.enrolled.toLocaleString('en-US')} / {c.total.toLocaleString('en-US')}
                    <span className="ms-2 text-xs font-extrabold text-primary">{pct}%</span>
                  </p>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-mint">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-soft to-primary transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
