import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Mock only the network-touching auth calls. Keeping the rest of the module
// real (via importOriginal) preserves the actual TOKEN_KEY export, so the test
// asserts token storage under the exact key the app uses.
vi.mock('@/app/api', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, api: { ...actual.api, login: vi.fn(), me: vi.fn() } }
})

import { api, TOKEN_KEY } from '@/app/api'
import { AuthProvider } from './auth'
import Login from './LoginPage'

const HOME_MARKER = 'لوحة التحكم الرئيسية'

function renderLogin({ from } = {}) {
  // RequireAuth sends visitors to /login with state.from = the page they tried
  // to open; the entry shape below reproduces that exactly.
  const entry = from ? { pathname: '/login', state: { from } } : '/login'
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>{HOME_MARKER}</div>} />
          <Route path="/specialists" element={<div>صفحة المختصين</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the login form with the demo account hint', () => {
    renderLogin()

    expect(screen.getByRole('heading', { name: 'لوحة تحكم كفيل' })).toBeInTheDocument()
    // The email field is pre-filled with the seeded admin account.
    expect(screen.getByLabelText('البريد الإلكتروني')).toHaveValue('admin@kafeel.sa')
    expect(screen.getByLabelText('كلمة المرور')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeInTheDocument()
    expect(screen.getByText(/الحساب التجريبي/)).toBeInTheDocument()
  })

  it('shows the Arabic error on a wrong password and stays on the page', async () => {
    // The exact message the backend throws for bad credentials.
    api.login.mockRejectedValue(new Error('بيانات الدخول غير صحيحة'))
    renderLogin()

    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }))

    expect(await screen.findByText('بيانات الدخول غير صحيحة')).toBeInTheDocument()
    expect(api.login).toHaveBeenCalledWith('admin@kafeel.sa', 'wrong-password')

    // The submit button returns to idle (it showed «جارٍ تسجيل الدخول...» while pending).
    expect(await screen.findByRole('button', { name: 'تسجيل الدخول' })).toBeEnabled()

    // No token persisted, no redirect.
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(screen.queryByText(HOME_MARKER)).not.toBeInTheDocument()
  })

  it('stores the JWT and redirects to the home page on a successful login', async () => {
    api.login.mockResolvedValue({ token: 'jwt-abc-123', email: 'admin@kafeel.sa', name: 'المدير' })
    renderLogin()

    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'kafeel' } })
    fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }))

    // Redirect lands on the home route.
    expect(await screen.findByText(HOME_MARKER)).toBeInTheDocument()
    expect(screen.queryByText('تسجيل الدخول')).not.toBeInTheDocument()

    // The token is persisted under the app's real storage key.
    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-abc-123')
    expect(api.login).toHaveBeenCalledWith('admin@kafeel.sa', 'kafeel')
  })

  it('skips the form entirely when a session is already restored', async () => {
    // A stored JWT makes the boot effect call api.me() and restore admin, so
    // visiting /login must bounce straight to the dashboard without a submit.
    localStorage.setItem(TOKEN_KEY, 'jwt-existing')
    api.me.mockResolvedValue({ email: 'admin@kafeel.sa', name: 'المدير' })
    renderLogin()

    expect(await screen.findByText(HOME_MARKER)).toBeInTheDocument()
    expect(api.login).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'تسجيل الدخول' })).not.toBeInTheDocument()
  })

  it('returns to the originally requested page after login (state.from)', async () => {
    // The RequireAuth guard stores the attempted path in state.from; a
    // successful login must land back there, not on the dashboard.
    api.login.mockResolvedValue({ token: 'jwt-abc-123', email: 'admin@kafeel.sa', name: 'المدير' })
    renderLogin({ from: '/specialists' })

    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'kafeel' } })
    fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }))

    expect(await screen.findByText('صفحة المختصين')).toBeInTheDocument()
    expect(screen.queryByText(HOME_MARKER)).not.toBeInTheDocument()
  })

  it('blocks the submit when the password is empty — no API call', async () => {
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }))

    expect(await screen.findByText('يرجى إدخال البريد الإلكتروني وكلمة المرور')).toBeInTheDocument()
    expect(api.login).not.toHaveBeenCalled()
  })
})
