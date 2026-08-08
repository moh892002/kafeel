import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { Input, Select, Textarea } from '../components/ui/Input'
import { SPECIALISTS } from '../data/specialists'
import {
  CLIENT_OPTIONS,
  feeFor,
  loadSessions,
  localDateStr,
  nextSessionId,
  PAYMENT_METHODS,
  persistSessions,
  SESSION_STATUSES,
  SESSION_TYPES,
} from '../data/sessions'
import { fmtDate, num } from '../utils/format'

const PAGE_SIZE = 8

const STATUS_TONE = { محجوزة: 'teal', مكتملة: 'success', ملغاة: 'danger', 'قيد الانتظار': 'warning' }
const DOT = { محجوزة: 'bg-accent-soft', مكتملة: 'bg-emerald-500', ملغاة: 'bg-red-400', 'قيد الانتظار': 'bg-amber-400' }
const CHIP_STYLE = {
  محجوزة: 'bg-accent-soft text-white',
  مكتملة: 'bg-emerald-100 text-emerald-700',
  ملغاة: 'bg-red-100 text-red-400 line-through',
  'قيد الانتظار': 'bg-amber-100 text-amber-600',
}

const SORT_OPTIONS = [
  { key: 'datetime', dir: 'asc', label: 'الأقرب موعداً' },
  { key: 'datetime', dir: 'desc', label: 'الأبعد موعداً' },
  { key: 'fee', dir: 'desc', label: 'الأعلى رسوماً' },
  { key: 'client', dir: 'asc', label: 'اسم العميل' },
]

const STAT_LABEL = {
  'الكل': 'إجمالي الجلسات',
  محجوزة: 'جلسة محجوزة',
  مكتملة: 'جلسة مكتملة',
  ملغاة: 'جلسة ملغاة',
  'قيد الانتظار': 'بانتظار التأكيد',
}

const DAY_HEADERS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

const fmtTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'ص' : 'م'}`
}

/** Day cells for a month, Saturday-first — flows right-to-left inside the RTL grid. */
function buildMonthGrid(y, m) {
  const days = new Date(y, m + 1, 0).getDate()
  const offset = (new Date(y, m, 1).getDay() + 1) % 7
  const cells = Array(offset).fill(null)
  for (let d = 1; d <= days; d += 1) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/* ---------- Calendar view ---------- */
function CalendarView({ sessions, onSessionClick }) {
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [selected, setSelected] = useState(localDateStr(now))
  const todayStr = localDateStr(now)

  const byDate = useMemo(() => {
    const map = {}
    sessions.forEach((s) => {
      map[s.date] = map[s.date] || []
      map[s.date].push(s)
    })
    return map
  }, [sessions])

  const cells = useMemo(() => buildMonthGrid(ym.y, ym.m), [ym])
  const monthLabel = new Intl.DateTimeFormat('ar', { month: 'long', year: 'numeric' }).format(
    new Date(ym.y, ym.m, 1),
  )
  const daySessions = byDate[selected] || []

  const move = (delta) => {
    setYm(({ y, m }) => {
      const d = new Date(y, m + delta, 1)
      setSelected(localDateStr(d)) // keep the day panel inside the visible month
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  const goToday = () => {
    const t = new Date()
    setYm({ y: t.getFullYear(), m: t.getMonth() })
    setSelected(localDateStr(t))
  }

  const navBtn =
    'grid size-9 place-items-center rounded-xl border border-line bg-white text-ink-soft transition-all hover:border-primary/30 hover:text-primary'

  return (
    <Card className="overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <button aria-label="الشهر السابق" className={navBtn} onClick={() => move(-1)}>
            <Icon name="chevron-right" size={16} />
          </button>
          <h3 className="min-w-[150px] text-center text-base font-extrabold text-ink">{monthLabel}</h3>
          <button aria-label="الشهر التالي" className={navBtn} onClick={() => move(1)}>
            <Icon name="chevron-left" size={16} />
          </button>
        </div>
        <Button size="sm" variant="outline" icon={<Icon name="calendar" size={15} />} onClick={goToday}>
          اليوم
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-b border-line px-5 py-2.5">
        {SESSION_STATUSES.slice(1).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-mute">
            <span className={`size-2.5 rounded-full ${DOT[s]}`} />
            {s}
          </span>
        ))}
      </div>

      {/* Month grid */}
      <div className="px-4 pb-4 pt-4">
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-extrabold text-ink-mute">
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={`empty-${i}`} />
            const key = localDateStr(new Date(ym.y, ym.m, d))
            const list = byDate[key] || []
            const isToday = key === todayStr
            const isSelected = key === selected
            return (
              <div
                key={key}
                tabIndex={0}
                onClick={() => setSelected(key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(key)
                  }
                }}
                className={`min-h-[88px] cursor-pointer rounded-xl border p-1.5 transition-all ${
                  isSelected
                    ? 'border-primary bg-mint/60 shadow-[0_3px_10px_rgba(7,94,102,0.18)]'
                    : 'border-line bg-white hover:border-accent-soft/50 hover:shadow-card'
                }`}
              >
                <span
                  className={`flex size-6 items-center justify-center rounded-lg text-xs font-extrabold ${
                    isSelected
                      ? 'bg-primary text-white'
                      : isToday
                        ? 'bg-accent text-primary-dark'
                        : 'text-ink-soft'
                  }`}
                >
                  {d}
                </span>
                <div className="mt-1 space-y-1">
                  {list.slice(0, 3).map((s) => (
                    <button
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSessionClick(s)
                      }}
                      title={`${s.client} · ${s.type}`}
                      className={`block w-full truncate rounded-md px-1.5 py-0.5 text-start text-[10px] font-bold leading-4 transition-transform hover:scale-[1.03] ${CHIP_STYLE[s.status]}`}
                    >
                      {fmtTime(s.time)} · {s.client}
                    </button>
                  ))}
                  {list.length > 3 && (
                    <span className="block px-1.5 text-[10px] font-extrabold text-ink-mute">
                      +{list.length - 3} جلسات
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected-day panel */}
      <div className="border-t border-line">
        <CardHeader
          title={`جلسات ${fmtDate(selected)}`}
          subtitle={`${daySessions.length} جلسة في هذا اليوم`}
        />
        <div className="pb-4">
          {daySessions.length === 0 ? (
            <p className="px-5 pb-4 text-sm font-semibold text-ink-mute">
              لا توجد جلسات مجدولة في هذا اليوم — استخدم «حجز جلسة جديدة».
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {daySessions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-mint/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`size-2 shrink-0 rounded-full ${DOT[s.status]}`} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{s.client}</p>
                      <p className="text-xs text-ink-mute">
                        {s.type} · {fmtTime(s.time)} · {s.specialistName}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-sm font-extrabold text-ink sm:block">{num(s.fee)} ر.س</span>
                    <Badge tone={STATUS_TONE[s.status]} compact>
                      {s.status}
                    </Badge>
                    <button
                      title="تفاصيل الجلسة"
                      onClick={() => onSessionClick(s)}
                      className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                    >
                      <Icon name="eye" size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}

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

/* ---------- Session details modal ---------- */
function SessionDetailsModal({ session, onClose, onUpdate }) {
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

/* ---------- Booking (new session) modal ---------- */
function BookingModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    specialistId: SPECIALISTS[0].id,
    client: CLIENT_OPTIONS[0],
    type: SESSION_TYPES[0].name,
    date: '',
    time: '16:00',
    payment: PAYMENT_METHODS[0],
    note: '',
  })
  const [error, setError] = useState(null)
  const todayStr = localDateStr(new Date())

  const specialist = SPECIALISTS.find((x) => x.id === form.specialistId) ?? SPECIALISTS[0]
  const fee = feeFor(specialist.fee, form.type)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = () => {
    if (!form.date || !form.time) {
      setError('يرجى اختيار تاريخ ووقت الجلسة')
      return
    }
    if (form.date < todayStr) {
      setError('لا يمكن حجز جلسة في تاريخ سابق')
      return
    }
    onSave({
      client: form.client,
      specialistId: specialist.id,
      specialistName: specialist.name,
      specialistTitle: specialist.title,
      specialty: specialist.specialty,
      type: form.type,
      date: form.date,
      time: form.time,
      datetime: new Date(`${form.date}T${form.time}`).toISOString(),
      fee,
      payment: form.payment,
      location: 'عن بُعد (فيديو)',
      status: 'محجوزة',
      note: form.note.trim(),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="حجز جلسة جديدة"
      subtitle="حدد بيانات الجلسة وسيتم إضافتها للجدول والتقويم"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={<Icon name="calendar" size={16} />} onClick={save}>
            تأكيد الحجز
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 animate-slide-in">
            <Icon name="x" size={16} strokeWidth={2.4} />
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="الأخصائي" id="booking-specialist" icon="user-check" value={form.specialistId} onChange={set('specialistId')}>
            {SPECIALISTS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title} {x.name} — {x.specialty}
              </option>
            ))}
          </Select>
          <Select label="العميل" id="booking-client" icon="users" value={form.client} onChange={set('client')}>
            {CLIENT_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select label="نوع الجلسة" id="booking-type" icon="video" value={form.type} onChange={set('type')}>
            {SESSION_TYPES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </Select>
          <Select label="وسيلة الدفع" id="booking-payment" icon="banknote" value={form.payment} onChange={set('payment')}>
            {PAYMENT_METHODS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Input label="التاريخ" id="booking-date" type="date" min={todayStr} value={form.date} onChange={set('date')} />
          <Input label="الوقت" id="booking-time" type="time" value={form.time} onChange={set('time')} />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-mint px-4 py-3">
          <span className="text-sm font-semibold text-ink-soft">الرسوم المتوقعة</span>
          <span className="text-lg font-extrabold text-primary">{num(fee)} ر.س</span>
        </div>

        <Textarea
          label="ملاحظات (اختياري)"
          id="booking-note"
          rows={3}
          placeholder="مثال: جلسة تقييم أولية للحالة..."
          value={form.note}
          onChange={set('note')}
        />
      </div>
    </Modal>
  )
}

/* ---------- Page ---------- */
export default function Sessions() {
  const [sessions, setSessions] = useState(loadSessions)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('الكل')
  const [type, setType] = useState('الكل')
  const [sort, setSort] = useState('datetime:asc')
  const [page, setPage] = useState(1)
  const [view, setView] = useState('list') // 'list' | 'calendar'
  const [details, setDetails] = useState(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const updateList = (updater) => {
    setSessions((prev) => {
      const next = updater(prev)
      persistSessions(next)
      return next
    })
  }

  const counts = useMemo(() => {
    const c = { 'الكل': sessions.length, محجوزة: 0, مكتملة: 0, ملغاة: 0, 'قيد الانتظار': 0 }
    sessions.forEach((x) => {
      c[x.status] += 1
    })
    return c
  }, [sessions])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const [skey, sdir] = sort.split(':')
    const list = sessions.filter((x) => {
      if (status !== 'الكل' && x.status !== status) return false
      if (type !== 'الكل' && x.type !== type) return false
      if (q && !`${x.client} ${x.specialistName} ${x.type} ${x.id}`.toLowerCase().includes(q)) return false
      return true
    })
    return [...list].sort((a, b) => {
      const cmp =
        skey === 'client'
          ? a.client.localeCompare(b.client, 'ar')
          : a[skey] < b[skey]
            ? -1
            : a[skey] > b[skey]
              ? 1
              : 0
      return sdir === 'asc' ? cmp : -cmp
    })
  }, [sessions, search, status, type, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleUpdateStatus = (next) => {
    const label =
      next.status === 'مكتملة' ? 'تم تأكيد حضور الجلسة' : next.status === 'محجوزة' ? 'تم تأكيد الحجز' : 'تم إلغاء الجلسة'
    updateList((prev) => prev.map((x) => (x.id === next.id ? next : x)))
    setDetails(null)
    setNotice(`${label} ✓`)
  }

  const handleBooking = (s) => {
    updateList((prev) => [...prev, { ...s, id: nextSessionId(prev) }])
    setBookingOpen(false)
    setNotice('تم حجز الجلسة بنجاح ✓')
  }

  const exportCsv = () => {
    const header = ['العميل', 'الأخصائي', 'النوع', 'التاريخ', 'الوقت', 'الرسوم (ر.س)', 'الدفع', 'الحالة']
    const lines = rows.map((r) =>
      [r.client, r.specialistName, r.type, r.date, fmtTime(r.time), r.fee, r.payment, r.status].join(','),
    )
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sessions.csv'
    a.click()
    URL.revokeObjectURL(url)
    setNotice('تم تصدير الملف بنجاح ✓')
  }

  const viewBtn = (active) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition-all ${
      active ? 'bg-white text-primary shadow-card' : 'text-ink-mute hover:text-primary'
    }`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">الجلسات</h2>
          <p className="mt-1 text-sm text-ink-soft">جدولة جلسات العملاء ومتابعة المواعيد وحالاتها</p>
        </div>
        <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => setBookingOpen(true)}>
          حجز جلسة جديدة
        </Button>
      </div>

      {/* Notice */}
      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-accent-soft/30 bg-mint px-4 py-3 text-sm font-bold text-primary animate-slide-in">
          <span className="flex items-center gap-2">
            <Icon name="check" size={16} strokeWidth={2.4} />
            {notice}
          </span>
          <button
            onClick={() => setNotice(null)}
            aria-label="إغلاق"
            className="grid size-6 place-items-center rounded-md transition-colors hover:bg-accent/30"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Stat strip — status filters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {SESSION_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s)
              setPage(1)
            }}
            className={`rounded-2xl border px-4 py-3.5 text-start transition-all hover:-translate-y-0.5 ${
              status === s
                ? 'border-primary bg-primary text-white shadow-[0_6px_16px_rgba(7,94,102,0.35)]'
                : 'border-line bg-card shadow-card hover:shadow-pop'
            }`}
          >
            <p className={`text-2xl font-extrabold ${status === s ? 'text-white' : 'text-ink'}`}>
              {num(counts[s])}
            </p>
            <p className={`text-xs font-semibold ${status === s ? 'text-white/70' : 'text-ink-mute'}`}>
              {STAT_LABEL[s]}
            </p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1">
            <Input
              icon="search"
              placeholder="ابحث بالعميل أو الأخصائي أو نوع الجلسة..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <Select className="w-44" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}>
            <option value="الكل">كل الأنواع</option>
            {SESSION_TYPES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </Select>

          {view === 'list' && (
            <Select className="w-44" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
              {SORT_OPTIONS.map((o) => (
                <option key={`${o.key}:${o.dir}`} value={`${o.key}:${o.dir}`}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}

          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
            <button className={viewBtn(view === 'list')} onClick={() => { setView('list'); setPage(1) }}>
              <Icon name="clipboard" size={15} />
              قائمة
            </button>
            <button className={viewBtn(view === 'calendar')} onClick={() => setView('calendar')}>
              <Icon name="calendar" size={15} />
              تقويم
            </button>
          </div>

          <Button variant="ghost" icon={<Icon name="download" size={17} />} onClick={exportCsv}>
            تصدير CSV
          </Button>
        </div>
      </Card>

      {/* Content */}
      {view === 'calendar' ? (
        <CalendarView sessions={rows} onSessionClick={setDetails} />
      ) : paged.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-20 text-center">
          <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
            <Icon name="clipboard" size={38} strokeWidth={1.6} />
          </div>
          <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد جلسات مطابقة</h3>
          <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
            جرّب تعديل البحث أو الفلاتر، أو احجز جلسة جديدة من الزر أعلاه.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Button variant="outline" onClick={() => { setSearch(''); setStatus('الكل'); setType('الكل'); setPage(1) }}>
              إعادة تعيين الفلاتر
            </Button>
            <Button icon={<Icon name="plus" size={16} strokeWidth={2.4} />} onClick={() => setBookingOpen(true)}>
              حجز جلسة
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                  <th className="px-5 py-3 text-start">العميل</th>
                  <th className="px-4 py-3 text-start">الأخصائي</th>
                  <th className="px-4 py-3 text-start">النوع</th>
                  <th className="px-4 py-3 text-start">الموعد</th>
                  <th className="px-4 py-3 text-start">الرسوم</th>
                  <th className="px-4 py-3 text-start">الدفع</th>
                  <th className="px-4 py-3 text-start">الحالة</th>
                  <th className="px-5 py-3 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-mint/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.client} size={40} />
                        <div>
                          <p className="font-bold text-ink">{s.client}</p>
                          <p className="text-xs text-ink-mute">#{s.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={s.specialistName} size={28} />
                        <div>
                          <p className="whitespace-nowrap font-semibold text-ink-soft">
                            {s.specialistTitle} {s.specialistName}
                          </p>
                          <p className="text-[11px] text-ink-mute">{s.specialty}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink-soft">{s.type}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-ink">{fmtDate(s.date)}</p>
                      <p className="text-xs text-ink-mute">{fmtTime(s.time)}</p>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink">{num(s.fee)} ر.س</td>
                    <td className="px-4 py-3.5 text-ink-soft">{s.payment}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={STATUS_TONE[s.status]} dot>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="تفاصيل الجلسة"
                          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                          onClick={() => setDetails(s)}
                        >
                          <Icon name="eye" size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={safePage} pageSize={PAGE_SIZE} total={rows.length} onChange={setPage} />
        </Card>
      )}

      {/* Modals */}
      {details && <SessionDetailsModal session={details} onClose={() => setDetails(null)} onUpdate={handleUpdateStatus} />}
      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} onSave={handleBooking} />}
    </div>
  )
}
