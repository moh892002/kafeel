import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Card, { CardHeader } from '@/components/ui/Card'
import PageState from '@/components/ui/PageState'
import Badge from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import Notice from '@/components/ui/Notice'
import PageHeader from '@/components/ui/PageHeader'
import StatStrip from '@/components/ui/StatStrip'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import { api } from '@/app/api'
import { allFilter, options, useMeta } from '@/app/meta'
import { fmtDate, localDateStr, num } from '@/utils/format'
import {
  CHIP_STYLE,
  DAY_HEADERS,
  DOT,
  STAT_LABEL,
  STATUS_TONE,
  buildMonthGrid,
  fmtTime,
} from '@/features/sessions/constants'
import BookingModal from '@/features/sessions/components/BookingModal'
import SessionDetailsModal from '@/features/sessions/components/SessionDetailsModal'
import SessionsToolbar from '@/features/sessions/components/SessionsToolbar'
import SessionsTable from '@/features/sessions/components/SessionsTable'

const PAGE_SIZE = 8

/* ---------- Calendar view ---------- */
function CalendarView({ sessions, onSessionClick }) {
  const meta = useMeta()
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
        {allFilter(options(meta, 'sessionStatus')).slice(1).map((s) => (
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

export default function Sessions() {
  const meta = useMeta()
  const [sessions, setSessions] = useState([])
  const [specialists, setSpecialists] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('الكل')
  const [type, setType] = useState('الكل')
  const [sort, setSort] = useState('datetime:asc')
  const [page, setPage] = useState(1)
  const [view, setView] = useState('list') // 'list' | 'calendar'
  const [details, setDetails] = useState(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [notice, setNotice] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  // Flatten the embedded specialist so the existing views keep working.
  const mapRow = (s) => ({
    ...s,
    specialistTitle: s.specialist?.title ?? '',
    specialistName: s.specialist?.name ?? '',
    specialty: s.specialist?.specialty ?? '',
  })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [s, sp, cl] = await Promise.all([api.sessions(), api.specialists(), api.clients()])
        if (cancelled) return
        setSessions((s ?? []).map(mapRow))
        setSpecialists(sp ?? [])
        setClients(cl ?? [])
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statuses = allFilter(options(meta, 'sessionStatus'))
  const counts = useMemo(() => {
    const c = { 'الكل': sessions.length }
    statuses.forEach((s) => {
      if (s !== 'الكل') c[s] = 0
    })
    sessions.forEach((x) => {
      c[x.status] = (c[x.status] ?? 0) + 1
    })
    return c
  }, [sessions, statuses])

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

  const handleUpdateStatus = async (next) => {
    const label =
      next.status === 'مكتملة' ? 'تم تأكيد حضور الجلسة' : next.status === 'محجوزة' ? 'تم تأكيد الحجز' : 'تم إلغاء الجلسة'
    try {
      await api.updateSessionStatus(next.id, next.status)
      setSessions((prev) => prev.map((x) => (x.id === next.id ? { ...x, status: next.status } : x)))
      setDetails(null)
      setNotice({ text: `${label} ✓`, tone: 'success' })
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    }
  }

  const handleBooking = (created) => {
    setSessions((prev) => [...prev, mapRow(created)].sort((a, b) => (a.datetime < b.datetime ? -1 : 1)))
    setBookingOpen(false)
    setNotice({ text: 'تم حجز الجلسة بنجاح ✓', tone: 'success' })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteSession(deleteTarget.id)
      setSessions((prev) => prev.filter((x) => x.id !== deleteTarget.id))
      if (details?.id === deleteTarget.id) setDetails(null)
      setNotice({ text: `تم حذف جلسة «${deleteTarget.client}» بنجاح`, tone: 'success' })
      setDeleteTarget(null)
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setDeleting(false)
    }
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
    setNotice({ text: 'تم تصدير الملف بنجاح ✓', tone: 'success' })
  }

  if (error) {
    return (
      <PageState
        mode="error"
        title="تعذر تحميل الجلسات"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (loading) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل الجلسات..."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="الجلسات"
        subtitle="جدولة جلسات العملاء ومتابعة المواعيد وحالاتها"
        actions={
          <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => setBookingOpen(true)}>
            حجز جلسة جديدة
          </Button>
        }
      />

      {/* Notice */}
      {notice && <Notice text={notice.text} tone={notice.tone} onDismiss={() => setNotice(null)} />}

      {/* Stat strip — status filters */}
      <StatStrip
        active={status}
        onSelect={(k) => {
          setStatus(k)
          setPage(1)
        }}
        items={statuses.map((s) => ({
          key: s,
          value: num(counts[s]),
          label: STAT_LABEL[s],
        }))}
      />

      <SessionsToolbar
        search={search}
        onSearchChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        type={type}
        onTypeChange={(e) => {
          setType(e.target.value)
          setPage(1)
        }}
        sort={sort}
        onSortChange={(e) => {
          setSort(e.target.value)
          setPage(1)
        }}
        showSort={view === 'list'}
        view={view}
        onViewChange={(v) => {
          setView(v)
          if (v === 'list') setPage(1)
        }}
        onExport={exportCsv}
      />

      {/* Content */}
      {view === 'calendar' ? (
        <CalendarView sessions={rows} onSessionClick={setDetails} />
      ) : paged.length === 0 ? (
        <PageState
          mode="empty"
          icon="clipboard"
          title="لا توجد جلسات مطابقة"
          message="جرّب تعديل البحث أو الفلاتر، أو احجز جلسة جديدة من الزر أعلاه."
        >
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Button variant="outline" onClick={() => { setSearch(''); setStatus('الكل'); setType('الكل'); setPage(1) }}>
              إعادة تعيين الفلاتر
            </Button>
            <Button icon={<Icon name="plus" size={16} strokeWidth={2.4} />} onClick={() => setBookingOpen(true)}>
              حجز جلسة
            </Button>
          </div>
        </PageState>
      ) : (
        <SessionsTable
          rows={paged}
          page={safePage}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
          onView={setDetails}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Modals */}
      {details && <SessionDetailsModal session={details} onClose={() => setDetails(null)} onUpdate={handleUpdateStatus} />}
      {bookingOpen && (
        <BookingModal
          specialists={specialists}
          clients={clients}
          onClose={() => setBookingOpen(false)}
          onSaved={handleBooking}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="حذف الجلسة"
        confirmLabel="حذف نهائي"
        busy={deleting}
        message={
          <>
            هل أنت متأكد من حذف جلسة <span className="font-extrabold text-ink">«{deleteTarget?.client}»</span>؟
            سيتم حذف الجلسة وجميع بياناتها نهائياً.
          </>
        }
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
