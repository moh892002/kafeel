import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import CourseCover from '../components/ui/CourseCover'
import { Input, Select, Textarea } from '../components/ui/Input'
import { findCourse, upsertCourse, nextCourseId, buildLessons, CATEGORIES, LEVELS, COURSE_STATUSES, COVERS } from '../data/courses'
import { SPECIALISTS } from '../data/specialists'

const INSTRUCTORS = [...new Set(SPECIALISTS.map((s) => `${s.title} ${s.name}`))].slice(0, 12)

const emptyForm = {
  title: '', category: '', level: 'مبتدئ', instructor: '', price: '', sessions: '4',
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
  const navigate = useNavigate()
  const isEdit = id !== undefined

  const editing = useMemo(() => (isEdit ? findCourse(id) : null), [isEdit, id])

  const [form, setForm] = useState(() =>
    editing
      ? {
          title: editing.title,
          category: editing.category,
          level: editing.level,
          instructor: editing.instructor,
          price: String(editing.price),
          sessions: String(editing.sessions),
          hours: String(editing.hours),
          status: editing.status,
          description: editing.description,
          cover: editing.cover,
        }
      : emptyForm,
  )
  const [savedId, setSavedId] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const pick = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const valid = useMemo(
    () =>
      form.title.trim() !== '' &&
      form.category !== '' &&
      form.instructor !== '' &&
      String(form.price).trim() !== '',
    [form],
  )

  const save = () => {
    if (!valid) return
    const newId = editing ? editing.id : nextCourseId()
    const payload = {
      ...(editing ?? {}),
      id: newId,
      title: form.title.trim(),
      category: form.category,
      level: form.level,
      instructor: form.instructor,
      price: Number(form.price) || 0,
      sessions: Number(form.sessions) || 4,
      hours: Number(form.hours) || 6,
      status: form.status,
      description: form.description.trim(),
      cover: form.cover,
      createdAt: editing?.createdAt ?? new Date().toISOString().slice(0, 10),
      enrolled: editing?.enrolled ?? 0,
      capacity: editing?.capacity ?? 100,
      rating: editing?.rating ?? 0,
      lessons: editing?.lessons ?? buildLessons(newId),
    }
    upsertCourse(payload)
    setSavedId(payload.id)
  }

  /* ---------- Not found ---------- */
  if (isEdit && !editing) {
    return (
      <Card className="flex flex-col items-center px-6 py-24 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
          <Icon name="book" size={38} strokeWidth={1.6} />
        </div>
        <h2 className="mt-6 text-2xl font-extrabold text-ink">الدورة غير موجودة</h2>
        <p className="mt-2 max-w-md text-sm text-ink-soft">لم نتمكن من العثور على هذه الدورة، قد تكون محذوفة.</p>
        <Button variant="outline" className="mt-6" icon={<Icon name="chevron-right" size={16} />} onClick={() => navigate('/courses')}>
          العودة لقائمة الدورات
        </Button>
      </Card>
    )
  }

  /* ---------- Success ---------- */
  if (savedId) {
    return (
      <Card className="flex flex-col items-center px-6 py-16 text-center">
        <div className="grid size-24 animate-pop-in place-items-center rounded-full bg-mint text-primary">
          <Icon name="check" size={44} strokeWidth={2.4} />
        </div>
        <h2 className="mt-6 text-2xl font-extrabold text-ink">{isEdit ? 'تم تحديث الدورة بنجاح' : 'تم إنشاء الدورة بنجاح 🎉'}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          الدورة <span className="font-extrabold text-primary">«{form.title}»</span> {isEdit ? 'تم تحديث بياناتها' : 'أصبحت متاحة الآن في نظام المنصة'}.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button onClick={() => navigate(`/courses/${savedId}`)} icon={<Icon name="eye" size={16} />}>
            عرض الدورة
          </Button>
          <Button variant="outline" onClick={() => navigate('/courses')}>العودة للدورات</Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/courses')}
            aria-label="رجوع"
            className="grid size-10 place-items-center rounded-xl border border-line bg-white text-ink-soft transition-colors hover:bg-mint hover:text-primary"
          >
            <Icon name="chevron-right" size={20} />
          </button>
          <div>
            <p className="text-[11px] font-medium text-ink-mute">الدورات</p>
            <h2 className="text-2xl font-extrabold text-ink">{isEdit ? 'تعديل الدورة' : 'إضافة دورة جديدة'}</h2>
          </div>
        </div>
        <Badge tone="mint">{isEdit ? 'وضع التعديل' : 'دورة جديدة'}</Badge>
      </div>

      <Card>
        <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input id="c-title" label="عنوان الدورة *" placeholder="مثال: دورة المهارات الأسرية المتقدمة" value={form.title} onChange={set('title')} />
          </div>
          <Select id="c-category" label="الفئة *" value={form.category} onChange={set('category')}>
            <option value="">اختر الفئة...</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select id="c-instructor" label="المدرب *" value={form.instructor} onChange={set('instructor')}>
            <option value="">اختر المدرب...</option>
            {INSTRUCTORS.map((i) => <option key={i} value={i}>{i}</option>)}
          </Select>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">المستوى</p>
            <PillGroup options={LEVELS} value={form.level} onPick={pick('level')} />
          </div>
          <Input id="c-price" label="السعر (ر.س) *" type="number" min="0" placeholder="0 = مجانية" value={form.price} onChange={set('price')} />
          <Input id="c-sessions" label="عدد الجلسات" type="number" min="1" value={form.sessions} onChange={set('sessions')} />
          <Input id="c-hours" label="المدة الإجمالية (ساعات)" type="number" min="1" value={form.hours} onChange={set('hours')} />
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">الحالة</p>
            <PillGroup options={COURSE_STATUSES} value={form.status} onPick={pick('status')} />
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
            <Button onClick={save} disabled={!valid} icon={<Icon name="check" size={16} strokeWidth={2.4} />}>
              {isEdit ? 'حفظ التعديلات' : 'إنشاء الدورة'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
