import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import { Input } from '../components/ui/Input'
import { useAuth } from '../useAuth'

export default function Login() {
  const { admin, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('admin@kafeel.sa')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in — skip the login screen. While a login is in flight this
  // early return stays dormant (submitting is only reset in the error path), so
  // the submit handler's navigate() below can send the user to the page they
  // originally requested (location.state.from) instead of always the dashboard.
  if (admin && !submitting) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!email.trim() || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await login(email.trim(), password)
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary-soft to-accent-soft px-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -start-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -end-24 size-[28rem] rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute end-1/3 top-1/4 size-40 rounded-full bg-white/5 blur-2xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-white/15 text-white backdrop-blur">
            <Icon name="shield" size={34} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold text-white">لوحة تحكم كفيل</h1>
            <p className="mt-1 text-sm font-semibold text-white/70">سجّل الدخول لإدارة المنصة</p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-3xl border border-white/20 bg-white p-7 shadow-[0_24px_60px_rgba(4,66,74,0.35)]"
        >
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 animate-slide-in">
              <Icon name="x" size={16} strokeWidth={2.4} />
              {error}
            </div>
          )}
          <Input
            label="البريد الإلكتروني"
            id="login-email"
            type="email"
            icon="user"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@kafeel.sa"
          />
          <Input
            label="كلمة المرور"
            id="login-password"
            type="password"
            icon="lock"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
            icon={
              submitting ? <Icon name="loader" size={17} className="animate-spin" /> : <Icon name="user-check" size={17} />
            }
          >
            {submitting ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>
          <div className="rounded-xl border border-accent-soft/30 bg-mint px-4 py-3 text-xs leading-relaxed text-ink-soft">
            الحساب التجريبي: <span className="font-bold text-primary" dir="ltr">admin@kafeel.sa</span> — كلمة المرور:{' '}
            <span className="font-bold text-primary">kafeel</span>
          </div>
        </form>
      </div>
    </div>
  )
}
