import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { Input, Select } from '../components/ui/Input'
import { SPECIALISTS, SPECIALTY_OPTIONS, STATUS_OPTIONS } from '../data/specialists'
import { fmtDate, num } from '../utils/format'

const PAGE_SIZE = 8

const STATUS_TONE = {
  نشط: 'success',
  معلق: 'warning',
  موقوف: 'danger',
}

const RATING_OPTIONS = [
  { value: 0, label: 'أي تقييم' },
  { value: 3.5, label: '3.5 فأكثر' },
  { value: 4, label: '4 فأكثر' },
  { value: 4.5, label: '4.5 فأكثر' },
]

const SORT_OPTIONS = [
  { key: 'joinedAt', dir: 'desc', label: 'الأحدث انضماماً' },
  { key: 'joinedAt', dir: 'asc', label: 'الأقدم انضماماً' },
  { key: 'rating', dir: 'desc', label: 'الأعلى تقييماً' },
  { key: 'sessions', dir: 'desc', label: 'الأكثر جلسات' },
  { key: 'name', dir: 'asc', label: 'الاسم (أ → ي)' },
  { key: 'name', dir: 'desc', label: 'الاسم (ي → أ)' },
]

/* Shared filter predicate — used by the page table and the modal's live result count */
function matchSpecialist(s, { status = 'الكل', specialties = [], minRating = 0, search = '' } = {}) {
  if (status !== 'الكل' && s.status !== status) return false
  if (specialties.length > 0 && !specialties.includes(s.specialty)) return false
  if (minRating > 0 && s.rating < minRating) return false
  const q = String(search).trim().toLowerCase()
  if (q && !`${s.name} ${s.specialty} ${s.email}`.toLowerCase().includes(q)) return false
  return true
}

