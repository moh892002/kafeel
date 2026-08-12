/**
 * Auth state: restores the session on boot from the stored JWT, exposes
 * login/logout/changePassword, and guards protected routes.
 */
import { useCallback, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api, TOKEN_KEY } from '@/app/api'
import { AuthContext, useAuth } from './useAuth'
import Icon from '@/components/ui/Icon'

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [ready, setReady] = useState(false)

  // Restore the session once on boot; also listen for forced logouts (expired JWT).
  useEffect(() => {
    let cancelled = false
    if (!localStorage.getItem(TOKEN_KEY)) {
      setReady(true)
      return undefined
    }
    api
      .me()
      .then((a) => {
        if (!cancelled) setAdmin(a)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    const onUnauthorized = () => setAdmin(null)
    window.addEventListener('kafeel:unauthorized', onUnauthorized)
    return () => {
      cancelled = true
      window.removeEventListener('kafeel:unauthorized', onUnauthorized)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password)
    localStorage.setItem(TOKEN_KEY, res.token)
    setAdmin({ email: res.email, name: res.name })
    return res
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setAdmin(null)
  }, [])

  const changePassword = useCallback((currentPassword, newPassword) => {
    return api.changePassword(currentPassword, newPassword)
  }, [])

  // Updates the real admin identity; on email change the backend re-issues the
  // JWT (the token subject is the email), so store the fresh token + profile.
  const updateProfile = useCallback(async (name, email) => {
    const res = await api.updateProfile(name, email)
    localStorage.setItem(TOKEN_KEY, res.token)
    setAdmin({ email: res.email, name: res.name })
    return res
  }, [])

  return (
    <AuthContext.Provider value={{ admin, ready, login, logout, changePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Redirects unauthenticated visitors to /login while the session check runs. */
export function RequireAuth({ children }) {
  const { admin, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-primary">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Icon name="loader" size={18} className="animate-spin" />
          جاري التحقق من الجلسة...
        </div>
      </div>
    )
  }
  if (!admin) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
