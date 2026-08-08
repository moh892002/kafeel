import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { FAQS, FAQ_CATEGORIES } from '../data/faq'
import { num } from '../utils/format'

/* ---------- Add/Edit modal ---------- */
function FaqFormModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(
    initial ?? { category: FAQ_CATEGORIES[0], question: '', answer: '', pinned: false },
  )
  const [error, setError] = useState(null)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = () => {
    if (!form.question.trim()) {
      setError('يرجى كتابة السؤال')
      return
    }
    if (!form.answer.trim()) {
      setError('يرجى كتابة الإجابة')
      return
    }
    onSave({ ...form, question: form.question.trim(), answer: form.answer.trim() })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
      subtitle="الأسئلة الأكثر تداولاً من قبل العملاء"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={<Icon name="check" size={16} />} onClick={save}>
            {initial ? 'حفظ التعديلات' : 'إضافة السؤال'}
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
        <Select label="الفئة" id="faq-category" value={form.category} onChange={set('category')}>
          {FAQ_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Textarea label="السؤال" id="faq-question" rows={2} value={form.question} onChange={set('question')} placeholder="اكتب السؤال هنا..." />
        <Textarea label="الإجابة" id="faq-answer" rows={4} value={form.answer} onChange={set('answer')} placeholder="اكتب الإجابة الوافية..." />
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-ink">
          <input
            type="checkbox"
            checked={form.pinned}
            onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
            className="size-4 accent-primary"
          />
          تثبيت السؤال في أعلى القائمة
        </label>
      </div>
    </Modal>
  )
}

/* ---------- Page ---------- */
export default function Faq() {
  const [faqs, setFaqs] = useState(FAQS)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('الكل')
  const [openId, setOpenId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const counts = useMemo(() => {
    const c = { 'الكل': faqs.length }
    FAQ_CATEGORIES.forEach((x) => {
      c[x] = 0
    })
    faqs.forEach((f) => {
      c[f.category] += 1
    })
    return c
  }, [faqs])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = faqs.filter((f) => {
      if (category !== 'الكل' && f.category !== category) return false
      if (q && !`${f.question} ${f.answer}`.toLowerCase().includes(q)) return false
      return true
    })
    return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.id - b.id)
  }, [faqs, search, category])

  const save = (data) => {
    if (editing) {
      setFaqs((prev) => prev.map((f) => (f.id === editing.id ? { ...f, ...data } : f)))
      setNotice('تم حفظ التعديلات بنجاح ✓')
    } else {
      setFaqs((prev) => [...prev, { id: prev.reduce((m, x) => Math.max(m, x.id), 0) + 1, ...data, helpful: 0 }])
      setNotice('تمت إضافة السؤال بنجاح ✓')
    }
    setEditing(null)
    setAddOpen(false)
  }

  const confirmDelete = () => {
    setFaqs((prev) => prev.filter((f) => f.id !== deleteTarget.id))
    setNotice(`تم حذف السؤال «${deleteTarget.question}» بنجاح`)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">الأسئلة الأكثر تداولاً</h2>
          <p className="mt-1 text-sm text-ink-soft">إدارة الأسئلة الشائعة التي تظهر للعملاء في مركز المساعدة</p>
        </div>
        <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => setAddOpen(true)}>
          إضافة سؤال جديد
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {['الكل', ...FAQ_CATEGORIES].map((s) => (
          <button
            key={s}
            onClick={() => setCategory(s)}
            className={`rounded-2xl border px-4 py-3.5 text-start transition-all hover:-translate-y-0.5 ${
              category === s ? 'border-primary bg-primary text-white shadow-[0_6px_16px_rgba(7,94,102,0.35)]' : 'border-line bg-card shadow-card hover:shadow-pop'
            }`}
          >
            <p className={`text-2xl font-extrabold ${category === s ? 'text-white' : 'text-ink'}`}>{num(counts[s] ?? 0)}</p>
            <p className={`text-xs font-semibold ${category === s ? 'text-white/70' : 'text-ink-mute'}`}>
              {s === 'الكل' ? 'إجمالي الأسئلة' : s}
            </p>
          </button>
        ))}
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          icon="search"
          placeholder="ابحث في الأسئلة والأجوبة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {/* Accordion */}
      {rows.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-20 text-center">
          <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
            <Icon name="help" size={38} strokeWidth={1.6} />
          </div>
          <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد أسئلة مطابقة</h3>
          <p className="mt-1.5 max-w-sm text-sm text-ink-soft">جرّب تعديل البحث أو الفلاتر، أو أضف سؤالاً جديداً.</p>
          <Button variant="outline" className="mt-5" onClick={() => { setSearch(''); setCategory('الكل') }}>
            إعادة تعيين الفلاتر
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {rows.map((f) => {
              const open = openId === f.id
              return (
                <li key={f.id} className={open ? 'bg-mint/30' : ''}>
                  <button
                    onClick={() => setOpenId(open ? null : f.id)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start transition-colors hover:bg-mint/40"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {f.pinned && <Icon name="star" size={15} className="shrink-0 text-amber-400" />}
                      <span className={`truncate text-sm ${open ? 'font-extrabold text-primary' : 'font-bold text-ink'}`}>
                        {f.question}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2.5">
                      <Badge tone="soft" compact>{f.category}</Badge>
                      <span className="hidden text-[11px] font-semibold text-ink-mute sm:block">{num(f.helpful)} مفيد</span>
                      <Icon
                        name="chevron-down"
                        size={16}
                        className={`text-ink-mute transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''}`}
                      />
                    </span>
                  </button>
                  {open && (
                    <div className="animate-fade-in border-t border-line px-5 py-4">
                      <p className="text-sm leading-relaxed text-ink-soft">{f.answer}</p>
                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setEditing(f)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:bg-mint hover:text-primary"
                        >
                          <Icon name="edit" size={13} />
                          تعديل
                        </button>
                        <button
                          onClick={() => setDeleteTarget(f)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-100"
                        >
                          <Icon name="trash" size={13} />
                          حذف
                        </button>
                        <span className="ms-auto text-[11px] font-semibold text-ink-mute">
                          وجده {num(f.helpful)} من العملاء مفيداً
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* Modals */}
      {(addOpen || editing) && (
        <FaqFormModal initial={editing} onClose={() => { setAddOpen(false); setEditing(null) }} onSave={save} />
      )}
      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          title="حذف السؤال"
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
              هل أنت متأكد من حذف السؤال <span className="font-extrabold text-ink">«{deleteTarget.question}»</span>؟
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
