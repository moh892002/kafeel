import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { api } from '../api'
import { options, useMeta } from '../meta'
import { fmtDate, num } from '../utils/format'

const STATUS_TONE = { منشورة: 'success', مسودة: 'neutral' }
const LEVEL_TONE = { مبتدئ: 'success', متوسط: 'warning', متقدم: 'danger' }
const ENROLL_SELECT_TONE = {
  'مكتمل الدفع': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'بانتظار الدفع': 'border-amber-200 bg-amber-50 text-amber-700',
  مسترد: 'border-red-200 bg-red-50 text-red-600',
}

/* ---------- Add / edit lesson modal ---------- */
function LessonModal({ lesson, courseId, onClose, onSaved }) {
  const editing = Boolean(lesson)
  const [form, setForm] = useState({
    title: lesson?.title ?? '',
    minutes: lesson?.minutes ?? 30,
    preview: lesson?.preview ?? false,
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.title.trim()) {
      setError('يرجى إدخال عنوان الدرس')
      return
    }
    setSubmitting(true)
    try {
      const payload = { title: form.title.trim(), minutes: Number(form.minutes) || 0, preview: form.preview }
      if (editing) {
        await api.updateLesson(courseId, lesson.id, payload)
      } else {
        await api.addLesson(courseId, payload)
      }
      onSaved()
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'تعديل الدرس' : 'إضافة درس'}
      subtitle={editing ? 'قم بتحديث بيانات هذا الدرس' : 'أضف درساً جديداً إلى محتويات الدورة'}
      size="sm"
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
            {submitting ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الدرس'}
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
        <Input id="ls-title" label="عنوان الدرس *" value={form.title} onChange={set('title')} placeholder="مثال: مقدمة في العلاج المعرفي السلوكي" />
        <div className="grid grid-cols-2 gap-4">
          <Input id="ls-minutes" label="المدة (بالدقائق)" type="number" min="0" value={form.minutes} onChange={set('minutes')} />
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink">
              <input type="checkbox" checked={form.preview} onChange={set('preview')} className="size-4 accent-primary" />
              درس معاينة مجانية
            </label>
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Enroll client modal ---------- */
function EnrollModal({ course, onClose, onSaved }) {
  const meta = useMeta()
  const methods = options(meta, 'paymentMethod')
  const [form, setForm] = useState({ clientName: '', method: methods[0] ?? 'مدى', date: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // capacity 0 means unlimited seats — never show a (misleading) seat count then.
  const unlimited = Number(course.capacity) <= 0
  const seats = unlimited ? null : Math.max(0, course.capacity - course.enrolled)

  const save = async () => {
    if (!form.clientName.trim()) {
      setError('يرجى إدخال اسم العميل')
      return
    }
    if (!unlimited && seats === 0) {
      setError('الدورة ممتلئة، تعذر تسجيل مشارك إضافي')
      return
    }
    setSubmitting(true)
    try {
      await api.enrollCourse(course.id, {
        clientName: form.clientName.trim(),
        method: form.method,
        date: form.date || null,
      })
      onSaved()
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="تسجيل عميل في الدورة"
      subtitle={`«${course.title}» — ${unlimited ? 'مقاعد غير محدودة' : `${seats} مقعد متبقي`}`}
      size="sm"
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
          id="en-name"
          label="اسم العميل *"
          placeholder="مثال: أحمد الشمري"
          value={form.clientName}
          onChange={(e) => {
            setForm((f) => ({ ...f, clientName: e.target.value }))
            setError(null)
          }}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select id="en-method" label="وسيلة الدفع" icon="wallet" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Input id="en-date" label="تاريخ التسجيل" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </div>
      </div>
    </Modal>
  )
}

export default function CourseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [notice, setNotice] = useState(null) // { text, tone: 'success' | 'error' }
  const [refresh, setRefresh] = useState(0)
  const [lessonModal, setLessonModal] = useState(null) // null | {} (add) | { lesson }
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrollBusy, setEnrollBusy] = useState(null) // enrollment id being patched
  const [deleteTarget, setDeleteTarget] = useState(null) // { kind: 'lesson'|'enrollment', item }
  const [removing, setRemoving] = useState(false)
  const meta = useMeta()

  useEffect(() => {
    if (!deleteError) return undefined
    const t = setTimeout(() => setDeleteError(null), 4000)
    return () => clearTimeout(t)
  }, [deleteError])

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  useEffect(() => {
    let cancelled = false
    // Only the first load (or a navigation to another course) shows the spinner;
    // post-mutation refreshes are silent.
    if (!course) {
      setLoading(true)
      setError(null)
      setNotFound(false)
    }
    api.course(id)
      .then((d) => {
        if (cancelled) return
        setCourse({ ...d, rating: Number(d.rating ?? 0) })
        setError(null)
      })
      .catch((e) => {
        if (cancelled) return
        setNotFound(e.status === 404)
        setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refresh])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Icon name="loader" size={18} className="animate-spin" />
          جاري تحميل تفاصيل الدورة...
        </div>
      </div>
    )
  }

  // Order matters: `notFound` is only true for 404s — any other fetch failure must
  // show the error card, not the "not found" one (course stays null on both).
  if (notFound) {
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

  if (error && !course) {
    return (
      <Card className="flex flex-col items-center px-6 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-red-50 text-red-500">
          <Icon name="x" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">تعذر تحميل الدورة</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{error}</p>
        <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </Card>
    )
  }

  const instructor = course.instructor
  const instructorName = instructor ? `${instructor.title} ${instructor.name}` : '—'
  const lessons = course.lessons ?? []
  const enrollments = course.enrollments ?? []

  const stats = [
    { label: 'المسجلون', value: num(course.enrolled), icon: 'users' },
    { label: 'السعة', value: num(course.capacity), icon: 'target' },
    { label: 'الجلسات', value: num(course.sessions), icon: 'clipboard' },
    { label: 'المدة', value: `${num(course.hours)} ساعة`, icon: 'clock' },
  ]

  const totalMinutes = lessons.reduce((a, l) => a + l.minutes, 0)

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.deleteCourse(course.id)
      navigate('/courses')
    } catch (e) {
      setDeleteError(e.message)
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  const changeEnrollStatus = async (enrollment, next) => {
    if (next === enrollment.status) return
    setEnrollBusy(enrollment.id)
    try {
      await api.updateCourseEnrollmentStatus(course.id, enrollment.id, next)
      setNotice({ text: `تم تحديث حالة تسجيل «${enrollment.clientName}» إلى «${next}» ✓`, tone: 'success' })
      setRefresh((r) => r + 1)
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setEnrollBusy(null)
    }
  }

  const confirmDeleteTarget = async () => {
    if (!deleteTarget) return
    setRemoving(true)
    try {
      if (deleteTarget.kind === 'lesson') {
        await api.deleteLesson(course.id, deleteTarget.item.id)
        setNotice({ text: 'تم حذف الدرس بنجاح ✓', tone: 'success' })
      } else {
        await api.deleteCourseEnrollment(course.id, deleteTarget.item.id)
        setNotice({ text: `تم حذف تسجيل «${deleteTarget.item.clientName}» وإخلاء مقعده ✓`, tone: 'success' })
      }
      setDeleteTarget(null)
      setRefresh((r) => r + 1)
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setRemoving(false)
    }
  }

  // Enrollment status labels come from /api/meta; the current value is always
  // offered so the select stays valid even before meta finishes loading.
  const enrollStatusOptions = options(meta, 'enrollmentStatus')
  const statusesFor = (current) =>
    enrollStatusOptions.includes(current) ? enrollStatusOptions : [current, ...enrollStatusOptions]

  return (
    <div className="space-y-6">
      {/* Delete error notice */}
      {deleteError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 animate-slide-in">
          <Icon name="x" size={16} strokeWidth={2.4} />
          {deleteError}
        </div>
      )}

      {/* Action notice */}
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

      {/* Breadcrumb */}
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
            <h2 className="text-2xl font-extrabold text-ink">تفاصيل الدورة</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" icon={<Icon name="edit" size={17} />} onClick={() => navigate(`/courses/${course.id}/edit`)}>
            تعديل الدورة
          </Button>
          <Button variant="danger" icon={<Icon name="trash" size={17} />} onClick={() => setConfirmOpen(true)}>
            حذف
          </Button>
        </div>
      </div>

      {/* Banner */}
      <Card className="overflow-hidden">
        <div className="relative h-40" style={{ background: `linear-gradient(120deg, ${course.cover}, ${course.cover}99)` }}>
          <div className="absolute -start-10 -top-12 size-52 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 end-16 size-56 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute inset-0 grid place-items-center">
            <Icon name="book" size={64} strokeWidth={1.4} className="text-white/85" />
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONE[course.status]} dot>{course.status}</Badge>
                <Badge tone="soft">{course.category}</Badge>
                <Badge tone={LEVEL_TONE[course.level]}>{course.level}</Badge>
              </div>
              <h3 className="mt-3 text-2xl font-extrabold text-ink">{course.title}</h3>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="star" size={15} className="text-amber-400" />
                  <span className="font-extrabold text-ink">{course.rating.toFixed(1)}</span>
                  تقييم
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="users" size={15} className="text-primary" />
                  {num(course.enrolled)} مسجل
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" size={15} className="text-primary" />
                  {Math.round(totalMinutes / 60)} ساعة
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar" size={15} className="text-primary" />
                  أُنشئت في {fmtDate(course.createdAt)}
                </span>
              </p>
            </div>
            <div className="text-end">
              {Number(course.price) === 0 ? (
                <span className="text-2xl font-extrabold text-primary">مجانية</span>
              ) : (
                <p className="text-3xl font-extrabold text-ink">
                  {num(course.price)} <span className="text-sm font-bold text-ink-mute">ر.س</span>
                </p>
              )}
              <Badge tone="mint" className="mt-2">شهادة إتمام معتمدة</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint text-primary">
              <Icon name={s.icon} size={20} />
            </span>
            <div>
              <p className="text-xl font-extrabold text-ink">{s.value}</p>
              <p className="text-xs font-semibold text-ink-mute">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Description */}
        <Card className="xl:col-span-2">
          <CardHeader title="عن الدورة" subtitle="الوصف العام والمحتوى التدريبي" />
          <div className="px-5 pb-6">
            <p className="text-sm leading-7 text-ink-soft">{course.description}</p>
            <p className="mt-4 text-sm leading-7 text-ink-soft">
              تتضمن الدورة {num(course.sessions)} جلسات تدريبية موزعة على {num(course.hours)} ساعات،
              مع تمارين تطبيقية ودراسات حالة ومتابعة مستمرة من المدرب، وفي نهايتها يحصل المتدرب على شهادة إتمام معتمدة من المنصة.
            </p>
          </div>
        </Card>

        {/* Instructor */}
        <Card>
          <CardHeader title="المدرب" subtitle="مقدم الدورة" />
          <div className="flex items-center gap-3 px-5 pb-5">
            <Avatar name={instructorName} size={52} />
            <div className="min-w-0">
              <p className="truncate font-extrabold text-ink">{instructorName}</p>
              <p className="truncate text-xs text-ink-mute">{instructor?.specialty ?? 'مدرب معتمد على المنصة'}</p>
            </div>
          </div>
          {instructor && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4">
              <Badge tone="soft" icon="check">موثق</Badge>
              <Badge tone="mint">{num(instructor.sessions)} جلسة</Badge>
              <Badge tone="mint">
                <Icon name="star" size={12} className="text-amber-400" /> {Number(instructor.rating).toFixed(1)}
              </Badge>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Curriculum */}
        <Card>
          <CardHeader
            title="محتويات الدورة"
            subtitle={`${lessons.length} دروس · ${Math.round(totalMinutes / 60)} ساعة إجمالاً`}
            actions={
              <Button
                size="sm"
                variant="soft"
                icon={<Icon name="plus" size={15} strokeWidth={2.4} />}
                onClick={() => setLessonModal({})}
              >
                إضافة درس
              </Button>
            }
          />
          {lessons.length === 0 ? (
            <div className="flex flex-col items-center px-6 pb-6 pt-2 text-center">
              <Icon name="book" size={26} className="text-ink-mute" />
              <p className="mt-2 text-sm font-semibold text-ink-mute">لا توجد دروس مضافة بعد — أضف أول درس.</p>
            </div>
          ) : (
            <ol className="space-y-1 px-3 pb-5">
              {lessons.map((l) => (
                <li
                  key={l.id}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-mint/40"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-mint text-xs font-extrabold text-primary">
                    {l.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{l.title}</p>
                    <p className="text-xs text-ink-mute">{l.minutes} دقيقة</p>
                  </div>
                  {l.preview ? (
                    <Badge tone="soft" compact>معاينة</Badge>
                  ) : (
                    <Icon name="lock" size={15} className="text-ink-mute" />
                  )}
                  <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <button
                      title="تعديل الدرس"
                      aria-label="تعديل الدرس"
                      onClick={() => setLessonModal({ lesson: l })}
                      className="grid size-7 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                    >
                      <Icon name="edit" size={15} />
                    </button>
                    <button
                      title="حذف الدرس"
                      aria-label="حذف الدرس"
                      onClick={() => setDeleteTarget({ kind: 'lesson', item: l })}
                      className="grid size-7 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Enrollments */}
        <Card>
          <CardHeader
            title="المسجلون في الدورة"
            subtitle={`${enrollments.length} تسجيل · ${num(course.enrolled)} من ${num(course.capacity)} مقعد`}
            actions={
              <Button
                size="sm"
                variant="soft"
                icon={<Icon name="user" size={15} />}
                onClick={() => setEnrollOpen(true)}
              >
                تسجيل عميل
              </Button>
            }
          />
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center px-6 pb-6 pt-2 text-center">
              <Icon name="users" size={26} className="text-ink-mute" />
              <p className="mt-2 text-sm font-semibold text-ink-mute">لا توجد تسجيلات بعد — سجّل أول عميل.</p>
            </div>
          ) : (
            <ul className="space-y-1 px-3 pb-5">
              {enrollments.map((e) => (
                <li key={e.id} className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-mint/40">
                  <Avatar name={e.clientName} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{e.clientName}</p>
                    <p className="truncate text-xs text-ink-mute">
                      {fmtDate(e.date)} · {e.method}
                    </p>
                  </div>
                  <select
                    value={e.status}
                    disabled={enrollBusy === e.id}
                    onChange={(ev) => changeEnrollStatus(e, ev.target.value)}
                    aria-label={`حالة تسجيل ${e.clientName}`}
                    className={`shrink-0 cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-extrabold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-wait disabled:opacity-60 ${
                      ENROLL_SELECT_TONE[e.status] ?? 'border-line bg-surface text-ink-soft'
                    }`}
                  >
                    {statusesFor(e.status).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    title="حذف التسجيل"
                    aria-label="حذف التسجيل"
                    onClick={() => setDeleteTarget({ kind: 'enrollment', item: e })}
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-mute opacity-60 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Lesson add / edit */}
      {lessonModal && (
        <LessonModal
          lesson={lessonModal.lesson}
          courseId={course.id}
          onClose={() => setLessonModal(null)}
          onSaved={() => {
            setLessonModal(null)
            setNotice({
              text: lessonModal.lesson ? 'تم تحديث الدرس بنجاح ✓' : 'تمت إضافة الدرس بنجاح ✓',
              tone: 'success',
            })
            setRefresh((r) => r + 1)
          }}
        />
      )}

      {/* Enroll client */}
      {enrollOpen && (
        <EnrollModal
          course={course}
          onClose={() => setEnrollOpen(false)}
          onSaved={() => {
            setEnrollOpen(false)
            setNotice({ text: 'تم تسجيل العميل في الدورة بنجاح ✓', tone: 'success' })
            setRefresh((r) => r + 1)
          }}
        />
      )}

      {/* Lesson / enrollment delete confirm */}
      <Modal
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title="تأكيد الحذف"
        subtitle="لا يمكن التراجع عن هذا الإجراء"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={removing}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteTarget}
              disabled={removing}
              icon={removing ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="trash" size={16} />}
            >
              {removing ? 'جارٍ الحذف...' : 'حذف'}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
            <Icon name="trash" size={20} />
          </span>
          <p className="text-sm leading-relaxed text-ink-soft">
            {deleteTarget?.kind === 'lesson' ? (
              <>
                سيتم حذف الدرس <span className="font-extrabold text-ink">«{deleteTarget.item.title}»</span> من محتويات
                الدورة نهائياً.
              </>
            ) : (
              <>
                سيتم حذف تسجيل <span className="font-extrabold text-ink">«{deleteTarget?.item?.clientName}»</span> وإخلاء
                مقعده في الدورة.
              </>
            )}
          </p>
        </div>
      </Modal>

      {/* Delete course confirm */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="حذف الدورة"
        subtitle="لا يمكن التراجع عن هذا الإجراء"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>إلغاء</Button>
            <Button
              variant="danger"
              icon={<Icon name="trash" size={16} />}
              onClick={confirmDelete}
              disabled={deleting}
            >
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
            هل أنت متأكد من حذف الدورة <span className="font-extrabold text-ink">«{course.title}»</span>؟
            سيتم حذف جميع بياناتها وبيانات المسجلين فيها نهائياً.
          </p>
        </div>
      </Modal>
    </div>
  )
}
