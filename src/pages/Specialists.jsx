import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { Input, Select, Textarea } from '../components/ui/Input'
import {
  EXPERIENCE_OPTIONS,
  QUALIFICATION_OPTIONS,
  SPECIALTY_OPTIONS as FALLBACK_SPECIALTIES,
  TITLE_OPTIONS,
} from '../data/specialists'
import { allFilter, options, useMeta } from '../meta'
import { api } from '../api'
import { fmtDate, num } from '../utils/format'

const PAGE_SIZE = 8

const STATUS_TONE = {
  نشط: 'success',
  معلق: 'warning',
  موقوف: 'danger',
}

const STATUS_DESC = {
  نشط: 'الأخصائي معتمد ويمكنه استقبال الجلسات',
  معلق: 'بانتظار مراجعة المستندات والمؤهلات',
  موقوف: 'تم إيقاف الحساب ولا يمكنه استقبال الجلسات',
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
  if (minRating > 0 && Number(s.rating ?? 0) < minRating) return false
  const q = String(search).trim().toLowerCase()
  if (q && !`${s.name} ${s.specialty} ${s.email}`.toLowerCase().includes(q)) return false
  return true
}

/* ---------- Filter modal ---------- */
function FilterModal({ initial, search, specialists, specialtyOptions, onApply, onClose }) {
  const statusOptions = allFilter(options(useMeta(), 'specialistStatus'))
  const [status, setStatus] = useState(initial.status)
  const [specialties, setSpecialties] = useState(initial.specialties)
  const [minRating, setMinRating] = useState(initial.minRating)

  // Live count based on the draft selections (not the already-applied filters)
  const count = useMemo(
    () =>
      specialists.filter((s) => matchSpecialist(s, { status, specialties, minRating, search })).length,
    [specialists, search, status, specialties, minRating],
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
            {statusOptions.map((s) => (
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
            {specialtyOptions.map((s) => {
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

/* ---------- Edit specialist modal ---------- */
function EditSpecialistModal({ specialist, specialtyOptions, onSaved, onClose }) {
  const [form, setForm] = useState({
    title: specialist.title ?? 'د.',
    name: specialist.name ?? '',
    specialty: specialist.specialty ?? '',
    email: specialist.email ?? '',
    phone: specialist.phone ?? '',
    yearsExperience: specialist.yearsExperience ?? '',
    qualification: specialist.qualification ?? '',
    fee: specialist.fee ?? 0,
    bio: specialist.bio ?? '',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Never drop the current specialty out of the dropdown, even if it's not in the derived list.
  const specialtyOpts = useMemo(() => {
    if (specialtyOptions.includes(form.specialty)) return specialtyOptions
    return [form.specialty, ...specialtyOptions].filter(Boolean)
  }, [specialtyOptions, form.specialty])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.name.trim()) {
      setError('يرجى إدخال الاسم')
      return
    }
    if (!form.specialty) {
      setError('يرجى اختيار التخصص')
      return
    }
    setSubmitting(true)
    try {
      const updated = await api.updateSpecialist(specialist.id, {
        title: form.title,
        name: form.name.trim(),
        specialty: form.specialty,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        bio: form.bio.trim() || null,
        yearsExperience: form.yearsExperience || null,
        qualification: form.qualification || null,
        fee: Number(form.fee) || 0,
      })
      onSaved(updated)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="تعديل بيانات الأخصائي"
      subtitle={`${specialist.title} ${specialist.name}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            onClick={save}
            disabled={submitting}
            icon={submitting ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="check" size={16} />}
          >
            {submitting ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
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
          <Select id="ed-title" label="اللقب" value={form.title} onChange={set('title')}>
            {TITLE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t === 'د.' ? 'دكتور (د.)' : 'أستاذ (أ.)'}
              </option>
            ))}
          </Select>
          <Input id="ed-name" label="الاسم الكامل *" value={form.name} onChange={set('name')} placeholder="مثال: د. خالد السالم" />
          <Select id="ed-specialty" label="التخصص الرئيسي *" value={form.specialty} onChange={set('specialty')}>
            {specialtyOpts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            id="ed-years"
            label="سنوات الخبرة"
            value={form.yearsExperience}
            onChange={set('yearsExperience')}
          >
            <option value="">غير محدد</option>
            {EXPERIENCE_OPTIONS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
          <Input id="ed-email" label="البريد الإلكتروني" type="email" value={form.email} onChange={set('email')} />
          <Input id="ed-phone" label="رقم الجوال" type="tel" value={form.phone} onChange={set('phone')} placeholder="05xxxxxxxx" />
          <Select id="ed-qualification" label="المؤهل العلمي" value={form.qualification} onChange={set('qualification')}>
            <option value="">غير محدد</option>
            {QUALIFICATION_OPTIONS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </Select>
          <Input id="ed-fee" label="رسوم الجلسة (ر.س)" type="number" min="0" value={form.fee} onChange={set('fee')} />
        </div>
        <Textarea id="ed-bio" label="نبذة تعريفية" rows={3} value={form.bio} onChange={set('bio')} placeholder="نبذة قصيرة عن الأخصائي وخبراته..." />
      </div>
    </Modal>
  )
}

/* ---------- Status change modal ---------- */
function StatusModal({ specialist, busy, onConfirm, onClose }) {
  const statusOptions = allFilter(options(useMeta(), 'specialistStatus'))
  const [selected, setSelected] = useState(specialist.status)

  return (
    <Modal
      open
      onClose={onClose}
      title="تغيير حالة الأخصائي"
      subtitle={`${specialist.title} ${specialist.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
          <Button
            onClick={() => onConfirm(selected)}
            disabled={busy || selected === specialist.status}
            icon={busy ? <Icon name="loader" size={16} className="animate-spin" /> : undefined}
          >
            حفظ الحالة
          </Button>
        </>
      }
    >
      <ul className="space-y-2">
        {statusOptions.filter((s) => s !== 'الكل').map((s) => {
          const active = selected === s
          return (
            <li key={s}>
              <button
                onClick={() => setSelected(s)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start transition-all ${
                  active
                    ? 'border-primary bg-mint text-primary'
                    : 'border-line bg-white text-ink-soft hover:border-primary/30 hover:text-primary'
                }`}
              >
                <span>
                  <span className="flex items-center gap-2.5 text-sm font-extrabold">
                    <Badge tone={STATUS_TONE[s]} dot>{s}</Badge>
                  </span>
                  <span className="mt-1 block text-xs text-ink-mute">{STATUS_DESC[s]}</span>
                </span>
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-all ${
                    active ? 'border-primary' : 'border-line'
                  }`}
                >
                  {active && <span className="size-2.5 rounded-full bg-primary" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}

/* ---------- Delete confirm modal ---------- */
function DeleteModal({ specialist, busy, onConfirm, onClose }) {
  return (
    <Modal
      open
      onClose={onClose}
      title="حذف الأخصائي"
      subtitle="لا يمكن التراجع عن هذا الإجراء"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={busy}
            icon={busy ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="trash" size={16} />}
          >
            نعم، احذف
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-500">
          <Icon name="trash" size={22} />
        </span>
        <p className="text-sm leading-relaxed text-ink-soft">
          سيتم حذف <span className="font-extrabold text-ink">{specialist.title} {specialist.name}</span> من المنصة نهائياً.
        </p>
      </div>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-700">
        ملاحظة: لا يمكن حذف الأخصائي إذا كان مرتبطاً بجلسات أو دورات قائمة — حمايةً لبيانات المنصة،
        وسيتم إشعارك في هذه الحالة.
      </div>
    </Modal>
  )
}

/* ---------- Page ---------- */
export default function Specialists() {
  const navigate = useNavigate()
  const meta = useMeta()
  const statusOptions = allFilter(options(meta, 'specialistStatus'))
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
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

  const load = () => {
    setError(null)
    setData(null)
    api
      .specialists()
      .then((list) => setData(list))
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    let cancelled = false
    api
      .specialists()
      .then((list) => {
        if (!cancelled) setData(list)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

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
      <Card className="flex flex-col items-center px-6 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-red-50 text-red-500">
          <Icon name="x" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">تعذر تحميل الأخصائيين</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{error}</p>
        <Button variant="outline" className="mt-5" onClick={load}>
          إعادة المحاولة
        </Button>
      </Card>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <div className="flex items-center gap-3">
          <Icon name="loader" size={18} className="animate-spin" />
          <span className="text-sm font-semibold">جاري تحميل الأخصائيين...</span>
        </div>
      </div>
    )
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
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold animate-slide-in ${
            notice.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-accent-soft/30 bg-mint text-primary'
          }`}
        >
          <span className="flex items-center gap-2">
            <Icon
              name={notice.tone === 'error' ? 'x' : 'check'}
              size={16}
              strokeWidth={2.4}
            />
            {notice.text}
          </span>
          <button
            onClick={() => setNotice(null)}
            aria-label="إغلاق"
            className={`grid size-6 place-items-center rounded-md transition-colors ${
              notice.tone === 'error' ? 'hover:bg-red-100' : 'hover:bg-accent/30'
            }`}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statusOptions.map((s) => (
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
              {s === 'الكل' ? 'إجمالي الأخصائيين' : s}
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
                        {Number(s.rating ?? 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink-soft">{num(s.sessions)}</td>
                    <td className="px-4 py-3.5 font-semibold text-ink-soft">{num(s.fee)} ر.س</td>
                    <td className="px-4 py-3.5">
                      <button
                        title="تغيير الحالة"
                        onClick={() => setStatusTarget(s)}
                        className="rounded-lg transition-transform hover:scale-105 active:scale-95"
                      >
                        <Badge tone={STATUS_TONE[s.status]} dot>
                          {s.status}
                        </Badge>
                      </button>
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
                          onClick={() => setEditTarget(s)}
                        >
                          <Icon name="edit" size={17} />
                        </button>
                        <button
                          title="حذف"
                          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-red-50 hover:text-red-500"
                          onClick={() => setDeleteTarget(s)}
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
