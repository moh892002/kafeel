import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Shared data-fetching hook — replaces the `useState ×3 + useEffect + cancelled
 * flag + reload` boilerplate every page repeats:
 *
 *     const { data, loading, error, reload } = useAsync(
 *       () => api.notifications().then((l) => l ?? []),
 *       [],
 *     )
 *
 * `fn` runs on mount and whenever any `deps` entry changes; `reload()` refetches
 * immediately (used by error-retry buttons). `setData` lets callers update the
 * loaded list in place after local mutations (create/update/delete/read).
 * `initialData` restores the old `useState(initial)` semantics for pages that
 * assume a non-null value (e.g. `[]` when rendering `list.length` pre-guard).
 * The `cancelled` guard prevents setState after unmount, matching the pages'
 * existing pattern.
 */
export default function useAsync(fn, deps = [], initialData = null) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const load = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fnRef
      .current()
      .then((result) => {
        if (cancelled) return
        setData(result)
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

  useEffect(() => load(), [load, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, setData, loading, error, reload: load }
}