/* ---------- Filter modal ---------- */
function FilterModal({ initial, search, onApply, onClose }) {
  const [status, setStatus] = useState(initial.status)
  const [specialties, setSpecialties] = useState(initial.specialties)
  const [minRating, setMinRating] = useState(initial.minRating)

  // Live count based on the draft selections (not the already-applied filters)
  const count = useMemo(
    () => SPECIALISTS.filter((s) => matchSpecialist(s, { status, specialties, minRating, search })).length,
    [search, status, specialties, minRating],
  )

  const toggleSpecialty = (s) =>
    setSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  return (
    <Modal
      open
      onClose={onClose}
      title="تصفية الأخصائيين"
      subtitle="حدد المعايير لعرض النتائج المطابقة"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              setStatus('الكل')
              setSpecialties([])
              setMinRating(0)
            }}
          >
            إعادة تعيين
          </Button>
          <Button onClick={() => onApply({ status, specialties, minRating })}>
            عرض النتائج ({num(count)})
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Status */}
        <div>
          <p className="mb-2 text-sm font-bold text-ink">الحالة</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-xl border px-3 py-2 text-sm font-bold transition-all ${
                  status === s
                    ? 'border-primary bg-primary text-white shadow-[0_4px_10px_rgba(7,94,102,0.3)]'
                    : 'border-line bg-surface text-ink-soft hover:border-primary/30 hover:text-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div>
          <p className="mb-2 text-sm font-bold text-ink">التخصص</p>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_OPTIONS.map((s) => {
              const active = specialties.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'border-accent-soft bg-mint text-primary'
                      : 'border-line bg-surface text-ink-soft hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Min rating */}
        <div>
          <p className="mb-2 text-sm font-bold text-ink">الحد الأدنى للتقييم</p>
          <Select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} icon="star">
            {RATING_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Sort modal ---------- */
function SortModal({ current, onApply, onClose }) {
  const [selected, setSelected] = useState(`${current.key}:${current.dir}`)

  return (
    <Modal
      open
      onClose={onClose}
      title="ترتيب النتائج"
      subtitle="اختر طريقة الترتيب المفضلة"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={() => onApply(selected)}>تطبيق الترتيب</Button>
        </>
      }
    >
      <ul className="space-y-1.5">
        {SORT_OPTIONS.map((o) => {
          const val = `${o.key}:${o.dir}`
          const active = selected === val
          return (
            <li key={val}>
              <button
                onClick={() => setSelected(val)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                  active
                    ? 'border-accent-soft bg-mint text-primary'
                    : 'border-line bg-white text-ink-soft hover:border-primary/30 hover:text-primary'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`grid size-5 place-items-center rounded-full border-2 transition-all ${
                      active ? 'border-primary' : 'border-line'
                    }`}
                  >
                    {active && <span className="size-2.5 rounded-full bg-primary" />}
                  </span>
                  {o.label}
                </span>
                {active && <Icon name="check" size={16} strokeWidth={2.4} />}
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}

/* ---------- Page ---------- */
export default function Specialists() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('الكل')
  const [specialties, setSpecialties] = useState([])
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState({ key: 'joinedAt', dir: 'desc' })
  const [page, setPage] = useState(1)

  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const counts = useMemo(() => {
    const c = { 'الكل': SPECIALISTS.length, نشط: 0, معلق: 0, موقوف: 0 }
    SPECIALISTS.forEach((s) => {
      c[s.status] += 1
    })
    return c
  }, [])

  const rows = useMemo(() => {
    const list = SPECIALISTS.filter((s) => matchSpecialist(s, { status, specialties, minRating, search }))
    return [...list].sort((a, b) => {
      const { key, dir } = sort
      const cmp = key === 'name' ? a.name.localeCompare(b.name, 'ar') : a[key] - b[key]
      return dir === 'asc' ? cmp : -cmp
    })
  }, [search, status, specialties, minRating, sort])

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
    setNotice('تم تصدير الملف بنجاح ✓')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">إدارة الأخصائيين</h2>
          <p className="mt-1 text-sm text-ink-soft">
            متابعة الأخصائيين المعتمدين على المنصة وحالاتهم وأدائهم
          </p>
        </div>
        <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => navigate('/specialists/add')}>
          إضافة أخصائي جديد
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

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATUS_OPTIONS.map((s) => (
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
              {s === 'الكل' ? 'إجمالي الأخصائيين' : s === 'نشط' ? 'أخصائي نشط' : s === 'معلق' ? 'بانتظار الموافقة' : 'أخصائي موقوف'}
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
              placeholder="ابحث بالاسم أو التخصص أو البريد الإلكتروني..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <Button
            variant={activeFilterCount > 0 ? 'primary' : 'outline'}
            icon={<Icon name="filter" size={17} />}
            onClick={() => setFilterOpen(true)}
          >
            فلتر
            {activeFilterCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-primary-dark">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <Button variant="outline" icon={<Icon name="sort" size={17} />} onClick={() => setSortOpen(true)}>
            فرز: {currentSortLabel}
          </Button>

          <Button variant="ghost" icon={<Icon name="download" size={17} />} onClick={exportCsv}>
            تصدير CSV
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {paged.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
              <Icon name="user-check" size={38} strokeWidth={1.6} />
            </div>
            <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد نتائج مطابقة</h3>
            <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
              جرّب تعديل كلمة البحث أو إعادة تعيين الفلاتر لعرض جميع الأخصائيين.
            </p>
            <Button variant="outline" className="mt-5" onClick={resetFilters}>
              إعادة تعيين الفلاتر
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                  <th className="px-5 py-3 text-start">الأخصائي</th>
                  <th className="px-4 py-3 text-start">التخصص</th>
                  <th className="px-4 py-3 text-start">التقييم</th>
                  <th className="px-4 py-3 text-start">الجلسات</th>
                  <th className="px-4 py-3 text-start">الرسوم</th>
                  <th className="px-4 py-3 text-start">الحالة</th>
                  <th className="px-4 py-3 text-start">تاريخ الانضمام</th>
                  <th className="px-5 py-3 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-mint/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size={40} />
                        <div>
                          <p className="flex items-center gap-1.5 font-bold text-ink">
                            {s.title} {s.name}
                            {s.verified && (
                              <Badge tone="soft" compact icon="check">
                                موثق
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-ink-mute">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink-soft">{s.specialty}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-extrabold text-ink">
                        <Icon name="star" size={14} className="text-amber-400" />
                        {s.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink-soft">{num(s.sessions)}</td>
                    <td className="px-4 py-3.5 font-semibold text-ink-soft">{num(s.fee)} ر.س</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={STATUS_TONE[s.status]} dot>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-ink-soft">{fmtDate(s.joinedAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="عرض التفاصيل"
                          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                          onClick={() => navigate(`/specialists/${s.id}`)}
                        >
                          <Icon name="eye" size={17} />
                        </button>
                        <button
                          title="تعديل"
                          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                          onClick={() => setNotice('نموذج تعديل بيانات الأخصائي سيأتي لاحقاً')}
                        >
                          <Icon name="edit" size={17} />
                        </button>
                        <button
                          title="حذف"
                          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-red-50 hover:text-red-500"
                          onClick={() => setNotice('حذف الأخصائي غير مفعل في هذه المرحلة')}
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

      {/* Modals */}
      {filterOpen && (
        <FilterModal
          initial={{ status, specialties, minRating }}
          search={search}
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
    </div>
  )
}
