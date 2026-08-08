import { useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import { Input, Textarea } from '../components/ui/Input'
import Switch from '../components/ui/Switch'

const TABS = [
  { key: 'account', label: 'الحساب', icon: 'user' },
  { key: 'security', label: 'الأمان', icon: 'shield' },
  { key: 'prefs', label: 'الإشعارات', icon: 'bell' },
]

const field = (setter) => (key) => (e) => setter((prev) => ({ ...prev, [key]: e.target.value }))
const toggle = (setter) => (key) => () => setter((prev) => ({ ...prev, [key]: !prev[key] }))

export default function Profile() {
  const [tab, setTab] = useState('account')
  const [account, setAccount] = useState({
    name: 'عبدالرحمن السالم',
    email: 'admin@kafeel.sa',
    phone: '0550000000',
    bio: 'مدير منصة كفيل — متابعة العمليات اليومية للمنصة والأخصائيين.',
  })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [passError, setPassError] = useState(null)
  const [twoFa, setTwoFa] = useState(true)
  const [prefs, setPrefs] = useState({ booking: true, payment: true, review: true, email: true, sms: false })
  const [notice, setNotice] = useState(null)
  const [sessions, setSessions] = useState([
    { id: 1, device: 'هذا الجهاز — Chrome على Windows', location: 'الرياض، السعودية', current: true, time: 'الآن' },
    { id: 2, device: 'iPhone 15 Pro — Safari', location: 'جدة، السعودية', current: false, time: 'قبل 3 ساعات' },
    { id: 3, device: 'Samsung Galaxy S24 — Chrome', location: 'الدمام، السعودية', current: false, time: 'قبل يومين' },
  ])

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const setPass = (key) => (e) => {
    setPasswords((p) => ({ ...p, [key]: e.target.value }))
    setPassError(null)
  }

  const changePassword = () => {
    if (!passwords.current) {
      setPassError('يرجى إدخال كلمة المرور الحالية')
      return
    }
    if (passwords.next.length < 8) {
      setPassError('كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف')
      return
    }
    if (passwords.next !== passwords.confirm) {
      setPassError('كلمتا المرور غير متطابقتين')
      return
    }
    setPasswords({ current: '', next: '', confirm: '' })
    setNotice('تم تغيير كلمة المرور بنجاح ✓')
  }

  const terminate = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setNotice('تم إنهاء الجلسة بنجاح ✓')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header + tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">الحساب الشخصي</h2>
          <p className="mt-1 text-sm text-ink-soft">إدارة بيانات حسابك وكلمة المرور وتفضيلات الإشعارات</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-line bg-card p-1.5 shadow-card">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              tab === t.key ? 'bg-primary text-white shadow-[0_4px_12px_rgba(7,94,102,0.35)]' : 'text-ink-soft hover:bg-mint hover:text-primary'
            }`}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
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

      {/* Account tab */}
      {tab === 'account' && (
        <>
          <Card className="overflow-hidden">
            <div className="relative h-24 bg-gradient-to-l from-primary via-primary-soft to-accent-soft">
              <div className="absolute -start-8 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
            </div>
            <div className="relative px-5 pb-5">
              <div className="-mt-11 flex flex-wrap items-end gap-4">
                <Avatar name={account.name} size={88} rounded="rounded-2xl" className="border-4 border-white shadow-pop" />
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-ink">{account.name}</h3>
                    <Badge tone="soft" icon="check">موثق</Badge>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-ink-soft">مدير المنصة</p>
                  <p className="mt-0.5 text-xs text-ink-mute">{account.email}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="البيانات الشخصية" subtitle="البيانات المعروضة في حسابك" />
            <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2">
              <Input label="الاسم الكامل" id="pr-name" value={account.name} onChange={field(setAccount)('name')} />
              <Input label="البريد الإلكتروني" id="pr-email" type="email" value={account.email} onChange={field(setAccount)('email')} />
              <Input label="رقم الجوال" id="pr-phone" value={account.phone} onChange={field(setAccount)('phone')} />
              <div className="sm:col-span-2">
                <Textarea label="نبذة تعريفية" id="pr-bio" rows={3} value={account.bio} onChange={field(setAccount)('bio')} />
              </div>
            </div>
            <div className="flex justify-end border-t border-line px-5 py-3.5">
              <Button icon={<Icon name="check" size={16} />} onClick={() => setNotice('تم حفظ بيانات الحساب بنجاح ✓')}>
                حفظ البيانات
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Security tab */}
      {tab === 'security' && (
        <>
          <Card>
            <CardHeader title="تغيير كلمة المرور" subtitle="استخدم كلمة مرور قوية لا تقل عن 8 أحرف" />
            <div className="space-y-4 px-5 pb-5">
              {passError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 animate-slide-in">
                  <Icon name="x" size={16} strokeWidth={2.4} />
                  {passError}
                </div>
              )}
              <Input label="كلمة المرور الحالية" id="pw-current" type="password" icon="lock" value={passwords.current} onChange={setPass('current')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="كلمة المرور الجديدة" id="pw-new" type="password" icon="key" value={passwords.next} onChange={setPass('next')} />
                <Input label="تأكيد كلمة المرور" id="pw-confirm" type="password" icon="key" value={passwords.confirm} onChange={setPass('confirm')} />
              </div>
            </div>
            <div className="flex justify-end border-t border-line px-5 py-3.5">
              <Button icon={<Icon name="shield" size={16} />} onClick={changePassword}>
                تغيير كلمة المرور
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="المصادقة الثنائية" subtitle="حماية إضافية عند تسجيل الدخول" />
            <div className="border-t border-line">
              <Switch
                checked={twoFa}
                onChange={() => setTwoFa((v) => !v)}
                label="تفعيل المصادقة الثنائية (2FA)"
                description="سنرسل رمز تحقق إلى جوالك عند كل تسجيل دخول"
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="جلسات تسجيل الدخول" subtitle="الأجهزة التي تم تسجيل الدخول منها حالياً" />
            <ul className="divide-y divide-line border-t border-line">
              {sessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-primary">
                      <Icon name={s.device.includes('iPhone') ? 'phone' : 'home'} size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-bold text-ink">
                        <span className="truncate">{s.device}</span>
                        {s.current && <Badge tone="success" compact>الجلسة الحالية</Badge>}
                      </p>
                      <p className="text-xs text-ink-mute">{s.location} · {s.time}</p>
                    </div>
                  </div>
                  {!s.current && (
                    <Button size="sm" variant="ghost" onClick={() => terminate(s.id)}>
                      إنهاء الجلسة
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {/* Preferences tab */}
      {tab === 'prefs' && (
        <Card>
          <CardHeader title="تفضيلات الإشعارات" subtitle="اختر الأحداث التي تريد تلقي إشعارات عنها" />
          <div className="divide-y divide-line border-t border-line">
            {[
              ['booking', 'حجز جلسة جديد', 'عند إنشاء حجز جديد'],
              ['payment', 'عملية دفع', 'عند اكتمال أو استرداد عملية دفع'],
              ['review', 'تقييم جديد', 'عند إضافة تقييم أو تعليق'],
            ].map(([key, label, desc]) => (
              <Switch key={key} checked={prefs[key]} onChange={toggle(setPrefs)(key)} label={label} description={desc} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 border-t border-line px-3 py-3 sm:grid-cols-2">
            {[
              ['email', 'البريد الإلكتروني'],
              ['sms', 'رسائل SMS'],
            ].map(([key, label]) => (
              <Switch key={key} checked={prefs[key]} onChange={toggle(setPrefs)(key)} label={label} />
            ))}
          </div>
          <div className="flex justify-end border-t border-line px-5 py-3.5">
            <Button icon={<Icon name="check" size={16} />} onClick={() => setNotice('تم حفظ التفضيلات بنجاح ✓')}>
              حفظ التفضيلات
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
