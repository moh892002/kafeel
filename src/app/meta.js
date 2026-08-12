/**
 * Enum label metadata loaded once from GET /api/meta and shared app-wide, so the
 * Arabic labels rendered by the UI are always exactly what the API returns.
 */
import { useEffect, useState } from 'react'
import { api } from './api'

let promise = null
let cache = null

export function ensureMeta() {
  if (cache) return Promise.resolve(cache)
  if (!promise) {
    promise = api
      .meta()
      .then((m) => {
        cache = m ?? {}
        return cache
      })
      .catch((e) => {
        promise = null // allow a retry on the next page mount
        throw e
      })
  }
  return promise
}

export function useMeta() {
  const [meta, setMeta] = useState(cache)
  useEffect(() => {
    if (cache) return undefined
    let cancelled = false
    ensureMeta()
      .then((m) => {
        if (!cancelled) setMeta(m)
      })
      .catch(() => {
        if (!cancelled) setMeta({})
      })
    return () => {
      cancelled = true
    }
  }, [])
  return meta
}

/* Filter bars prepend 'الكل' — a UI-only sentinel, not an enum label. */
export const allFilter = (labels = []) => ['الكل', ...labels]
export const options = (meta, key) => meta?.[key] ?? []

/**
 * Statuses a record may be switched to: the meta labels (minus the «الكل»
 * sentinel), always including the current value even when it is not listed yet.
 */
export const statusChoices = (meta, key, current) => {
  const labels = options(meta, key).filter((s) => s !== 'الكل')
  return labels.includes(current) ? labels : [current, ...labels]
}

/* Session types: names come from the API; the price multipliers are a frontend pricing rule. */
const TYPE_MULT = { 'جلسة استشارية': 1, 'جلسة مكثفة': 1.4, 'لقاء مرئي': 0.8 }
export const sessionTypes = (meta) =>
  options(meta, 'sessionType').map((name) => ({ name, mult: TYPE_MULT[name] ?? 1 }))
export const feeFor = (specialistFee, typeName) => {
  const mult = TYPE_MULT[typeName] ?? 1
  return Math.round((specialistFee * mult) / 25) * 25
}
