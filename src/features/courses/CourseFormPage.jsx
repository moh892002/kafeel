import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import PageState from '@/components/ui/PageState'
import Badge from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import FormError from '@/components/ui/FormError'
import SuccessCard from '@/components/ui/SuccessCard'
import PageHeader from '@/components/ui/PageHeader'
import CourseCover from '@/components/ui/CourseCover'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { api } from '@/app/api'
import { CATEGORIES, COVERS } from '@/features/courses/constants'
import { options, useMeta } from '@/app/meta'

const emptyForm = {
  title: '', category: '', level: 'مبتدئ', instructorId: '', price: '', sessions: '4',
  hours: '6', status: 'مسودة', description: '', cover: COVERS[0],
}

function PillGroup({ options, value, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
            value === o
              ? 'border-accent-soft bg-mint text-primary'
              : 'border-line bg-surface text-ink-soft hover:border-primary/30 hover:text-primary'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export default function CourseForm() {
  const { id } = useParams()
  const meta = useMeta()
  const navigate = useNavigate()
  const isEdit = id !== undefined

  const [specialists, setSpecialists] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [savedId, setSavedId] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // Instructor list for the dropdown (live, so ids match the API).
  useEffect(() => {
    let cancelled = false
    api.specialists()
      .then((list) => {
        if (!cancelled) setSpecialists(list ?? [])
      })
      .catch(() => {
        /* dropdown is empty — submit will surface the error */
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Edit mode: prefill from the live course.
  useEffect(() => {
    if (!isEdit) return undefined
    let cancelled = false
    api.course(id)
      .then((c) => {
        if (cancelled) return
        setForm({
          title: c.title,
          category: c.category,
          level: c.level,
          instructorId: String(c.instructor?.id ?? ''),
          price: String(c.price ?? 0),
          sessions: String(c.sessions ?? 4),
          hours: String(c.hours ?? 6),
          status: c.status,
          description: c.description ?? '',
          cover: c.cover ?? COVERS[0],
        })
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setNotFound(e.status === 404)
        setError(e.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isEdit, id])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const pick = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const valid =
    form.title.trim() !== '' &&
    form.category !== '' &&
    form.instructorId !== '' &&
    String(form.price).trim() !== ''

  const save = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    const payload = {
      title: form.title.trim(),
      category: form.category,
      level: form.level,
      instructorId: Number(form.instructorId),
      price: Number(form.price) || 0,
      sessions: Number(form.sessions) || 4,
      hours: Number(form.hours) || 6,
      status: form.status,
      cover: form.cover,
      description: form.description.trim() || null,
    }
    try {
      const result = isEdit ? await api.updateCourse(id, payload) : await api.createCourse(payload)
      setSavedId(result.id)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل بيانات الدورة..."
      />
    )
  }

  /* ---------- Not found ---------- */
  if (isEdit && notFound) {
    return (
      <PageState
        mode="notFound"
        icon="book"
        title="الدورة غير موجودة"
        message="لم نتمكن من العثور على هذه الدورة، قد تكون محذوفة."
      >
        <Button variant="outline" className="mt-6" icon={<Icon name="chevron-right" size={16} />} onClick={() => navigate('/courses')}>
          العودة لقائمة الدورات
        </Button>
      </PageState>
    )
  }

  /* ---------- Error ---------- */
  if (isEdit && error) {
    return (
      <PageState
        mode="error"
        title="تعذر تحميل الدورة"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  /* ---------- Success ---------- */
  if (savedId) {
    return (
      <SuccessCard
        title={isEdit ? 'تم تحديث الدورة بنجاح' : 'تم إنشاء الدورة بنجاح 🎉'}
        message={
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            الدورة <span className="font-extrabold text-primary">«{form.title}»</span> {isEdit ? 'تم تحديث بياناتها' : 'أصبحت متاحة الآن في نظام المنصة'}.
          </p>
        }
        actions={
          <>
            <Button onClick={() => navigate(`/courses/${savedId}`)} icon={<Icon name="eye" size={16} />}>
              عرض الدورة
            </Button>
            <Button variant="outline" onClick={() => navigate('/courses')}>العودة للدورات</Button>
          </>
        }
      />
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <PageHeader
        title={isEdit ? 'تعديل الدورة' : 'إضافة دورة جديدة'}
        kicker="الدورات"
        backTo="/courses"
        actions={<Badge tone="mint">{isEdit ? 'وضع التعديل' : 'دورة جديدة'}</Badge>}
      />

      <Card>
        <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
          {error && <FormError rounded="xl" className="sm:col-span-2">{error}</FormError>}
          <div className="sm:col-span-2">
            <Input id="c-title" label="عنوان الدورة *" placeholder="مثال: دورة المهارات الأسرية المتقدمة" value={form.title} onChange={set('title')} />
          </div>
          <Select id="c-category" label="الفئة *" value={form.category} onChange={set('category')}>
            <option value="">اختر الفئة...</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select id="c-instructor" label="المدرب *" value={form.instructorId} onChange={set('instructorId')}>
            <option value="">اختر المدرب...</option>
            {specialists.map((s) => (
              <option key={s.id} value={s.id}>{s.title} {s.name} — {s.specialty}</option>
            ))}
          </Select>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">المستوى</p>
            <PillGroup options={options(meta, 'courseLevel')} value={form.level} onPick={pick('level')} />
          </div>
          <Input id="c-price" label="السعر (ر.س) *" type="number" min="0" placeholder="0 = مجانية" value={form.price} onChange={set('price')} />
          <Input id="c-sessions" label="عدد الجلسات" type="number" min="1" value={form.sessions} onChange={set('sessions')} />
          <Input id="c-hours" label="المدة الإجمالية (ساعات)" type="number" min="1" value={form.hours} onChange={set('hours')} />
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">الحالة</p>
            <PillGroup options={options(meta, 'courseStatus')} value={form.status} onPick={pick('status')} />
          </div>

          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-semibold text-ink">غلاف الدورة</p>
            <div className="flex items-center gap-4">
              <CourseCover cover={form.cover} className="h-16 w-24 rounded-xl" iconSize={26} />
              <div className="flex flex-wrap gap-2">
                {COVERS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => pick('cover')(color)}
                    aria-label={`لون ${color}`}
                    className={`size-8 rounded-lg transition-all hover:scale-110 ${
                      form.cover === color ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Textarea id="c-desc" label="وصف الدورة" rows={4} placeholder="وصف مختصر لمحتوى الدورة وأهدافها..." value={form.description} onChange={set('description')} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface/50 px-6 py-4">
          <p className="text-xs text-ink-mute">الحقول المميزة بـ <span className="font-extrabold text-primary">*</span> مطلوبة</p>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" onClick={() => navigate('/courses')}>إلغاء</Button>
            <Button onClick={save} disabled={!valid || submitting} icon={<Icon name="check" size={16} strokeWidth={2.4} />}>
              {submitting ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إنشاء الدورة'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
