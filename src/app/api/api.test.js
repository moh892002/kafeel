import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Unlike the page tests (which mock the whole api module), this file exercises
// the REAL request()/authHeaders() logic by stubbing the global fetch.
import { api, TOKEN_KEY } from '@/app/api'

/** Stubs the global fetch with a canned Response-shaped object. */
function mockFetch(status, body) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }),
  )
}

/** Resolves a promise to its rejection (or fails the test if it resolved). */
async function rejectionOf(promise) {
  try {
    await promise
  } catch (err) {
    return err
  }
  throw new Error('expected the promise to reject')
}

describe('api.js 401 handling', () => {
  const onUnauthorized = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.addEventListener('kafeel:unauthorized', onUnauthorized)
  })

  afterEach(() => {
    window.removeEventListener('kafeel:unauthorized', onUnauthorized)
    vi.unstubAllGlobals()
  })

  it('removes the token and dispatches kafeel:unauthorized on a protected 401', async () => {
    localStorage.setItem(TOKEN_KEY, 'jwt-valid')
    mockFetch(401, { message: 'انتهت صلاحية الجلسة' })

    const err = await rejectionOf(api.dashboard())

    // The backend's Arabic message rides on the error, tagged with the status.
    expect(err.message).toBe('انتهت صلاحية الجلسة')
    expect(err.status).toBe(401)

    // The expired session is dropped: token cleared + logout event fired.
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('falls back to a generic message on a non-JSON 401 body, still dropping the session', async () => {
    localStorage.setItem(TOKEN_KEY, 'jwt-valid')
    // A gateway may answer a 401 with plain text — res.json() throws, the catch
    // swallows it, and the generic message is used. The session must still drop.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => {
          throw new Error('not json')
        },
      }),
    )

    const err = await rejectionOf(api.dashboard())

    expect(err.message).toBe('طلب فشل (401)')
    expect(err.status).toBe(401)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('does not bounce a wrong-password 401 from /auth/login', async () => {
    localStorage.setItem(TOKEN_KEY, 'jwt-valid')
    mockFetch(401, { message: 'بيانات الدخول غير صحيحة' })

    const err = await rejectionOf(api.login('admin@kafeel.sa', 'wrong-password'))
    expect(err.message).toBe('بيانات الدخول غير صحيحة')
    expect(err.status).toBe(401)

    // A bad login must never clear an existing session or fire the logout event.
    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-valid')
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('returns parsed JSON on success and keeps the session', async () => {
    localStorage.setItem(TOKEN_KEY, 'jwt-valid')
    mockFetch(200, [{ id: 1, name: 'أحمد' }])

    const data = await api.clients()

    expect(data).toEqual([{ id: 1, name: 'أحمد' }])
    // The stored token rides along in the Authorization header.
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/clients',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer jwt-valid' }),
      }),
    )
    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-valid')
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
