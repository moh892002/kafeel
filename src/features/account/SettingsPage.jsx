import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Card, { CardHeader } from '@/components/ui/Card'
import PageState from '@/components/ui/PageState'
import Icon from '@/components/ui/Icon'
import Notice from '@/components/ui/Notice'
import PageHeader from '@/components/ui/PageHeader'
import { Input, Select, Textarea } from '@/components/ui/Input'
import Switch from '@/components/ui/Switch'
import { api } from '@/app/api'

const field = (setter) => (key) => (e) => setter((prev) => ({ ...prev, [key]: e.target.value }))
const toggle = (setter) => (key) => () => setter((prev) => ({ ...prev, [key]: !prev[key] }))

const DEFAULTS = {
  platform: {
    name: 'كفيل',
    description: 'منصة الاستشارات والبرامج التدريبية المتخصصة',
    email: 'support@kafeel.sa',
    phone: '920000000',
  },
  locale: {
    language: 'العربية',
    currency: 'ر.س',
    timezone: '(GMT+3) الرياض',
    weekStart: 'السبت',
  },
  payments: { rate: 15, minPayout: 200, mada: true, visa: true, apple: true },
  prefs: {
    booking: true,
    payment: true,
    review: true,
    specialist: false,
    email: true,
    sms: false,
    push: true,
  },
}

/* Reads one dotted key from the settings map with a default fallback. */
const str = (map, key, fallback) => (map[key] === undefined || map[key] === null ? fallback : map[key])
const bool = (map, key, fallback) => (map[key] === undefined ? fallback : map[key] === 'true')

export default function Settings() {
  const [platform, setPlatform] = useState(DEFAULTS.platform)
  const [locale, setLocale] = useState(DEFAULTS.locale)
  const [payments, setPayments] = useState(DEFAULTS.payments)
  const [prefs, setPrefs] = useState(DEFAULTS.prefs)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  useEffect(() => {
    let cancelled = false
    api.settings()
      .then((map) => {
        if (cancelled) return
        const s = map ?? {}
        setPlatform({
          name: str(s, 'platform.name', DEFAULTS.platform.name),
          description: str(s, 'platform.description', DEFAULTS.platform.description),
          email: str(s, 'platform.email', DEFAULTS.platform.email),
          phone: str(s, 'platform.phone', DEFAULTS.platform.phone),
        })
        setLocale({
          language: str(s, 'locale.language', DEFAULTS.locale.language),
          currency: str(s, 'locale.currency', DEFAULTS.locale.currency),
          timezone: str(s, 'locale.timezone', DEFAULTS.locale.timezone),
          weekStart: str(s, 'locale.weekStart', DEFAULTS.locale.weekStart),
        })
        setPayments({
          rate: str(s, 'payments.rate', DEFAULTS.payments.rate),
          minPayout: str(s, 'payments.minPayout', DEFAULTS.payments.minPayout),
          mada: bool(s, 'payments.mada', DEFAULTS.payments.mada),
          visa: bool(s, 'payments.visa', DEFAULTS.payments.visa),
          apple: bool(s, 'payments.apple', DEFAULTS.payments.apple),
        })
        setPrefs({
          booking: bool(s, 'notifications.booking', DEFAULTS.prefs.booking),
          payment: bool(s, 'notifications.payment', DEFAULTS.prefs.payment),
          review: bool(s, 'notifications.review', DEFAULTS.prefs.review),
          specialist: bool(s, 'notifications.specialist', DEFAULTS.prefs.specialist),
          email: bool(s, 'notifications.email', DEFAULTS.prefs.email),
          sms: bool(s, 'notifications.sms', DEFAULTS.prefs.sms),
          push: bool(s, 'notifications.push', DEFAULTS.prefs.push),
        })
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    setSaving(true)
    const values = {
      ...Object.fromEntries(Object.entries(platform).map(([k, v]) => [`platform.${k}`, String(v)])),
      ...Object.fromEntries(Object.entries(locale).map(([k, v]) => [`locale.${k}`, String(v)])),
      ...Object.fromEntries(Object.entries(payments).map(([k, v]) => [`payments.${k}`, String(v)])),
      ...Object.fromEntries(Object.entries(prefs).map(([k, v]) => [`notifications.${k}`, String(v)])),
    }
    try {
      await api.updateSettings(values)
      setNotice({ text: 'تم حفظ الإعدادات بنجاح ✓', tone: 'success' })
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <PageState
        mode="error"
        title="تعذر تحميل الإعدادات"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (loading) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل الإعدادات..."
      />
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <PageHeader
        title="الإعدادات العامة"
        subtitle="إعدادات المنصة واللغة والإقليم والمدفوعات والإشعارات"
        actions={
          <Button icon={<Icon name="check" size={17} />} onClick={save} disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        }
      />

      {/* Notice */}
      {notice && <Notice text={notice.text} tone={notice.tone} onDismiss={() => setNotice(null)} />}

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
        <Button size="lg" icon={<Icon name="check" size={18} />} onClick={save} disabled={saving}>
          {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  )
}
