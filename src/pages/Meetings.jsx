import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { api } from '../api'
import { allFilter, options, statusChoices, useMeta } from '../meta'
import { fmtDate, num } from '../utils/format'

const STATUS_TONE = { مجدول: 'teal', منعقد: 'success', منتهي: 'neutral', ملغي: 'danger' }

const fmtTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'ص' : 'م'}`
}

/* ---------- Details modal ---------- */
function MeetingDetailsModal({ meeting, onClose, onJoin }) {
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

/* ---------- Schedule modal ---------- */
function ScheduleModal({ specialists, onClose, onSaved }) {
  const meta = useMeta()
  const [form, setForm] = useState({
    title: '',
    type: options(meta, 'meetingType')[0] ?? '',
    hostId: specialists[0]?.id ?? '',
    date: '',
    time: '19:00',
    duration: 60,
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.title.trim()) {
      setError('يرجى إدخال عنوان اللقاء')
      return
    }
    if (!form.date) {
      setError('يرجى اختيار تاريخ اللقاء')
      return
    }
    if (!form.hostId) {
      setError('يرجى اختيار مقدم اللقاء')
      return
    }
    setSubmitting(true)
    try {
      const created = await api.createMeeting({
        title: form.title.trim(),
        type: form.type,
        hostId: Number(form.hostId),
        date: form.date,
        time: form.time,
        duration: Number(form.duration),
      })
      onSaved(created)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="جدولة لقاء جديد"
      subtitle="أنشئ لقاءً جماعياً أو ورشة عمل أو بثاً مباشراً"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={<Icon name="calendar" size={16} />} onClick={save} disabled={submitting}>
            {submitting ? 'جارٍ الجدولة...' : 'جدولة اللقاء'}
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
        <Input label="عنوان اللقاء" id="mt-title" placeholder="مثال: ورشة إدارة الضغوط" value={form.title} onChange={set('title')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="نوع اللقاء" id="mt-type" icon="video" value={form.type} onChange={set('type')}>
            {options(meta, 'meetingType').map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select label="مقدم اللقاء" id="mt-host" icon="user-check" value={form.hostId} onChange={set('hostId')}>
            {specialists.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} {s.name}
              </option>
            ))}
          </Select>
          <Input label="التاريخ" id="mt-date" type="date" value={form.date} onChange={set('date')} />
          <Input label="الوقت" id="mt-time" type="time" value={form.time} onChange={set('time')} />
        </div>
        <Select label="المدة (بالدقائق)" id="mt-duration" value={form.duration} onChange={set('duration')}>
          {[45, 60, 90, 120].map((d) => (
            <option key={d} value={d}>
              {d} دقيقة
            </option>
          ))}
        </Select>
      </div>
    </Modal>
  )
}

/* ---------- Page ---------- */
export default function Meetings() {
  const meta = useMeta()
  const [meetings, setMeetings] = useState([])
  const [specialists, setSpecialists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('الكل')
  const [type, setType] = useState('الكل')
  const [details, setDetails] = useState(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [notice, setNotice] = useState(null)
  const [statusBusy, setStatusBusy] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [m, sp] = await Promise.all([api.meetings(), api.specialists()])
        if (cancelled) return
        setMeetings(m ?? [])
        setSpecialists(sp ?? [])
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
  }, [])

  const statuses = allFilter(options(meta, 'meetingStatus'))
  const counts = useMemo(() => {
    const c = { الكل: meetings.length }
    statuses.forEach((s) => {
      if (s !== 'الكل') c[s] = 0
    })
    meetings.forEach((x) => {
      c[x.status] = (c[x.status] ?? 0) + 1
    })
    return c
  }, [meetings, statuses])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return meetings.filter((m) => {
      if (status !== 'الكل' && m.status !== status) return false
      if (type !== 'الكل' && m.type !== type) return false
      if (q && !`${m.title} ${m.host?.name ?? ''} ${m.type}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [meetings, search, status, type])

  const join = (m) => {
    setDetails(null)
    setNotice(
      m.recording && m.status === 'منتهي'
        ? { text: 'سيتم فتح تسجيل اللقاء في نافذة جديدة ✓', tone: 'success' }
        : { text: 'سيتم نقلك إلى غرفة اللقاء ✓', tone: 'success' },
    )
  }

  const schedule = (created) => {
    setMeetings((prev) => [created, ...prev])
    setScheduleOpen(false)
    setNotice({ text: 'تم جدولة اللقاء بنجاح ✓', tone: 'success' })
  }

  const changeStatus = async (m, next) => {
    if (next === m.status) return
    setStatusBusy(m.id)
    try {
      await api.updateMeetingStatus(m.id, next)
      setMeetings((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: next } : x)))
      setNotice({ text: `تم تحديث حالة اللقاء «${m.title}» إلى ${next} ✓`, tone: 'success' })
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setStatusBusy(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteMeeting(deleteTarget.id)
      setMeetings((prev) => prev.filter((x) => x.id !== deleteTarget.id))
      if (details?.id === deleteTarget.id) setDetails(null)
      setNotice({ text: `تم حذف اللقاء «${deleteTarget.title}» بنجاح`, tone: 'success' })
      setDeleteTarget(null)
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center px-6 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-red-50 text-red-500">
          <Icon name="x" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">تعذر تحميل اللقاءات</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{error}</p>
        <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Icon name="loader" size={18} className="animate-spin" />
          جاري تحميل اللقاءات...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">اللقاءات</h2>
          <p className="mt-1 text-sm text-ink-soft">اللقاءات الجماعية وورش العمل والبث المباشر على المنصة</p>
        </div>
        <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => setScheduleOpen(true)}>
          جدولة لقاء جديد
        </Button>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold animate-slide-in ${
            notice.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-accent-soft/30 bg-mint text-primary'
          }`}
        >
          <span className="flex items-center gap-2">
            <Icon name={notice.tone === 'error' ? 'x' : 'check'} size={16} strokeWidth={2.4} />
            {notice.text}
          </span>
          <button onClick={() => setNotice(null)} aria-label="إغلاق" className="grid size-6 place-items-center rounded-md transition-colors hover:bg-accent/30">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-2xl border px-4 py-3.5 text-start transition-all hover:-translate-y-0.5 ${
              status === s ? 'border-primary bg-primary text-white shadow-[0_6px_16px_rgba(7,94,102,0.35)]' : 'border-line bg-card shadow-card hover:shadow-pop'
            }`}
          >
            <p className={`text-2xl font-extrabold ${status === s ? 'text-white' : 'text-ink'}`}>{num(counts[s])}</p>
            <p className={`text-xs font-semibold ${status === s ? 'text-white/70' : 'text-ink-mute'}`}>
              {s === 'الكل' ? 'إجمالي اللقاءات' : s}
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
              placeholder="ابحث بعنوان اللقاء أو مقدمه..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select className="w-44" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="الكل">كل الأنواع</option>
            {options(meta, 'meetingType').map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* List */}
      {rows.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-20 text-center">
          <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
            <Icon name="video" size={38} strokeWidth={1.6} />
          </div>
          <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد لقاءات مطابقة</h3>
          <p className="mt-1.5 max-w-sm text-sm text-ink-soft">جرّب تعديل البحث أو الفلاتر لعرض جميع اللقاءات.</p>
          <Button variant="outline" className="mt-5" onClick={() => { setSearch(''); setStatus('الكل'); setType('الكل') }}>
            إعادة تعيين الفلاتر
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {rows.map((m) => {
              const live = m.status === 'منعقد'
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-mint/30">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className={`relative grid size-11 shrink-0 place-items-center rounded-xl ${live ? 'bg-emerald-100 text-emerald-600' : 'bg-mint text-primary'}`}>
                      <Icon name={m.type === 'بث مباشر' ? 'megaphone' : 'video'} size={20} />
                      {live && <span className="absolute -end-0.5 -top-0.5 size-2.5 animate-pulse rounded-full bg-emerald-500 ring-2 ring-white" />}
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                        <span className="truncate">{m.title}</span>
                        {m.recording && (
                          <Badge tone="soft" compact icon="play">
                            تسجيل
                          </Badge>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-mute">
                        {m.host?.title ?? ''} {m.host?.name ?? ''} · {m.type}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-soft">
                        <span className="flex items-center gap-1">
                          <Icon name="calendar" size={12} className="text-primary" />
                          {fmtDate(m.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="clock" size={12} className="text-primary" />
                          {fmtTime(m.time)} · {m.duration} د
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="users" size={12} className="text-primary" />
                          {num(m.attendees)}/{num(m.capacity)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <Select
                      className="w-32"
                      value={m.status}
                      disabled={statusBusy === m.id}
                      onChange={(e) => changeStatus(m, e.target.value)}
                    >
                      {statusChoices(meta, 'meetingStatus', m.status).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                    {(m.status === 'مجدول' || m.status === 'منعقد') && (
                      <Button size="sm" variant={live ? 'primary' : 'soft'} icon={<Icon name="video" size={15} />} onClick={() => join(m)}>
                        {live ? 'انضم الآن' : 'دخول'}
                      </Button>
                    )}
                    <button
                      title="تفاصيل اللقاء"
                      onClick={() => setDetails(m)}
                      className="grid size-9 place-items-center rounded-xl border border-line bg-white text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                    >
                      <Icon name="eye" size={17} />
                    </button>
                    <button
                      title="حذف اللقاء"
                      onClick={() => setDeleteTarget(m)}
                      className="grid size-9 place-items-center rounded-xl border border-line bg-white text-ink-mute transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* Modals */}
      {details && <MeetingDetailsModal meeting={details} onClose={() => setDetails(null)} onJoin={join} />}
      {scheduleOpen && (
        <ScheduleModal
          specialists={specialists}
          onClose={() => setScheduleOpen(false)}
          onSaved={schedule}
        />
      )}

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="حذف اللقاء"
        subtitle="لا يمكن التراجع عن هذا الإجراء"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              إلغاء
            </Button>
            <Button variant="danger" icon={<Icon name="trash" size={16} />} onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'جارٍ الحذف...' : 'حذف نهائي'}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
            <Icon name="trash" size={20} />
          </span>
          <p className="text-sm leading-relaxed text-ink-soft">
            هل أنت متأكد من حذف اللقاء <span className="font-extrabold text-ink">«{deleteTarget?.title}»</span>؟
            سيتم حذف اللقاء وجميع بياناته نهائياً.
          </p>
        </div>
      </Modal>
    </div>
  )
}
