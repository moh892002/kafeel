import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { SPECIALISTS } from '../data/specialists'
import { PROGRAMS, PROGRAM_CATEGORIES, PROGRAM_STATUSES, PROGRAM_COVERS } from '../data/programs'
import { fmtDate, num } from '../utils/format'

const STATUS_TONE = { مفتوح: 'success', مكتمل: 'neutral', معلق: 'warning' }

const SORT_OPTIONS = [
  { key: 'startDate', dir: 'asc', label: 'الأقرب بداية' },
  { key: 'enrolled', dir: 'desc', label: 'الأكثر تسجيلاً' },
  { key: 'rating', dir: 'desc', label: 'الأعلى تقييماً' },
  { key: 'price', dir: 'asc', label: 'السعر الأقل' },
]

/* ---------- Details modal ---------- */
function ProgramDetailsModal({ program, onClose, onRegister }) {
  const p = program
  const pct = Math.round((p.enrolled / p.capacity) * 100)
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
          {p.status === 'مفتوح' && (
            <Button icon={<Icon name="check" size={16} />} onClick={onRegister}>
              سجّل الآن
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className={`h-24 overflow-hidden rounded-2xl bg-gradient-to-l ${p.cover}`}>
          <div className="flex h-full items-center justify-between px-5">
            <p className="max-w-[70%] text-lg font-extrabold text-white">{p.title}</p>
            <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-ink-soft">{p.description}</p>

        <div className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
          <Avatar name={p.instructor.name} size={40} />
          <div>
            <p className="text-sm font-bold text-ink">
              {p.instructor.title} {p.instructor.name}
            </p>
            <p className="text-xs text-ink-mute">{p.instructor.specialty}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: 'calendar', label: 'تاريخ البدء', value: fmtDate(p.startDate) },
            { icon: 'clipboard', label: 'عدد الجلسات', value: `${p.sessions} جلسة` },
            { icon: 'wallet', label: 'السعر', value: p.price === 0 ? 'مجاني' : `${num(p.price)} ر.س` },
            { icon: 'star', label: 'التقييم', value: p.rating.toFixed(1) },
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

/* ---------- Add program modal ---------- */
function AddProgramModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: '',
    category: PROGRAM_CATEGORIES[0],
    price: 300,
    capacity: 60,
    sessions: 8,
    description: '',
  })
  const [error, setError] = useState(null)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = () => {
    if (!form.title.trim()) {
      setError('يرجى إدخال اسم البرنامج')
      return
    }
    onSave({ ...form, title: form.title.trim(), description: form.description.trim() })
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
          <Button icon={<Icon name="plus" size={16} strokeWidth={2.4} />} onClick={save}>
            إنشاء البرنامج
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="الفئة" id="pg-category" value={form.category} onChange={set('category')}>
            {PROGRAM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input label="السعر (ر.س)" id="pg-price" type="number" min="0" value={form.price} onChange={set('price')} />
          <Input label="الطاقة الاستيعابية" id="pg-capacity" type="number" min="1" value={form.capacity} onChange={set('capacity')} />
        </div>
        <Input label="عدد الجلسات" id="pg-sessions" type="number" min="1" value={form.sessions} onChange={set('sessions')} />
        <Textarea label="وصف البرنامج" id="pg-desc" rows={3} value={form.description} onChange={set('description')} placeholder="نبذة عن البرنامج وأهدافه..." />
      </div>
    </Modal>
  )
}

/* ---------- Page ---------- */
export default function Programs() {
  const [programs, setPrograms] = useState(PROGRAMS)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('الكل')
  const [category, setCategory] = useState('الكل')
  const [sort, setSort] = useState('startDate:asc')
  const [details, setDetails] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const counts = useMemo(() => {
    const c = { الكل: programs.length, مفتوح: 0, مكتمل: 0, معلق: 0 }
    programs.forEach((x) => {
      c[x.status] += 1
    })
    return c
  }, [programs])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const [skey, sdir] = sort.split(':')
    const list = programs.filter((p) => {
      if (status !== 'الكل' && p.status !== status) return false
      if (category !== 'الكل' && p.category !== category) return false
      if (q && !`${p.title} ${p.instructor.name} ${p.category}`.toLowerCase().includes(q)) return false
      return true
    })
    return [...list].sort((a, b) => {
      const cmp = skey === 'startDate' ? a.startDate.localeCompare(b.startDate) : a[skey] - b[skey]
      return sdir === 'asc' ? cmp : -cmp
    })
  }, [programs, search, status, category, sort])

  const addProgram = (data) => {
    setPrograms((prev) => [
      {
        id: prev.reduce((m, x) => Math.max(m, x.id), 0) + 1,
        ...data,
        price: Number(data.price) || 0,
        capacity: Number(data.capacity) || 50,
        sessions: Number(data.sessions) || 8,
        instructor: SPECIALISTS[0],
        enrolled: 0,
        rating: 4,
        status: 'مفتوح',
        startDate: new Date().toISOString().slice(0, 10),
        cover: PROGRAM_COVERS[prev.length % PROGRAM_COVERS.length],
      },
      ...prev,
    ])
    setAddOpen(false)
    setNotice('تم إنشاء البرنامج بنجاح ✓')
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {PROGRAM_STATUSES.map((s) => (
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
              {s === 'الكل' ? 'إجمالي البرامج' : s === 'مفتوح' ? 'برنامج مفتوح للتسجيل' : s === 'مكتمل' ? 'برنامج مكتمل' : 'برنامج معلق'}
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
            const pct = Math.round((p.enrolled / p.capacity) * 100)
            return (
              <Card key={p.id} className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-pop">
                <button
                  onClick={() => setDetails(p)}
                  className={`block h-20 w-full bg-gradient-to-l ${p.cover} px-4 py-3 text-start`}
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
                    <Avatar name={p.instructor.name} size={30} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink-soft">
                        {p.instructor.title} {p.instructor.name}
                      </p>
                      <p className="text-[11px] text-ink-mute">{p.instructor.specialty}</p>
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
                      {p.price === 0 ? 'مجاني' : `${num(p.price)} ر.س`}
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
            setDetails(null)
            setNotice(`تم تسجيلك في برنامج «${details.title}» بنجاح ✓`)
          }}
        />
      )}
      {addOpen && <AddProgramModal onClose={() => setAddOpen(false)} onSave={addProgram} />}
    </div>
  )
}
