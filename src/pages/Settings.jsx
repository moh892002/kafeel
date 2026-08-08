import { useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import Icon from '../components/ui/Icon'
import { Input, Select, Textarea } from '../components/ui/Input'
import Switch from '../components/ui/Switch'

const field = (setter) => (key) => (e) => setter((prev) => ({ ...prev, [key]: e.target.value }))
const toggle = (setter) => (key) => () => setter((prev) => ({ ...prev, [key]: !prev[key] }))

export default function Settings() {
  const [platform, setPlatform] = useState({
    name: 'كفيل',
    description: 'منصة الاستشارات والبرامج التدريبية المتخصصة',
    email: 'support@kafeel.sa',
    phone: '920000000',
  })
  const [locale, setLocale] = useState({
    language: 'العربية',
    currency: 'ر.س',
    timezone: '(GMT+3) الرياض',
    weekStart: 'السبت',
  })
  const [payments, setPayments] = useState({ rate: 15, minPayout: 200, mada: true, visa: true, apple: true })
  const [prefs, setPrefs] = useState({
    booking: true,
    payment: true,
    review: true,
    specialist: false,
    email: true,
    sms: false,
    push: true,
  })
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const save = () => setNotice('تم حفظ الإعدادات بنجاح ✓')

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">الإعدادات العامة</h2>
          <p className="mt-1 text-sm text-ink-soft">إعدادات المنصة واللغة والإقليم والمدفوعات والإشعارات</p>
        </div>
        <Button icon={<Icon name="check" size={17} />} onClick={save}>
          حفظ الإعدادات
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

      {/* Platform info */}
      <Card>
        <CardHeader title="معلومات المنصة" subtitle="البيانات الأساسية التي تظهر في صفحات المنصة" />
        <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
          <Input label="اسم المنصة" id="st-name" value={platform.name} onChange={field(setPlatform)('name')} />
          <Input label="بريد الدعم" id="st-email" type="email" value={platform.email} onChange={field(setPlatform)('email')} />
          <Input label="هاتف الدعم" id="st-phone" value={platform.phone} onChange={field(setPlatform)('phone')} />
          <div className="sm:col-span-2">
            <Textarea label="وصف المنصة" id="st-desc" rows={3} value={platform.description} onChange={field(setPlatform)('description')} />
          </div>
        </div>
      </Card>

      {/* Locale */}
      <Card>
        <CardHeader title="اللغة والإقليم" subtitle="اللغة والعملة والمنطقة الزمنية للمنصة" />
        <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
          <Select label="لغة الواجهة" id="st-lang" icon="globe" value={locale.language} onChange={field(setLocale)('language')}>
            <option value="العربية">العربية</option>
            <option value="English">English</option>
          </Select>
          <Select label="العملة" id="st-currency" icon="wallet" value={locale.currency} onChange={field(setLocale)('currency')}>
            <option value="ر.س">ريال سعودي (ر.س)</option>
            <option value="د.إ">درهم إماراتي (د.إ)</option>
            <option value="ر.ق">ريال قطري (ر.ق)</option>
          </Select>
          <Select label="المنطقة الزمنية" id="st-tz" icon="clock" value={locale.timezone} onChange={field(setLocale)('timezone')}>
            <option value="(GMT+3) الرياض">(GMT+3) الرياض</option>
            <option value="(GMT+4) دبي">(GMT+4) دبي</option>
            <option value="(GMT+3) الدوحة">(GMT+3) الدوحة</option>
          </Select>
          <Select label="بداية الأسبوع" id="st-week" icon="calendar" value={locale.weekStart} onChange={field(setLocale)('weekStart')}>
            <option value="السبت">السبت</option>
            <option value="الأحد">الأحد</option>
          </Select>
        </div>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader title="إعدادات الدفع" subtitle="عمولة المنصة وحد السحب ووسائل الدفع المتاحة" />
        <div className="grid grid-cols-1 gap-4 px-5 pb-2 sm:grid-cols-2">
          <Input label="عمولة المنصة (%)" id="st-rate" type="number" min="0" max="100" value={payments.rate} onChange={field(setPayments)('rate')} />
          <Input label="الحد الأدنى للسحب (ر.س)" id="st-payout" type="number" min="0" value={payments.minPayout} onChange={field(setPayments)('minPayout')} />
        </div>
        <div className="mt-2 divide-y divide-line border-t border-line">
          {[
            ['mada', 'مدى', 'بطاقات مدى المحلية'],
            ['visa', 'فيزا', 'بطاقات الائتمان والخصم الدولية'],
            ['apple', 'Apple Pay', 'المدفوعات عبر أجهزة آبل'],
          ].map(([key, label, desc]) => (
            <Switch key={key} checked={payments[key]} onChange={toggle(setPayments)(key)} label={label} description={desc} />
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader title="تفضيلات الإشعارات" subtitle="أي الأحداث تُرسل الإشعارات وبأي قناة" />
        <div className="divide-y divide-line border-t border-line">
          {[
            ['booking', 'حجز جلسة جديد', 'عند إنشاء حجز جديد على المنصة'],
            ['payment', 'عملية دفع', 'عند اكتمال أو استرداد عملية دفع'],
            ['review', 'تقييم جديد', 'عند إضافة تقييم أو تعليق'],
            ['specialist', 'طلبات الأخصائيين', 'عند تقديم أخصائي جديد بطلب الانضمام'],
          ].map(([key, label, desc]) => (
            <Switch key={key} checked={prefs[key]} onChange={toggle(setPrefs)(key)} label={label} description={desc} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 border-t border-line px-3 py-3 sm:grid-cols-3">
          {[
            ['email', 'البريد الإلكتروني'],
            ['sms', 'رسائل SMS'],
            ['push', 'إشعارات المتصفح'],
          ].map(([key, label]) => (
            <Switch key={key} checked={prefs[key]} onChange={toggle(setPrefs)(key)} label={label} />
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" icon={<Icon name="check" size={18} />} onClick={save}>
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  )
}
