import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import useAsync from './useAsync'

const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useAsync', () => {
  it('goes loading → data', async () => {
    const d = deferred()
    const fn = vi.fn(() => d.promise)
    const { result } = await renderHook(() => useAsync(fn, []))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    await act(async () => d.resolve([1, 2]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([1, 2])
    expect(result.current.error).toBeNull()
  })

  it('surfaces the error message and reload() retries', async () => {
    const d = deferred()
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('تعذر التحميل'))
      .mockResolvedValueOnce(['ok'])
    const { result } = await renderHook(() => useAsync(fn, []))

    // First fetch rejects → error surfaces
    await act(async () => {
      d.reject(new Error('تعذر التحميل'))
    })
    await waitFor(() => expect(result.current.error).toBe('تعذر التحميل'))
    expect(result.current.loading).toBe(false)

    // reload() refetches and succeeds
    await act(async () => result.current.reload())
    await waitFor(() => expect(result.current.error).toBeNull())
    expect(result.current.data).toEqual(['ok'])
  })

  it('keeps initialData until the fetch resolves', async () => {
    const d = deferred()
    const { result } = await renderHook(() => useAsync(() => d.promise, [], []))

    // Pages that render `data.length` before loading completes rely on initialData
    expect(result.current.data).toEqual([])

    await act(async () => d.resolve([3]))
    await waitFor(() => expect(result.current.data).toEqual([3]))
  })
})
