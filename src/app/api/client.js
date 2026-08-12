/**
 * Thin fetch client for the Kafeel backend (proxied via vite: /api → :8080).
 * Shared by every feature's api slice (the files under src/features/.../services).
 */

const BASE = '/api'

export const TOKEN_KEY = 'kafeel.token'

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : undefined),
      ...authHeaders(),
    },
    ...options,
  })
  if (!res.ok) {
    let detail = `طلب فشل (${res.status})`
    try {
      const body = await res.json()
      if (body?.message) detail = body.message
    } catch {
      /* non-JSON error body */
    }
    // Attach the HTTP status so callers can branch on 404 etc. — the backend's
    // Arabic messages never contain the code, so string-matching them won't work.
    const err = new Error(detail)
    err.status = res.status
    // Expired/invalid session: drop the token and let the auth provider redirect
    // to the login page (login itself excluded — a wrong password must not bounce).
    if (res.status === 401 && !path.startsWith('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('kafeel:unauthorized'))
    }
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

export function buildQuery(params) {
  const q = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v)
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}
