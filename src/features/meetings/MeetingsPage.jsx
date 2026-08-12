import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import PageState from '@/components/ui/PageState'
import Badge from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import Notice from '@/components/ui/Notice'
import PageHeader from '@/components/ui/PageHeader'
import StatStrip from '@/components/ui/StatStrip'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import { Select } from '@/components/ui/Input'
import { api } from '@/app/api'
import { allFilter, statusChoices, useMeta } from '@/app/meta'
import { fmtDate, num } from '@/utils/format'
import { fmtTime } from '@/features/meetings/constants'
import MeetingDetailsModal from '@/features/meetings/components/MeetingDetailsModal'
import ScheduleModal from '@/features/meetings/components/ScheduleModal'
import MeetingsToolbar from '@/features/meetings/components/MeetingsToolbar'

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
      <PageState
        mode="error"
        title="تعذر تحميل اللقاءات"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (loading) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل اللقاءات..."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="اللقاءات"
        subtitle="اللقاءات الجماعية وورش العمل والبث المباشر على المنصة"
        actions={
          <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => setScheduleOpen(true)}>
            جدولة لقاء جديد
          </Button>
        }
      />

      {/* Notice */}
      {notice && <Notice text={notice.text} tone={notice.tone} onDismiss={() => setNotice(null)} />}

      {/* Stat strip */}
      <StatStrip
        active={status}
        onSelect={setStatus}
        items={statuses.map((s) => ({
          key: s,
          value: num(counts[s]),
          label: s === 'الكل' ? 'إجمالي اللقاءات' : s,
        }))}
      />

      <MeetingsToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        type={type}
        onTypeChange={(e) => setType(e.target.value)}
      />

      {/* List */}
      {rows.length === 0 ? (
        <PageState
          mode="empty"
          icon="video"
          title="لا توجد لقاءات مطابقة"
          message="جرّب تعديل البحث أو الفلاتر لعرض جميع اللقاءات."
        >
          <Button variant="outline" className="mt-5" onClick={() => { setSearch(''); setStatus('الكل'); setType('الكل') }}>
            إعادة تعيين الفلاتر
          </Button>
        </PageState>
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
      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="حذف اللقاء"
        confirmLabel="حذف نهائي"
        busy={deleting}
        message={
          <>
            هل أنت متأكد من حذف اللقاء <span className="font-extrabold text-ink">«{deleteTarget?.title}»</span>؟
            سيتم حذف اللقاء وجميع بياناته نهائياً.
          </>
        }
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
