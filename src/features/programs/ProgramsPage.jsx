import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { api } from '../api'
import { PROGRAM_CATEGORIES } from '../data/programs'
import { allFilter, options, statusChoices, useMeta } from '../meta'
import { fmtDate, num } from '../utils/format'

const STATUS_TONE = { مفتوح: 'success', مكتمل: 'neutral', معلق: 'warning' }

const SORT_OPTIONS = [
  { key: 'startDate', dir: 'asc', label: 'الأقرب بداية' },
  { key: 'enrolled', dir: 'desc', label: 'الأكثر تسجيلاً' },
  { key: 'rating', dir: 'desc', label: 'الأعلى تقييماً' },
  { key: 'price', dir: 'asc', label: 'السعر الأقل' },
]

const localDateStr = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/* ---------- Details modal ---------- */
function ProgramDetailsModal({ program, onClose, onRegister }) {
  const p = program
  const pct = Math.round((p.enrolled / Math.max(1, p.capacity)) * 100)
  return (
    <Modal
      open
      onClose={onClose}
      title="تفاصيل البرنامج"
      subtitle={`${p.category} · ${p.sessions} جلسات`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
          {p.status === 'مفتوح' &&
            (p.capacity > 0 && p.enrolled >= p.capacity ? (
              <Button disabled>
                <Icon name="x" size={16} strokeWidth={2.4} className="mr-1" />
                البرنامج ممتلئ
              </Button>
            ) : (
              <Button icon={<Icon name="check" size={16} />} onClick={onRegister}>
                سجّل الآن
              </Button>
            ))}
        </>
      }
    >
      <div className="space-y-4">
        <div className={`h-24 overflow-hidden rounded-2xl bg-gradient-to-l ${p.cover ?? 'from-primary to-accent-soft'}`}>
          <div className="flex h-full items-center justify-between px-5">
            <p className="max-w-[70%] text-lg font-extrabold text-white">{p.title}</p>
            <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-ink-soft">{p.description}</p>

        <div className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
          <Avatar name={p.instructor?.name ?? '—'} size={40} />
          <div>
            <p className="text-sm font-bold text-ink">
              {p.instructor?.title ?? ''} {p.instructor?.name ?? '—'}
            </p>
            <p className="text-xs text-ink-mute">{p.instructor?.specialty ?? ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: 'calendar', label: 'تاريخ البدء', value: fmtDate(p.startDate) },
            { icon: 'clipboard', label: 'عدد الجلسات', value: `${p.sessions} جلسة` },
            { icon: 'wallet', label: 'السعر', value: Number(p.price) === 0 ? 'مجاني' : `${num(p.price)} ر.س` },
            { icon: 'star', label: 'التقييم', value: Number(p.rating ?? 0).toFixed(1) },
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
            <span className="text-ink-soft">المسجلون</span>
            <span className="text-primary">
              {num(p.enrolled)} من {num(p.capacity)} ({pct}%)
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-soft to-primary transition-all duration-700"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Enroll modal ---------- */
function EnrollModal({ program, onClose, onEnrolled }) {
  const meta = useMeta()
  const methods = options(meta, 'paymentMethod')
  const [form, setForm] = useState({ clientName: '', method: methods[0] ?? 'مدى' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const save = async () => {
    if (!form.clientName.trim()) {
      setError('يرجى إدخال اسم العميل')
      return
    }
    setSubmitting(true)
    try {
      await api.enrollProgram(program.id, {
        clientName: form.clientName.trim(),
        method: form.method,
      })
      onEnrolled(form.clientName.trim())
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  // capacity 0 means unlimited seats — never show a (misleading) seat count then.
  const unlimited = Number(program.capacity) <= 0
  const seats = unlimited ? null : Math.max(0, program.capacity - program.enrolled)

  return (
    <Modal
      open
      onClose={onClose}
      title="تسجيل في البرنامج"
      subtitle={`«${program.title}» — ${unlimited ? 'مقاعد غير محدودة' : `${seats} مقعد متبقي`}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={<Icon name="check" size={16} />} onClick={save} disabled={submitting}>
            {submitting ? 'جارٍ التسجيل...' : 'تأكيد التسجيل'}
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
        <Input
          label="اسم العميل"
          id="pe-name"
          placeholder="مثال: أحمد الشمري"
          value={form.clientName}
          onChange={(e) => {
            setForm((f) => ({ ...f, clientName: e.target.value }))
            setError(null)
          }}
        />
        <Select
          label="وسيلة الدفع"
          id="pe-method"
          icon="wallet"
          value={form.method}
          onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
        >
          {methods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>
    </Modal>
  )
}

/* ---------- Add program modal ---------- */
function AddProgramModal({ specialists, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    category: PROGRAM_CATEGORIES[0],
    instructorId: specialists[0]?.id ?? '',
    price: 300,
    capacity: 60,
    sessions: 8,
    startDate: localDateStr(),
    description: '',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.title.trim()) {
      setError('يرجى إدخال اسم البرنامج')
      return
    }
    if (!form.instructorId) {
      setError('يرجى اختيار مقدم البرنامج')
      return
    }
    setSubmitting(true)
    try {
      const created = await api.createProgram({
        title: form.title.trim(),
        category: form.category,
        instructorId: Number(form.instructorId),
        description: form.description.trim() || null,
        sessions: Number(form.sessions) || 8,
        price: Number(form.price) || 0,
        capacity: Number(form.capacity) || 60,
        startDate: form.startDate,
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
      title="إضافة برنامج جديد"
      subtitle="أنشئ برنامجاً تدريبياً جديداً على المنصة"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={<Icon name="plus" size={16} strokeWidth={2.4} />} onClick={save} disabled={submitting}>
            {submitting ? 'جارٍ الإنشاء...' : 'إنشاء البرنامج'}
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
        <Input label="اسم البرنامج" id="pg-title" placeholder="مثال: برنامج إدارة الضغوط" value={form.title} onChange={set('title')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="الفئة" id="pg-category" value={form.category} onChange={set('category')}>
            {PROGRAM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select label="مقدم البرنامج" id="pg-instructor" icon="user-check" value={form.instructorId} onChange={set('instructorId')}>
            {specialists.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input label="السعر (ر.س)" id="pg-price" type="number" min="0" value={form.price} onChange={set('price')} />
          <Input label="الطاقة" id="pg-capacity" type="number" min="1" value={form.capacity} onChange={set('capacity')} />
          <Input label="الجلسات" id="pg-sessions" type="number" min="1" value={form.sessions} onChange={set('sessions')} />
          <Input label="تاريخ البدء" id="pg-start" type="date" value={form.startDate} onChange={set('startDate')} />
        </div>
        <Textarea label="وصف البرنامج" id="pg-desc" rows={3} value={form.description} onChange={set('description')} placeholder="نبذة عن البرنامج وأهدافه..." />
      </div>
    </Modal>
  )
}

/* ---------- Page ---------- */
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
      <Card className="flex flex-col items-center px-6 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-red-50 text-red-500">
          <Icon name="x" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">تعذر تحميل البرامج</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{error}</p>
        <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </Card>
    )
  }

  if (loading && programs.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Icon name="loader" size={18} className="animate-spin" />
          جاري تحميل البرامج...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">البرامج</h2>
          <p className="mt-1 text-sm text-ink-soft">البرامج التدريبية الجماعية على المنصة وإدارة تسجيلها</p>
        </div>
        <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => setAddOpen(true)}>
          إضافة برنامج جديد
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s)
            }}
            className={`rounded-2xl border px-4 py-3.5 text-start transition-all hover:-translate-y-0.5 ${
              status === s ? 'border-primary bg-primary text-white shadow-[0_6px_16px_rgba(7,94,102,0.35)]' : 'border-line bg-card shadow-card hover:shadow-pop'
            }`}
          >
            <p className={`text-2xl font-extrabold ${status === s ? 'text-white' : 'text-ink'}`}>{num(counts[s])}</p>
            <p className={`text-xs font-semibold ${status === s ? 'text-white/70' : 'text-ink-mute'}`}>
              {s === 'الكل' ? 'إجمالي البرامج' : s}
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
              placeholder="ابحث باسم البرنامج أو الفئة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select className="w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="الكل">كل الفئات</option>
            {PROGRAM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select className="w-44" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={`${o.key}:${o.dir}`} value={`${o.key}:${o.dir}`}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Grid */}
      {rows.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-20 text-center">
          <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
            <Icon name="megaphone" size={38} strokeWidth={1.6} />
          </div>
          <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد برامج مطابقة</h3>
          <p className="mt-1.5 max-w-sm text-sm text-ink-soft">جرّب تعديل البحث أو الفلاتر لعرض جميع البرامج.</p>
          <Button variant="outline" className="mt-5" onClick={() => { setSearch(''); setStatus('الكل'); setCategory('الكل') }}>
            إعادة تعيين الفلاتر
          </Button>
        </Card>
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
      {addOpen && <AddProgramModal specialists={specialists} onClose={() => setAddOpen(false)} onSaved={addProgram} />}

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="حذف البرنامج"
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
            هل أنت متأكد من حذف البرنامج <span className="font-extrabold text-ink">«{deleteTarget?.title}»</span>؟
            سيتم حذف جميع بياناته وبيانات المسجلين فيه نهائياً.
          </p>
        </div>
      </Modal>
    </div>
  )
}
