import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import { Input, Select, Textarea } from '../components/ui/Input'
import { EXPERIENCE_OPTIONS, QUALIFICATION_OPTIONS, SPECIALTY_OPTIONS, TITLE_OPTIONS } from '../data/specialists'
import { options, useMeta } from '../meta'
import { api } from '../api'

const STEPS = [
  { id: 1, title: 'البيانات الشخصية', desc: 'المعلومات الأساسية عن الأخصائي', icon: 'user' },
  { id: 2, title: 'التخصص والمؤهلات', desc: 'الخبرة والشهادات والسيرة الذاتية', icon: 'graduation' },
  { id: 3, title: 'الخدمات والأسعار', desc: 'نوع الجلسات والرسوم والمواعيد', icon: 'wallet' },
  { id: 4, title: 'المستندات والمراجعة', desc: 'رفع المستندات ومراجعة الطلب', icon: 'clipboard' },
]

const GENDER_OPTIONS = ['ذكر', 'أنثى']
const DURATION_OPTIONS = ['30 دقيقة', '45 دقيقة', '60 دقيقة', '90 دقيقة']
const DAY_OPTIONS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

const initialForm = {
  fullName: '', title: 'د.', gender: 'ذكر', phone: '', email: '', birth: '', city: 'الرياض', bio: '',
  specialty: '', years: '', qualification: '', certs: '', cv: '',
  sessionTypes: [], fee: '', duration: '60 دقيقة', workDays: [], startTime: '09:00', endTime: '17:00',
  idDoc: '', license: '', agree: false,
}

/* Required field keys per step — the wizard won't advance until they're filled */
const REQUIRED = [
  ['fullName', 'phone', 'email'],
  ['specialty', 'years', 'qualification'],
  ['sessionTypes', 'fee', 'workDays'],
  ['idDoc', 'license', 'agree'],
]

function FileField({ label, hint, accept, value, onPick }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-line bg-surface px-4 py-3.5 transition-all hover:border-primary/40 hover:bg-mint/40">
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0]?.name ?? '')}
      />
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-primary">
        <Icon name="upload" size={20} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-ink">
          {value || label}
        </span>
        <span className="block truncate text-[11px] text-ink-mute">
          {value ? 'اضغط لتغيير الملف' : hint}
        </span>
      </span>
    </label>
  )
}

