import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import PageState from '@/components/ui/PageState'
import Icon from '@/components/ui/Icon'
import Notice from '@/components/ui/Notice'
import PageHeader from '@/components/ui/PageHeader'
import StatStrip from '@/components/ui/StatStrip'
import {
  SPECIALTY_OPTIONS as FALLBACK_SPECIALTIES,
  SORT_OPTIONS,
  matchSpecialist,
} from '@/features/specialists/constants'
import FilterModal from '@/features/specialists/components/FilterModal'
import SortModal from '@/features/specialists/components/SortModal'
import EditSpecialistModal from '@/features/specialists/components/EditSpecialistModal'
import StatusModal from '@/features/specialists/components/StatusModal'
import DeleteModal from '@/features/specialists/components/DeleteModal'
import SpecialistsToolbar from '@/features/specialists/components/SpecialistsToolbar'
import SpecialistsTable from '@/features/specialists/components/SpecialistsTable'
import { allFilter, options, useMeta } from '@/app/meta'
import { api } from '@/app/api'
import useAsync from '@/hooks/useAsync'
import { num } from '@/utils/format'

const PAGE_SIZE = 8

/* ---------- Page ---------- */
export default function Specialists() {
  const navigate = useNavigate()
  const meta = useMeta()
  const statusOptions = allFilter(options(meta, 'specialistStatus'))
  const { data, setData, error, reload } = useAsync(() => api.specialists(), [])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('الكل')
  const [specialties, setSpecialties] = useState([])
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState({ key: 'joinedAt', dir: 'desc' })
  const [page, setPage] = useState(1)

  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null) // { text, tone: 'success' | 'error' }


  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const rows = useMemo(() => {
    const list = (data ?? []).filter((s) => matchSpecialist(s, { status, specialties, minRating, search }))
    return [...list].sort((a, b) => {
      const { key, dir } = sort
      const cmp =
        key === 'name'
          ? a.name.localeCompare(b.name, 'ar')
          : key === 'joinedAt'
            ? new Date(a[key]).getTime() - new Date(b[key]).getTime()
            : Number(a[key]) - Number(b[key])
      return dir === 'asc' ? cmp : -cmp
    })
  }, [data, search, status, specialties, minRating, sort])

  const counts = useMemo(() => {
    const c = { 'الكل': data?.length ?? 0 }
    statusOptions.forEach((s) => {
      if (s !== 'الكل') c[s] = 0
    })
    ;(data ?? []).forEach((s) => {
      c[s.status] = (c[s.status] ?? 0) + 1
    })
    return c
  }, [data, statusOptions])

  const specialtyOptions = useMemo(() => {
    const uniq = [...new Set((data ?? []).map((s) => s.specialty).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'ar'),
    )
    return uniq.length > 0 ? uniq : FALLBACK_SPECIALTIES
  }, [data])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const activeFilterCount =
    (status !== 'الكل' ? 1 : 0) + specialties.length + (minRating > 0 ? 1 : 0)

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sort.key && o.dir === sort.dir)?.label

  const applyFilter = (f) => {
    setStatus(f.status)
    setSpecialties(f.specialties)
    setMinRating(f.minRating)
    setPage(1)
    setFilterOpen(false)
  }

  const applySort = (val) => {
    const [key, dir] = val.split(':')
    setSort({ key, dir })
    setPage(1)
    setSortOpen(false)
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('الكل')
    setSpecialties([])
    setMinRating(0)
    setPage(1)
  }

  const changeStatus = async (next) => {
    if (!statusTarget) return
    setBusy(true)
    try {
      await api.updateSpecialistStatus(statusTarget.id, next)
      setNotice({ text: `تم تحديث حالة ${statusTarget.title} ${statusTarget.name} إلى «${next}» ✓`, tone: 'success' })
      setStatusTarget(null)
      const list = await api.specialists()
      setData(list)
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await api.deleteSpecialist(deleteTarget.id)
      setNotice({ text: `تم حذف ${deleteTarget.title} ${deleteTarget.name} ✓`, tone: 'success' })
      setDeleteTarget(null)
      setData((await api.specialists()) ?? [])
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = () => {
    const header = ['الاسم', 'التخصص', 'التقييم', 'الجلسات', 'الرسوم (ر.س)', 'الحالة', 'تاريخ الانضمام']
    const lines = rows.map((r) =>
      [`${r.title} ${r.name}`, r.specialty, r.rating, r.sessions, r.fee, r.status, r.joinedAt].join(','),
    )
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'specialists.csv'
    a.click()
    URL.revokeObjectURL(url)
    setNotice({ text: 'تم تصدير الملف بنجاح ✓', tone: 'success' })
  }

  if (error) {
    return (
      <PageState
        mode="error"
        title="تعذر تحميل الأخصائيين"
        message={error}
        onRetry={reload}
      />
    )
  }

  if (!data) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل الأخصائيين..."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="إدارة الأخصائيين"
        subtitle="متابعة الأخصائيين المعتمدين على المنصة وحالاتهم وأدائهم"
        actions={
          <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => navigate('/specialists/add')}>
            إضافة أخصائي جديد
          </Button>
        }
      />

      {/* Notice */}
      {notice && <Notice text={notice.text} tone={notice.tone} onDismiss={() => setNotice(null)} />}

      {/* Stat strip */}
      <StatStrip
        cols="lg:grid-cols-4"
        active={status}
        onSelect={(k) => {
          setStatus(k)
          setPage(1)
        }}
        items={statusOptions.map((s) => ({
          key: s,
          value: num(counts[s]),
          label: s === 'الكل' ? 'إجمالي الأخصائيين' : s,
        }))}
      />

      <SpecialistsToolbar
        search={search}
        onSearchChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        activeFilterCount={activeFilterCount}
        onOpenFilter={() => setFilterOpen(true)}
        onOpenSort={() => setSortOpen(true)}
        sortLabel={currentSortLabel}
        onExport={exportCsv}
      />

      <SpecialistsTable
        rows={paged}
        page={safePage}
        pageSize={PAGE_SIZE}
        total={rows.length}
        onPageChange={setPage}
        onView={(s) => navigate(`/specialists/${s.id}`)}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
        onStatusClick={setStatusTarget}
        onResetFilters={resetFilters}
      />

      {/* Modals */}
      {filterOpen && (
        <FilterModal
          initial={{ status, specialties, minRating }}
          search={search}
          specialists={data}
          specialtyOptions={specialtyOptions}
          onApply={applyFilter}
          onClose={() => setFilterOpen(false)}
        />
      )}
      {sortOpen && (
        <SortModal
          current={sort}
          onApply={applySort}
          onClose={() => setSortOpen(false)}
        />
      )}
      {statusTarget && (
        <StatusModal
          specialist={statusTarget}
          busy={busy}
          onConfirm={changeStatus}
          onClose={() => setStatusTarget(null)}
        />
      )}
      {editTarget && (
        <EditSpecialistModal
          specialist={editTarget}
          specialtyOptions={specialtyOptions}
          onClose={() => setEditTarget(null)}
          onSaved={async () => {
            setEditTarget(null)
            try {
              setData(await api.specialists())
              setNotice({ text: 'تم تحديث بيانات الأخصائي بنجاح ✓', tone: 'success' })
            } catch {
              setNotice({ text: 'تم حفظ التغييرات، لكن تعذر تحديث القائمة', tone: 'error' })
            }
          }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          specialist={deleteTarget}
          busy={busy}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
