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
import { Input } from '@/components/ui/Input'
import { api } from '@/app/api'
import useAsync from '@/hooks/useAsync'
import { FAQ_CATEGORIES } from '@/features/faq/constants'
import { num } from '@/utils/format'
import FaqFormModal from '@/features/faq/components/FaqFormModal'

export default function Faq() {
  const { data: faqs, setData: setFaqs, loading, error, reload } = useAsync(
    () => api.faqs().then((l) => l ?? []),
    [],
    [],
  )
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('الكل')
  const [openId, setOpenId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
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

  const save = async (data) => {
    if (editing) {
      const updated = await api.updateFaq(editing.id, data)
      setFaqs((prev) => prev.map((f) => (f.id === editing.id ? updated : f)))
      setNotice({ text: 'تم حفظ التعديلات بنجاح ✓', tone: 'success' })
    } else {
      const created = await api.createFaq(data)
      setFaqs((prev) => [...prev, created])
      setNotice({ text: 'تمت إضافة السؤال بنجاح ✓', tone: 'success' })
    }
    setEditing(null)
    setAddOpen(false)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteFaq(deleteTarget.id)
      setFaqs((prev) => prev.filter((f) => f.id !== deleteTarget.id))
      setNotice({ text: `تم حذف السؤال «${deleteTarget.question}» بنجاح`, tone: 'success' })
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
        title="تعذر تحميل الأسئلة الشائعة"
        message={error}
        onRetry={reload}
      />
    )
  }

  if (loading) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل الأسئلة الشائعة..."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="الأسئلة الأكثر تداولاً"
        subtitle="إدارة الأسئلة الشائعة التي تظهر للعملاء في مركز المساعدة"
        actions={
          <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => setAddOpen(true)}>
            إضافة سؤال جديد
          </Button>
        }
      />

      {/* Notice */}
      {notice && <Notice text={notice.text} tone={notice.tone} onDismiss={() => setNotice(null)} />}

      {/* Stat strip */}
      <StatStrip
        cols="lg:grid-cols-5"
        active={category}
        onSelect={setCategory}
        items={['الكل', ...FAQ_CATEGORIES].map((s) => ({
          key: s,
          value: num(counts[s] ?? 0),
          label: s === 'الكل' ? 'إجمالي الأسئلة' : s,
        }))}
      />

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
        <PageState
          mode="empty"
          icon="help"
          title="لا توجد أسئلة مطابقة"
          message="جرّب تعديل البحث أو الفلاتر، أو أضف سؤالاً جديداً."
        >
          <Button variant="outline" className="mt-5" onClick={() => { setSearch(''); setCategory('الكل') }}>
            إعادة تعيين الفلاتر
          </Button>
        </PageState>
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
      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="حذف السؤال"
        confirmLabel="حذف نهائي"
        busy={deleting}
        message={
          <>
            هل أنت متأكد من حذف السؤال <span className="font-extrabold text-ink">«{deleteTarget?.question}»</span>؟
          </>
        }
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