function PillGroup({ options, value, onToggle, cols }) {
  return (
    <div className={`flex flex-wrap gap-2 ${cols ?? ''}`}>
      {options.map((o) => {
        const active = value.includes(o)
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
              active
                ? 'border-accent-soft bg-mint text-primary'
                : 'border-line bg-surface text-ink-soft hover:border-primary/30 hover:text-primary'
            }`}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

export default function AddSpecialist() {
  const navigate = useNavigate()
  const meta = useMeta()
  const sessionTypeNames = options(meta, 'sessionType')
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  /* Maps the wizard fields onto the API's SpecialistRequest payload */
  const buildPayload = () => ({
    title: form.title,
    name: form.fullName.trim(),
    specialty: form.specialty,
    fee: Number(form.fee) || 0,
    email: form.email.trim(),
    phone: form.phone.trim(),
    bio: form.bio.trim() || null,
    yearsExperience: form.years,
    qualification: form.qualification,
  })

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await api.createSpecialist(buildPayload())
      setSubmitted(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const pick = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const toggle = (key) => (val) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val],
    }))

  const stepValid = useMemo(() => {
    return REQUIRED[step].every((k) => {
      const v = form[k]
      if (Array.isArray(v)) return v.length > 0
      if (typeof v === 'boolean') return v
      return String(v).trim() !== ''
    })
  }, [step, form])

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  /* ---------- Success screen ---------- */
  if (submitted) {
    return (
      <Card className="flex flex-col items-center px-6 py-16 text-center">
        <div className="grid size-24 animate-pop-in place-items-center rounded-full bg-mint text-primary">
          <Icon name="check" size={44} strokeWidth={2.4} />
        </div>
        <h2 className="mt-6 text-2xl font-extrabold text-ink">تم إرسال الطلب بنجاح 🎉</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          شكراً لك، تم استلام طلب إضافة الأخصائي <span className="font-extrabold text-primary">{form.fullName}</span>.
          سيتم مراجعة المستندات والمؤهلات خلال 24 ساعة عمل، وسيتم إشعارك عند الموافقة.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button onClick={() => navigate('/specialists')}>العودة لإدارة الأخصائيين</Button>
          <Button
            variant="outline"
            onClick={() => {
              setForm(initialForm)
              setStep(0)
              setSubmitted(false)
            }}
          >
            إضافة أخصائي آخر
          </Button>
        </div>
      </Card>
    )
  }

  const current = STEPS[step]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium text-ink-mute">إدارة الأخصائيين</p>
          <h2 className="text-2xl font-extrabold text-ink">إضافة أخصائي جديد</h2>
          <p className="mt-1 text-sm text-ink-soft">أكمل خطوات النموذج لإضافة أخصائي جديد إلى المنصة</p>
        </div>
        <Badge tone="teal" dot>نموذج من 4 خطوات</Badge>
      </div>

      {/* Submit error */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 animate-slide-in">
          <span className="flex items-center gap-2">
            <Icon name="x" size={16} strokeWidth={2.4} />
            {error}
          </span>
          <button
            onClick={() => setError(null)}
            aria-label="إغلاق"
            className="grid size-6 place-items-center rounded-md transition-colors hover:bg-red-100"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Stepper */}
      <Card className="px-5 py-4">
        <ol className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((st, i) => {
            const done = i < step
            const currentStep = i === step
            return (
              <li key={st.id} className="flex flex-1 items-center gap-2.5">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full border-2 text-sm font-extrabold transition-all ${
                    done
                      ? 'border-primary bg-primary text-white'
                      : currentStep
                        ? 'border-primary bg-mint text-primary'
                        : 'border-line bg-surface text-ink-mute'
                  }`}
                >
                  {done ? (
                    <Icon name="check" size={16} strokeWidth={2.6} />
                  ) : currentStep ? (
                    <Icon name={st.icon} size={17} />
                  ) : (
                    st.id
                  )}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className={`block truncate text-sm font-bold ${currentStep ? 'text-primary' : done ? 'text-ink' : 'text-ink-mute'}`}>
                    {st.title}
                  </span>
                  <span className="block truncate text-[11px] text-ink-mute">{st.desc}</span>
                </span>
                {i < STEPS.length - 1 && (
                  <span className={`h-0.5 flex-1 rounded-full ${done ? 'bg-primary' : 'bg-line'}`} />
                )}
              </li>
            )
          })}
        </ol>
      </Card>

      {/* Form body */}
      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
          <div>
            <h3 className="text-base font-extrabold text-ink">{current.title}</h3>
            <p className="mt-0.5 text-xs text-ink-mute">{current.desc}</p>
          </div>
          <Badge tone="mint">الخطوة {step + 1} من {STEPS.length}</Badge>
        </div>

        <div className="px-6 py-6">
          {/* ---------- Step 1: personal ---------- */}
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="sp-fullName" label="الاسم الكامل *" placeholder="مثال: د. خالد السالم" value={form.fullName} onChange={set('fullName')} />
              <Select id="sp-title" label="اللقب" value={form.title} onChange={set('title')}>
                {TITLE_OPTIONS.map((t) => <option key={t} value={t}>{t === 'د.' ? 'دكتور (د.)' : 'أستاذ (أ.)'}</option>)}
              </Select>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-ink">الجنس</p>
                <PillGroup options={GENDER_OPTIONS} value={[form.gender]} onToggle={(v) => setForm((f) => ({ ...f, gender: v }))} />
              </div>
              <Input id="sp-phone" label="رقم الجوال *" type="tel" placeholder="05xxxxxxxx" value={form.phone} onChange={set('phone')} />
              <Input id="sp-email" label="البريد الإلكتروني *" type="email" placeholder="name@kafeel.sa" value={form.email} onChange={set('email')} />
              <Input id="sp-birth" label="تاريخ الميلاد" type="date" value={form.birth} onChange={set('birth')} />
              <Input id="sp-city" label="المدينة" value={form.city} onChange={set('city')} />
              <div className="sm:col-span-2">
                <Textarea id="sp-bio" label="نبذة تعريفية" placeholder="نبذة قصيرة عن الأخصائي وخبراته..." value={form.bio} onChange={set('bio')} />
              </div>
            </div>
          )}

          {/* ---------- Step 2: specialty & qualifications ---------- */}
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="sp-specialty" label="التخصص الرئيسي *" value={form.specialty} onChange={set('specialty')}>
                <option value="">اختر التخصص...</option>
                {SPECIALTY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select id="sp-years" label="سنوات الخبرة *" value={form.years} onChange={set('years')}>
                <option value="">اختر سنوات الخبرة...</option>
                {EXPERIENCE_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
              </Select>
              <Select id="sp-qualification" label="المؤهل العلمي *" value={form.qualification} onChange={set('qualification')}>
                <option value="">اختر المؤهل...</option>
                {QUALIFICATION_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </Select>
              <div className="sm:col-span-2">
                <Textarea id="sp-certs" label="الشهادات والدورات الإضافية" placeholder="اذكر الشهادات والدورات التدريبية إن وجدت..." value={form.certs} onChange={set('certs')} />
              </div>
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-sm font-semibold text-ink">السيرة الذاتية (PDF)</p>
                <FileField label="اضغط لرفع السيرة الذاتية" hint="PDF بحد أقصى 5 ميجابايت" accept=".pdf" value={form.cv} onPick={pick('cv')} />
              </div>
            </div>
          )}

          {/* ---------- Step 3: services & pricing ---------- */}
          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-sm font-semibold text-ink">أنواع الجلسات *</p>
                {meta ? (
                  <PillGroup options={sessionTypeNames} value={form.sessionTypes} onToggle={toggle('sessionTypes')} />
                ) : (
                  <p className="text-xs font-semibold text-ink-mute">جارٍ تحميل أنواع الجلسات...</p>
                )}
              </div>
              <Input id="sp-fee" label="رسوم الجلسة (ر.س) *" type="number" min="0" placeholder="350" value={form.fee} onChange={set('fee')} />
              <Select id="sp-duration" label="مدة الجلسة" value={form.duration} onChange={set('duration')}>
                {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-ink">أيام العمل *</p>
                <PillGroup options={DAY_OPTIONS} value={form.workDays} onToggle={toggle('workDays')} />
              </div>
              <Input id="sp-startTime" label="بداية الدوام" type="time" value={form.startTime} onChange={set('startTime')} />
              <Input id="sp-endTime" label="نهاية الدوام" type="time" value={form.endTime} onChange={set('endTime')} />
            </div>
          )}

          {/* ---------- Step 4: documents & review ---------- */}
          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-sm font-semibold text-ink">إثبات الهوية *</p>
                <FileField label="اضغط لرفع إثبات الهوية" hint="صورة الهوية الوطنية أو الإقامة" accept=".pdf,.jpg,.png" value={form.idDoc} onPick={pick('idDoc')} />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-semibold text-ink">الرخصة المهنية *</p>
                <FileField label="اضغط لرفع الرخصة المهنية" hint="الترخيص من الجهة المختصة" accept=".pdf,.jpg,.png" value={form.license} onPick={pick('license')} />
              </div>

              <div className="rounded-2xl border border-line bg-surface/60 p-4 sm:col-span-2">
                <p className="mb-3 text-sm font-extrabold text-ink">مراجعة البيانات</p>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-3">
                  <div><dt className="text-xs text-ink-mute">الاسم</dt><dd className="font-bold text-ink">{form.title} {form.fullName || '—'}</dd></div>
                  <div><dt className="text-xs text-ink-mute">الجنس</dt><dd className="font-bold text-ink">{form.gender}</dd></div>
                  <div><dt className="text-xs text-ink-mute">التخصص</dt><dd className="font-bold text-ink">{form.specialty || '—'}</dd></div>
                  <div><dt className="text-xs text-ink-mute">الخبرة</dt><dd className="font-bold text-ink">{form.years || '—'}</dd></div>
                  <div><dt className="text-xs text-ink-mute">رسوم الجلسة</dt><dd className="font-bold text-ink">{form.fee ? `${form.fee} ر.س` : '—'}</dd></div>
                  <div><dt className="text-xs text-ink-mute">أيام العمل</dt><dd className="font-bold text-ink">{form.workDays.length ? form.workDays.join('، ') : '—'}</dd></div>
                </dl>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={set('agree')}
                  className="size-4 accent-primary"
                />
                أقر بأن جميع البيانات والمستندات المقدمة صحيحة، وأوافق على شروط المنصة *
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface/50 px-6 py-4">
          <p className="text-xs text-ink-mute">الحقول المميزة بـ <span className="font-extrabold text-primary">*</span> مطلوبة</p>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" onClick={back} disabled={step === 0} icon={<Icon name="chevron-right" size={16} />}>
              السابق
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={!stepValid} icon={<Icon name="chevron-left" size={16} />}>
                متابعة
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={!stepValid || submitting}
                icon={
                  submitting ? (
                    <Icon name="loader" size={16} className="animate-spin" />
                  ) : (
                    <Icon name="send" size={16} />
                  )
                }
              >
                {submitting ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
