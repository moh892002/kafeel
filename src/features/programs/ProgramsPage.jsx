import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import PageState from '@/components/ui/PageState'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import Notice from '@/components/ui/Notice'
import PageHeader from '@/components/ui/PageHeader'
import StatStrip from '@/components/ui/StatStrip'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import { Select } from '@/components/ui/Input'
import { api } from '@/app/api'
import { STATUS_TONE } from '@/features/programs/constants'
import ProgramDetailsModal from '@/features/programs/components/ProgramDetailsModal'
import EnrollModal from '@/features/programs/components/EnrollModal'
import ProgramFormModal from '@/features/programs/components/ProgramFormModal'
import ProgramsToolbar from '@/features/programs/components/ProgramsToolbar'
import { allFilter, options, statusChoices, useMeta } from '@/app/meta'
import { fmtDate, num } from '@/utils/format'

export default function Programs() {
  const meta = useMeta()
  const [programs, setPrograms] = useState([])
  const [specialists, setSpecialists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('الكل')
  const [category, setCategory] = useState('الكل')
  const [sort, setSort] = useState('startDate:asc')
  const [details, setDetails] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [enrollTarget, setEnrollTarget] = useState(null)
  const [notice, setNotice] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [statusBusy, setStatusBusy] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const mapRow = (p) => ({ ...p, rating: Number(p.rating ?? 0) })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [list, sp] = await Promise.all([api.programs(), api.specialists()])
        if (cancelled) return
        setPrograms((list ?? []).map(mapRow))
        setSpecialists(sp ?? [])
        setError(null)
      } catch (e) {
        if (cancelled) return
        setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh])

  const statuses = allFilter(options(meta, 'programStatus'))
  const counts = useMemo(() => {
    const c = { الكل: programs.length }
    statuses.forEach((s) => {
      if (s !== 'الكل') c[s] = 0
    })
    programs.forEach((x) => {
      c[x.status] = (c[x.status] ?? 0) + 1
    })
    return c
  }, [programs, statuses])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const [skey, sdir] = sort.split(':')
    const list = programs.filter((p) => {
      if (status !== 'الكل' && p.status !== status) return false
      if (category !== 'الكل' && p.category !== category) return false
      if (q && !`${p.title} ${p.instructor?.name ?? ''} ${p.category}`.toLowerCase().includes(q)) return false
      return true
    })
    return [...list].sort((a, b) => {
      const cmp = skey === 'startDate' ? a.startDate.localeCompare(b.startDate) : a[skey] - b[skey]
      return sdir === 'asc' ? cmp : -cmp
    })
  }, [programs, search, status, category, sort])

  const addProgram = (created) => {
    setPrograms((prev) => [mapRow(created), ...prev])
    setAddOpen(false)
    setNotice({ text: 'تم إنشاء البرنامج بنجاح ✓', tone: 'success' })
  }

  const changeStatus = async (p, next) => {
    if (next === p.status) return
    setStatusBusy(p.id)
    try {
      await api.updateProgramStatus(p.id, next)
      setPrograms((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)))
      setNotice({ text: `تم تحديث حالة «${p.title}» إلى ${next} ✓`, tone: 'success' })
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
      await api.deleteProgram(deleteTarget.id)
      setPrograms((prev) => prev.filter((x) => x.id !== deleteTarget.id))
      if (details?.id === deleteTarget.id) setDetails(null)
      setNotice({ text: `تم حذف البرنامج «${deleteTarget.title}» بنجاح`, tone: 'success' })
      setDeleteTarget(null)
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  if (error && programs.length === 0) {
    return (
      <PageState
        mode="error"
        title="تعذر تحميل البرامج"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (loading && programs.length === 0) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل البرامج..."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="البرامج"
        subtitle="البرامج التدريبية الجماعية على المنصة وإدارة تسجيلها"
        actions={
          <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => setAddOpen(true)}>
            إضافة برنامج جديد
          </Button>
        }
      />

      {/* Notice */}
      {notice && <Notice text={notice.text} tone={notice.tone} onDismiss={() => setNotice(null)} />}

      {/* Stat strip */}
      <StatStrip
        cols="lg:grid-cols-4"
        active={status}
        onSelect={setStatus}
        items={statuses.map((s) => ({
          key: s,
          value: num(counts[s]),
          label: s === 'الكل' ? 'إجمالي البرامج' : s,
        }))}
      />

      <ProgramsToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        category={category}
        onCategoryChange={(e) => setCategory(e.target.value)}
        sort={sort}
        onSortChange={(e) => setSort(e.target.value)}
      />

      {/* Grid */}
      {rows.length === 0 ? (
        <PageState
          mode="empty"
          icon="megaphone"
          title="لا توجد برامج مطابقة"
          message="جرّب تعديل البحث أو الفلاتر لعرض جميع البرامج."
        >
          <Button variant="outline" className="mt-5" onClick={() => { setSearch(''); setStatus('الكل'); setCategory('الكل') }}>
            إعادة تعيين الفلاتر
          </Button>
        </PageState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => {
            const pct = Math.round((p.enrolled / Math.max(1, p.capacity)) * 100)
            return (
              <Card key={p.id} className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-pop">
                <button
                  onClick={() => setDetails(p)}
                  className={`block h-20 w-full bg-gradient-to-l ${p.cover ?? 'from-primary to-accent-soft'} px-4 py-3 text-start`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-extrabold leading-5 text-white">{p.title}</p>
                    <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                  </div>
                </button>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="soft">{p.category}</Badge>
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-ink">
                      <Icon name="star" size={13} className="text-amber-400" />
                      {p.rating.toFixed(1)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Avatar name={p.instructor?.name ?? '—'} size={30} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink-soft">
                        {p.instructor?.title ?? ''} {p.instructor?.name ?? ''}
                      </p>
                      <p className="text-[11px] text-ink-mute">{p.instructor?.specialty ?? ''}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs font-semibold text-ink-mute">
                    <span className="flex items-center gap-1.5">
                      <Icon name="calendar" size={13} className="text-primary" />
                      يبدأ {fmtDate(p.startDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="clipboard" size={13} className="text-primary" />
                      {p.sessions} جلسات
                    </span>
                    <span className="font-extrabold text-ink">
                      {Number(p.price) === 0 ? 'مجاني' : `${num(p.price)} ر.س`}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-ink-mute">التسجيل</span>
                      <span className="text-primary">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-mint">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-soft to-primary transition-all duration-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>

                  <Button variant="soft" className="mt-4 w-full" onClick={() => setDetails(p)}>
                    عرض التفاصيل
                  </Button>

                  <div className="mt-3 flex items-center gap-2">
                    <Select
                      className="w-full"
                      value={p.status}
                      disabled={statusBusy === p.id}
                      onChange={(e) => changeStatus(p, e.target.value)}
                    >
                      {statusChoices(meta, 'programStatus', p.status).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                    <button
                      title="حذف البرنامج"
                      onClick={() => setDeleteTarget(p)}
                      className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink-mute transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {details && (
        <ProgramDetailsModal
          program={details}
          onClose={() => setDetails(null)}
          onRegister={() => {
            const target = details
            setDetails(null)
            setEnrollTarget(target)
          }}
        />
      )}
      {enrollTarget && (
        <EnrollModal
          program={enrollTarget}
          onClose={() => setEnrollTarget(null)}
          onEnrolled={(clientName) => {
            setEnrollTarget(null)
            setNotice({ text: `تم تسجيل «${clientName}» في البرنامج بنجاح ✓`, tone: 'success' })
            setRefresh((r) => r + 1)
          }}
        />
      )}
      {addOpen && <ProgramFormModal specialists={specialists} onClose={() => setAddOpen(false)} onSaved={addProgram} />}

      {/* Delete confirm */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="حذف البرنامج"
        confirmLabel="حذف نهائي"
        busy={deleting}
        message={
          <>
            هل أنت متأكد من حذف البرنامج <span className="font-extrabold text-ink">«{deleteTarget?.title}»</span>؟
            سيتم حذف جميع بياناته وبيانات المسجلين فيه نهائياً.
          </>
        }
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
