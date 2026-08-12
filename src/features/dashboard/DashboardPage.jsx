import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import Button from '@/components/ui/Button'
import Card, { CardHeader } from '@/components/ui/Card'
import StatCardsGrid from '@/components/ui/StatCardsGrid'
import Badge from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import PageHeader from '@/components/ui/PageHeader'
import PageState from '@/components/ui/PageState'
import { api } from '@/app/api'
import { num } from '@/utils/format'
import LatestSpecialistsTable from '@/features/dashboard/components/LatestSpecialistsTable'

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
      <PageState
        mode="error"
        title="تعذر تحميل لوحة المعلومات"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (!data) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل لوحة المعلومات..."
      />
    )
  }

  const { stats, revenueSeries, revenueSplit, specialists, upcomingSessions, topCourses } = data
  const yearTotal = revenueSeries.reduce((sum, p) => sum + Number(p.earnings), 0)
  const yearTotalThousands = num(Math.round(yearTotal / 1000))

  const exportReport = () => {
    const header = ['الأخصائي', 'التخصص', 'التقييم', 'الجلسات', 'الرسوم (ر.س)', 'الحالة']
    const lines = specialists.map((s) =>
      [s.name, s.specialty, s.rating, s.sessions, s.fee, s.status].join(','),
    )
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dashboard-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <PageHeader
        title="مرحباً بعودتك، محمد 👋"
        subtitle={`${todayArabic()} — هذه نظرة عامة على أداء منصة كفيل`}
        actions={
          <>
            <Button variant="outline" icon={<Icon name="download" size={18} />} onClick={exportReport}>
              تصدير التقرير
            </Button>
            <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => navigate('/specialists/add')}>
              إضافة أخصائي جديد
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <StatCardsGrid items={stats} />

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
        <LatestSpecialistsTable specialists={specialists} onViewAll={() => navigate('/specialists')} />

        <Card>
          <CardHeader
            title="الجلسات القادمة"
            subtitle="أقرب الجلسات المجدولة"
            actions={<Button variant="ghost" size="sm" onClick={() => navigate('/sessions')}>الجدول</Button>}
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
          actions={<Button variant="outline" size="sm" icon={<Icon name="eye" size={15} />} onClick={() => navigate('/courses')}>عرض التفاصيل</Button>}
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
