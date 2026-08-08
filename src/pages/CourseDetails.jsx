import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { findCourse, removeCourse, buildEnrollments, buildLessons } from '../data/courses'
import { SPECIALISTS } from '../data/specialists'
import { fmtDate, num } from '../utils/format'

const STATUS_TONE = { منشورة: 'success', مسودة: 'neutral' }
const LEVEL_TONE = { مبتدئ: 'success', متوسط: 'warning', متقدم: 'danger' }
const ENROLL_TONE = { 'مكتمل الدفع': 'success', 'بانتظار الدفع': 'warning', مسترد: 'danger' }

export default function CourseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const course = useMemo(() => findCourse(id), [id])
  // Hooks must run unconditionally — guard the null case inside them
  const lessons = useMemo(() => (course ? course.lessons ?? buildLessons(course.id) : []), [course])
  const enrollments = useMemo(() => (course ? buildEnrollments(course.id) : []), [course])

  if (!course) {
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

  const instructor = SPECIALISTS.find((s) => `${s.title} ${s.name}` === course.instructor)

  const stats = [
    { label: 'المسجلون', value: num(course.enrolled), icon: 'users' },
    { label: 'السعة', value: num(course.capacity), icon: 'target' },
    { label: 'الجلسات', value: num(course.sessions), icon: 'clipboard' },
    { label: 'المدة', value: `${num(course.hours)} ساعة`, icon: 'clock' },
  ]

  const totalMinutes = lessons.reduce((a, l) => a + l.minutes, 0)

  return (
    <div className="space-y-6">
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
              {course.price === 0 ? (
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
            <Avatar name={instructor ? `${instructor.title} ${instructor.name}` : course.instructor} size={52} />
            <div className="min-w-0">
              <p className="truncate font-extrabold text-ink">{course.instructor}</p>
              <p className="truncate text-xs text-ink-mute">{instructor?.specialty ?? 'مدرب معتمد على المنصة'}</p>
            </div>
          </div>
          {instructor && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4">
              <Badge tone="soft" icon="check">موثق</Badge>
              <Badge tone="mint">{num(instructor.sessions)} جلسة</Badge>
              <Badge tone="mint">
                <Icon name="star" size={12} className="text-amber-400" /> {instructor.rating.toFixed(1)}
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
          />
          <ol className="space-y-1 px-3 pb-5">
            {lessons.map((l) => (
              <li
                key={l.n}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-mint/40"
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
              </li>
            ))}
          </ol>
        </Card>

        {/* Recent enrollments */}
        <Card>
          <CardHeader title="آخر المسجلين" subtitle="أحدث عمليات التسجيل في الدورة" />
          <ul className="space-y-1 px-3 pb-5">
            {enrollments.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-mint/40">
                <Avatar name={e.client} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{e.client}</p>
                  <p className="truncate text-xs text-ink-mute">
                    {fmtDate(e.date)} · {e.method}
                  </p>
                </div>
                <Badge tone={ENROLL_TONE[e.status]} className="shrink-0">{e.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Delete confirm */}
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
              onClick={() => {
                removeCourse(course.id)
                navigate('/courses')
              }}
            >
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
            هل أنت متأكد من حذف الدورة <span className="font-extrabold text-ink">«{course.title}»</span>؟
            سيتم حذف جميع بياناتها وبيانات المسجلين فيها نهائياً.
          </p>
        </div>
      </Modal>
    </div>
  )
}
