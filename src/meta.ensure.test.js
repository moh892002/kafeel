import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./api', () => ({ api: { meta: vi.fn() } }))
import { api } from './api'

describe('ensureMeta singleton', () => {
  beforeEach(() => {
    vi.resetModules() // the module-scope cache must start fresh per test
    api.meta.mockReset()
  })

  const freshEnsureMeta = async () => (await import('./meta')).ensureMeta

  it('fetches once and shares the result across callers', async () => {
    api.meta.mockResolvedValue({ specialistStatus: ['نشط'] })
    const ensureMeta = await freshEnsureMeta()

    const [first, second] = await Promise.all([ensureMeta(), ensureMeta()])
    expect(api.meta).toHaveBeenCalledTimes(1)
    expect(first).toEqual({ specialistStatus: ['نشط'] })
    expect(second).toEqual({ specialistStatus: ['نشط'] })

    // Later callers hit the cache — still one fetch total.
    await ensureMeta()
    expect(api.meta).toHaveBeenCalledTimes(1)
  })

  it('clears the cache on failure so the next caller retries', async () => {
    api.meta.mockRejectedValueOnce(new Error('network down'))
    const ensureMeta = await freshEnsureMeta()

    await expect(ensureMeta()).rejects.toThrow('network down')

    api.meta.mockResolvedValueOnce({ paymentMethod: ['مدى'] })
    await expect(ensureMeta()).resolves.toEqual({ paymentMethod: ['مدى'] })
    expect(api.meta).toHaveBeenCalledTimes(2)
  })
})
