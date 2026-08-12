import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import PageState from '@/components/ui/PageState'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import Icon from '@/components/ui/Icon'
import Notice from '@/components/ui/Notice'
import PageHeader from '@/components/ui/PageHeader'
import StatStrip from '@/components/ui/StatStrip'
import { api } from '@/app/api'
import { CATEGORIES } from '@/features/courses/constants'
import { allFilter, options, useMeta } from '@/app/meta'
import { num } from '@/utils/format'
import CoursesToolbar from '@/features/courses/components/CoursesToolbar'
import CoursesTable from '@/features/courses/components/CoursesTable'

const PAGE_SIZE = 8

export default function Courses() {
  const navigate = useNavigate()
  const meta = useMeta()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('الكل')
  const [category, setCategory] = useState('الكل')
  const [sort, setSort] = useState('createdAt:desc')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [statusBusy, setStatusBusy] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  // The API embeds an instructor object and BigDecimal rating — flatten for the views.
  const mapRow = (c) => ({
    ...c,
    instructor: c.instructor ? `${c.instructor.title} ${c.instructor.name}` : '—',
    rating: Number(c.rating ?? 0),
  })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const list = await api.courses()
        if (cancelled) return
        setCourses((list ?? []).map(mapRow))
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

  // Categories derived from the live data so new categories show up (fallback to the constant).
  const categories = useMemo(() => {
    const fromData = [...new Set(courses.map((c) => c.category).filter(Boolean))]
    return fromData.length ? fromData : CATEGORIES
  }, [courses])

  const statuses = allFilter(options(meta, 'courseStatus'))
  const counts = useMemo(() => {
    const c = { الكل: courses.length }
    statuses.forEach((s) => {
      if (s !== 'الكل') c[s] = 0
    })
    courses.forEach((x) => {
      c[x.status] = (c[x.status] ?? 0) + 1
    })
    return c
  }, [courses, statuses])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const [skey, sdir] = sort.split(':')
    let list = courses.filter((c) => {
      if (status !== 'الكل' && c.status !== status) return false
      if (category !== 'الكل' && c.category !== category) return false
      if (q && !`${c.title} ${c.instructor} ${c.category}`.toLowerCase().includes(q)) return false
      return true
    })
    list = [...list].sort((a, b) => {
      const cmp =
        skey === 'title' || skey === 'createdAt'
          ? a[skey].localeCompare(b[skey])
          : a[skey] - b[skey]
      return sdir === 'asc' ? cmp : -cmp
    })
    return list
  }, [courses, search, status, category, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteCourse(deleteTarget.id)
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setNotice({ text: `تم حذف الدورة «${deleteTarget.title}» بنجاح`, tone: 'success' })
      setDeleteTarget(null)
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const changeStatus = async (c, next) => {
    if (next === c.status) return
    setStatusBusy(c.id)
    try {
      await api.updateCourseStatus(c.id, next)
      setCourses((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)))
      setNotice({ text: `تم تحديث حالة «${c.title}» إلى ${next} ✓`, tone: 'success' })
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setStatusBusy(null)
    }
  }

  if (error) {
    return (
      <PageState
        mode="error"
        title="تعذر تحميل الدورات"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (loading) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل الدورات..."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="الدورات"
        subtitle="إدارة الدورات التدريبية على المنصة ونشرها وتعديلها"
        actions={
          <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => navigate('/courses/add')}>
            إضافة دورة جديدة
          </Button>
        }
      />

      {/* Notice */}
      {notice && <Notice text={notice.text} tone={notice.tone} onDismiss={() => setNotice(null)} />}

      {/* Stat strip */}
      <StatStrip
        cols="lg:grid-cols-3"
        active={status}
        onSelect={(k) => {
          setStatus(k)
          setPage(1)
        }}
        items={statuses.map((s) => ({
          key: s,
          value: num(counts[s]),
          label: s === 'الكل' ? 'إجمالي الدورات' : s,
        }))}
      />

      <CoursesToolbar
        search={search}
        onSearchChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        category={category}
        onCategoryChange={(e) => {
          setCategory(e.target.value)
          setPage(1)
        }}
        categories={categories}
        sort={sort}
        onSortChange={(e) => {
          setSort(e.target.value)
          setPage(1)
        }}
      />

      <CoursesTable
        rows={paged}
        page={safePage}
        pageSize={PAGE_SIZE}
        total={rows.length}
        onPageChange={setPage}
        onView={(c) => navigate(`/courses/${c.id}`)}
        onEdit={(c) => navigate(`/courses/${c.id}/edit`)}
        onDelete={setDeleteTarget}
        statusBusy={statusBusy}
        onStatusChange={changeStatus}
        onResetFilters={() => {
          setSearch('')
          setStatus('الكل')
          setCategory('الكل')
          setPage(1)
        }}
      />

      {/* Delete confirm */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="حذف الدورة"
        message={
          <>
            هل أنت متأكد من حذف الدورة <span className="font-extrabold text-ink">«{deleteTarget?.title}»</span>؟
            سيتم حذف جميع بياناتها وبيانات المسجلين فيها نهائياً.
          </>
        }
        confirmLabel="حذف نهائي"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
