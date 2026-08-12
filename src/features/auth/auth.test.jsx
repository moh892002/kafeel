import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

// Mock only the network-touching auth calls; keep the real TOKEN_KEY export so
// session restoration runs under the app's actual storage key.
vi.mock('@/app/api', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, api: { ...actual.api, login: vi.fn(), me: vi.fn(), updateProfile: vi.fn() } }
})

import { api, TOKEN_KEY } from '@/app/api'
import { AuthProvider, RequireAuth } from './auth'
import { useAuth } from './useAuth'
import Login from './LoginPage'

// Exposes the auth context so a test can trigger and inspect updateProfile.
function ContextProbe() {
  const { admin, updateProfile } = useAuth()
  return (
    <div>
      <span data-testid="ctx-admin-name">{admin?.name ?? '(none)'}</span>
      <span data-testid="ctx-admin-email">{admin?.email ?? '(none)'}</span>
      <button onClick={() => updateProfile('الاسم الجديد', 'new@kafeel.sa')}>UPDATE</button>
    </div>
  )
}

const SPECIALISTS_MARKER = 'صفحة المختصين'
const ADMIN = { email: 'admin@kafeel.sa', name: 'المدير' }

// Renders the location.state that RequireAuth attaches to the /login redirect,
// so the test can assert the exact `from` path was carried along.
function FromStateProbe() {
  const location = useLocation()
  return <div data-testid="from-state">{location.state?.from ?? '(none)'}</div>
}

function renderProtected() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/specialists']}>
        <Routes>
          <Route
            path="/specialists"
            element={
              <RequireAuth>
                <div>{SPECIALISTS_MARKER}</div>
              </RequireAuth>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <FromStateProbe />
                <Login />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('AuthProvider.updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem(TOKEN_KEY, 'jwt-old')
    api.me.mockResolvedValue(ADMIN)
  })

  it('stores the re-issued token and refreshes the admin profile in context', async () => {
    api.updateProfile.mockResolvedValue({
      token: 'jwt-new',
      email: 'new@kafeel.sa',
      name: 'الاسم الجديد',
    })
    render(
      <AuthProvider>
        <ContextProbe />
      </AuthProvider>,
    )

    fireEvent.click(await screen.findByText('UPDATE'))

    await waitFor(() => expect(api.updateProfile).toHaveBeenCalledWith('الاسم الجديد', 'new@kafeel.sa'))
    await waitFor(() => expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-new'))
    expect(screen.getByTestId('ctx-admin-name')).toHaveTextContent('الاسم الجديد')
    expect(screen.getByTestId('ctx-admin-email')).toHaveTextContent('new@kafeel.sa')
  })
})

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('redirects an unauthenticated visitor to /login carrying state.from', async () => {
    renderProtected()

    // The login form appears — the guard bounced the visitor (after a brief
    // session-check it has no token, so it navigates to /login).
    expect(await screen.findByRole('heading', { name: 'لوحة تحكم كفيل' })).toBeInTheDocument()

    // The requested path is carried along so Login can return the user to it.
    expect(screen.getByTestId('from-state')).toHaveTextContent('/specialists')
    expect(screen.queryByText(SPECIALISTS_MARKER)).not.toBeInTheDocument()
  })

  it('renders the protected content once a session is restored', async () => {
    localStorage.setItem(TOKEN_KEY, 'jwt-existing')
    api.me.mockResolvedValue(ADMIN)
    renderProtected()

    expect(await screen.findByText(SPECIALISTS_MARKER)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'لوحة تحكم كفيل' })).not.toBeInTheDocument()
  })

  it('shows the session-check while the stored token is being validated', async () => {
    localStorage.setItem(TOKEN_KEY, 'jwt-existing')
    let resolveMe
    api.me.mockReturnValue(
      new Promise((resolve) => {
        resolveMe = resolve
      }),
    )
    renderProtected()

    // Before the /auth/me round trip resolves, the guard shows its loading state
    // instead of the protected content.
    expect(screen.getByText('جاري التحقق من الجلسة...')).toBeInTheDocument()
    expect(screen.queryByText(SPECIALISTS_MARKER)).not.toBeInTheDocument()

    // Resolve inside act so the chained setAdmin/setReady updates settle within
    // the act scope (no "not wrapped in act" warning, no flaky assertions).
    await act(async () => resolveMe(ADMIN))
    expect(await screen.findByText(SPECIALISTS_MARKER)).toBeInTheDocument()
  })

  it('clears an expired JWT and drops the session when the restore fails with 401', async () => {
    // An expired token makes /auth/me reject with 401. AuthProvider's restore
    // effect must then remove the stored token, so the visitor ends up signed
    // out on the login page instead of stuck on a dead session. Note the boot
    // path clears the token on ANY restore failure — the 401 below is the
    // realistic fixture, not a branch the component switches on.
    localStorage.setItem(TOKEN_KEY, 'jwt-expired')
    const expired = new Error('انتهت صلاحية الجلسة')
    expired.status = 401
    api.me.mockRejectedValue(expired)
    renderProtected()

    // The restore round trip ran, the token is gone, and the visitor is sent
    // to the login page.
    expect(api.me).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('heading', { name: 'لوحة تحكم كفيل' })).toBeInTheDocument()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(screen.queryByText(SPECIALISTS_MARKER)).not.toBeInTheDocument()
  })
})
