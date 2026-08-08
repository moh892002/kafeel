import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import CourseCover from '../components/ui/CourseCover'
import { Input, Select } from '../components/ui/Input'
import { loadCourses, removeCourse, CATEGORIES, COURSE_STATUSES } from '../data/courses'
import { num } from '../utils/format'

const PAGE_SIZE = 8

const STATUS_TONE = { منشورة: 'success', مسودة: 'neutral' }
const LEVEL_TONE = { مبتدئ: 'success', متوسط: 'warning', متقدم: 'danger' }

const SORT_OPTIONS = [
  { key: 'createdAt', dir: 'desc', label: 'الأحدث أولاً' },
  { key: 'enrolled', dir: 'desc', label: 'الأكثر تسجيلاً' },
  { key: 'rating', dir: 'desc', label: 'الأعلى تقييماً' },
  { key: 'price', dir: 'asc', label: 'السعر الأقل' },
  { key: 'title', dir: 'asc', label: 'العنوان' },
]

export default function Courses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState(loadCourses)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('الكل')
  const [category, setCategory] = useState('الكل')
  const [sort, setSort] = useState('createdAt:desc')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const counts = useMemo(() => {
    const c = { الكل: courses.length, منشورة: 0, مسودة: 0 }
    courses.forEach((x) => {
      c[x.status] += 1
    })
    return c
  }, [courses])

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

  const confirmDelete = () => {
    if (!deleteTarget) return
    removeCourse(deleteTarget.id)
    setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    setNotice(`تم حذف الدورة «${deleteTarget.title}» بنجاح`)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">الدورات</h2>
          <p className="mt-1 text-sm text-ink-soft">إدارة الدورات التدريبية على المنصة ونشرها وتعديلها</p>
        </div>
        <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => navigate('/courses/add')}>
          إضافة دورة جديدة
        </Button>
      </div>

      {/* Notice */}
      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-accent-soft/30 bg-mint px-4 py-3 text-sm font-bold text-primary animate-slide-in">
          <span className="flex items-center gap-2">
            <Icon name="check" size={16} strokeWidth={2.4} />
            {notice}
          </span>
          <button onClick={() => setNotice(null)} aria-label="إغلاق" className="grid size-6 place-items-center rounded-md transition-colors hover:bg-accent/30">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {['الكل', ...COURSE_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s)
              setPage(1)
            }}
            className={`rounded-2xl border px-4 py-3.5 text-start transition-all hover:-translate-y-0.5 ${
              status === s ? 'border-primary bg-primary text-white shadow-[0_6px_16px_rgba(7,94,102,0.35)]' : 'border-line bg-card shadow-card hover:shadow-pop'
            }`}
          >
            <p className={`text-2xl font-extrabold ${status === s ? 'text-white' : 'text-ink'}`}>{num(counts[s])}</p>
            <p className={`text-xs font-semibold ${status === s ? 'text-white/70' : 'text-ink-mute'}`}>
              {s === 'الكل' ? 'إجمالي الدورات' : s === 'منشورة' ? 'دورة منشورة' : 'دورة مسودة'}
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
              placeholder="ابحث بعنوان الدورة أو المدرب..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <Select className="w-44" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
            <option value="الكل">كل الفئات</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select className="w-44" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
            {SORT_OPTIONS.map((o) => (
              <option key={`${o.key}:${o.dir}`} value={`${o.key}:${o.dir}`}>{o.label}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {paged.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
              <Icon name="book" size={38} strokeWidth={1.6} />
            </div>
            <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد دورات مطابقة</h3>
            <p className="mt-1.5 max-w-sm text-sm text-ink-soft">جرّب تعديل البحث أو الفلاتر، أو أضف دورة جديدة.</p>
            <Button variant="outline" className="mt-5" onClick={() => { setSearch(''); setStatus('الكل'); setCategory('الكل'); setPage(1) }}>
              إعادة تعيين الفلاتر
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                  <th className="px-5 py-3 text-start">الدورة</th>
                  <th className="px-4 py-3 text-start">المدرب</th>
                  <th className="px-4 py-3 text-start">المستوى</th>
                  <th className="px-4 py-3 text-start">السعر</th>
                  <th className="px-4 py-3 text-start">المسجلون</th>
                  <th className="px-4 py-3 text-start">التقييم</th>
                  <th className="px-4 py-3 text-start">الحالة</th>
                  <th className="px-5 py-3 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-mint/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <CourseCover cover={c.cover} className="h-11 w-16 rounded-lg" />
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate font-bold text-ink">{c.title}</p>
                          <p className="text-xs text-ink-mute">{c.category} · {c.sessions} جلسات</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={c.instructor} size={28} />
                        <span className="whitespace-nowrap font-semibold text-ink-soft">{c.instructor}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={LEVEL_TONE[c.level]}>{c.level}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      {c.price === 0 ? (
                        <Badge tone="soft">مجانية</Badge>
                      ) : (
                        <span className="font-extrabold text-ink">{num(c.price)} ر.س</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink-soft">{num(c.enrolled)}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-extrabold text-ink">
                        <Icon name="star" size={14} className="text-amber-400" />
                        {c.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={STATUS_TONE[c.status]} dot>{c.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="عرض التفاصيل"
                          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                          onClick={() => navigate(`/courses/${c.id}`)}
                        >
                          <Icon name="eye" size={17} />
                        </button>
                        <button
                          title="تعديل"
                          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                          onClick={() => navigate(`/courses/${c.id}/edit`)}
                        >
                          <Icon name="edit" size={17} />
                        </button>
                        <button
                          title="حذف"
                          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-red-50 hover:text-red-500"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Icon name="trash" size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <Pagination page={safePage} pageSize={PAGE_SIZE} total={rows.length} onChange={setPage} />
        )}
      </Card>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="حذف الدورة"
        subtitle="لا يمكن التراجع عن هذا الإجراء"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button variant="danger" icon={<Icon name="trash" size={16} />} onClick={confirmDelete}>
              حذف نهائي
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
            <Icon name="trash" size={20} />
          </span>
          <p className="text-sm leading-relaxed text-ink-soft">
            هل أنت متأكد من حذف الدورة <span className="font-extrabold text-ink">«{deleteTarget?.title}»</span>؟
            سيتم حذف جميع بياناتها وبيانات المسجلين فيها نهائياً.
          </p>
        </div>
      </Modal>
    </div>
  )
}
