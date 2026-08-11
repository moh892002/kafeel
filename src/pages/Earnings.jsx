import { useEffect, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import { api } from '../api'
import { PERIODS } from '../data/earnings'
import { fmtDate, num } from '../utils/format'

const TX_TONE = { مكتمل: 'success', 'قيد المعالجة': 'warning', مسترد: 'danger' }

function Legend({ items }) {
  return (
    <div className="flex items-center gap-4 text-xs font-semibold text-ink-soft">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className="h-1 w-5 rounded-full" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-pop">
      {label && <p className="mb-1 text-xs font-bold text-ink-mute">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-sm font-extrabold text-ink">
          <span className="size-2.5 rounded-full" style={{ background: p.stroke ?? p.fill }} />
          {num(Math.round(p.value))} ر.س
          {p.dataKey === 'prev' && <span className="text-[10px] font-bold text-ink-mute">(السابقة)</span>}
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

export default function Earnings() {
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.earningsSummary(period)
      .then((d) => {
        if (cancelled) return
        setData(d)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period])

  if (error) {
    return (
      <Card className="flex flex-col items-center px-6 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-red-50 text-red-500">
          <Icon name="x" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">تعذر تحميل الأرباح</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{error}</p>
        <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </Card>
    )
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Icon name="loader" size={18} className="animate-spin" />
          جاري تحميل ملخص الأرباح...
        </div>
      </div>
    )
  }

  const total = Number(data.total)
  const prevTotal = Number(data.prevTotal)
  const delta = Number(data.delta)
  const split = data.split ?? []
  const transactions = data.transactions ?? []
  const chartData = (data.series ?? []).map((p) => ({ label: p.label, current: Number(p.current), prev: Number(p.prev) }))

  // The API reports full SAR values (no thousands) — the leaderboard card is built
  // from the biggest real transactions of the period.
  const top = [...transactions].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5)
  const maxEarnings = Math.max(...top.map((t) => Number(t.amount)), 1)

  const stats = [
    {
      label: 'إجمالي الأرباح',
      value: `${num(Math.round(total))} ر.س`,
      icon: 'wallet',
      tint: 'teal',
      delta,
      hint: `مقارنة بالفترة السابقة (${num(Math.round(prevTotal))} ر.س)`,
    },
    { label: 'عدد المعاملات', value: num(data.totalTx), icon: 'clipboard', tint: 'soft', hint: 'معاملة ناجحة خلال الفترة' },
    { label: 'متوسط قيمة المعاملة', value: `${num(Math.round(Number(data.avgTx)))} ر.س`, icon: 'trending-up', tint: 'white', hint: 'إجمالي الأرباح مقسوم على عدد المعاملات' },
    { label: 'العمولات المحصلة', value: `${num(Math.round(Number(data.commission)))} ر.س`, icon: 'banknote', tint: 'emerald', hint: 'نسبة المنصة من المعاملات المكتملة' },
  ]

  const exportCsv = () => {
    const header = ['المعاملة', 'العميل', 'الخدمة', 'طريقة الدفع', 'التاريخ', 'المبلغ (ر.س)', 'العمولة', 'الحالة']
    const lines = transactions.map((t) =>
      [t.reference, t.client, t.service, t.method, t.date, t.amount, t.commission, t.status].join(','),
    )
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `earnings-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">الأرباح</h2>
          <p className="mt-1 text-sm text-ink-soft">
            ملخص الإيرادات والعمولات — {PERIODS.find((p) => p.key === period)?.title}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period filter */}
          <div className="flex rounded-xl border border-line bg-white p-1 shadow-card">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                  period === p.key
                    ? 'bg-primary text-white shadow-[0_3px_8px_rgba(7,94,102,0.35)]'
                    : 'text-ink-soft hover:text-primary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" icon={<Icon name="download" size={17} />} onClick={exportCsv}>
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Area chart + donut */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="الأرباح خلال الفترة"
            subtitle="مقارنة مع الفترة السابقة (ر.س)"
            actions={<Legend items={[{ label: 'الفترة الحالية', color: '#075e66' }, { label: 'الفترة السابقة', color: '#c4d6d5' }]} />}
          />
          <div className="px-2 pb-3 pt-2" style={{ direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#075e66" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#075e66" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#e8eeec" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#8fa3a4', fontFamily: 'Cairo' }}
                  axisLine={false}
                  tickLine={false}
                  interval={period === 'month' ? 4 : 0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8fa3a4' }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#75bcba', strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="prev"
                  stroke="#c4d6d5"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  fill="none"
                  dot={false}
                  activeDot={{ r: 4, fill: '#c4d6d5', stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="current"
                  stroke="#075e66"
                  strokeWidth={3}
                  fill="url(#earnFill)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#075e66', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="توزيع الأرباح" subtitle="حسب الخدمة المقدمة" />
          <div className="flex flex-col items-center px-5 pb-5">
            <div className="relative h-52 w-full" style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={split}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={86}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {split.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-2xl font-extrabold text-ink">{num(Math.round(total))}</p>
                  <p className="text-[11px] font-semibold text-ink-mute">ر.س</p>
                </div>
              </div>
            </div>
            <ul className="mt-4 w-full space-y-2.5">
              {split.map((item) => (
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

      {/* Bar chart + leaderboard */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="الأرباح حسب الخدمة" subtitle="النسبة المئوية لكل خدمة من إجمالي الفترة" />
          <div className="px-2 pb-3 pt-2" style={{ direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={split} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e8eeec" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#8fa3a4', fontFamily: 'Cairo' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8fa3a4' }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(7,94,102,0.05)' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-pop">
                        <p className="mb-1 text-xs font-bold text-ink-mute">{label}</p>
                        <p className="text-sm font-extrabold text-primary">
                          {num(Math.round((total * Number(payload[0].value)) / 100))} ر.س
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={44}>
                  {split.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="أعلى المعاملات في الفترة" subtitle="أكبر 5 معاملات مالية" />
          {top.length === 0 ? (
            <p className="px-5 pb-6 text-sm font-semibold text-ink-mute">لا توجد معاملات في هذه الفترة.</p>
          ) : (
            <ul className="space-y-4 px-5 pb-6 pt-1">
              {top.map((t, i) => {
                const amount = Number(t.amount)
                return (
                  <li key={t.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold ${
                            i === 0 ? 'bg-primary text-white' : i === 1 ? 'bg-accent-soft text-white' : 'bg-mint text-primary'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <Avatar name={t.client} size={30} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-ink">{t.client}</span>
                          <span className="block truncate text-[11px] text-ink-mute">{t.service}</span>
                        </span>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold text-ink">{num(amount)} ر.س</span>
                    </div>
                    <div className="ms-11 h-2 overflow-hidden rounded-full bg-mint">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-soft to-primary transition-all duration-700"
                        style={{ width: `${(amount / maxEarnings) * 100}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Transactions */}
      <Card className="overflow-hidden">
        <CardHeader
          title="آخر المعاملات"
          subtitle={`المعاملات المالية خلال ${PERIODS.find((p) => p.key === period)?.title}`}
          actions={<Badge tone="mint">{num(transactions.length)} معاملة</Badge>}
        />
        <div className="overflow-x-auto pb-3">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface/60 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                <th className="px-5 py-3 text-start">المعاملة</th>
                <th className="px-4 py-3 text-start">العميل</th>
                <th className="px-4 py-3 text-start">الخدمة</th>
                <th className="px-4 py-3 text-start">طريقة الدفع</th>
                <th className="px-4 py-3 text-start">التاريخ</th>
                <th className="px-4 py-3 text-start">المبلغ</th>
                <th className="px-4 py-3 text-start">العمولة</th>
                <th className="px-5 py-3 text-start">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {transactions.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-mint/40">
                  <td className="px-5 py-3.5 font-extrabold text-primary">{t.reference}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={t.client} size={32} />
                      <span className="font-bold text-ink">{t.client}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-ink-soft">{t.service}</td>
                  <td className="px-4 py-3.5 text-ink-soft">{t.method}</td>
                  <td className="px-4 py-3.5 text-ink-soft">{fmtDate(t.date)}</td>
                  <td className="px-4 py-3.5 font-extrabold text-ink">{num(t.amount)} ر.س</td>
                  <td className="px-4 py-3.5 text-ink-soft">{num(t.commission)} ر.س</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={TX_TONE[t.status]} dot>{t.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
