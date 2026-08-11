import { describe, expect, it } from 'vitest'
import { fmtDate, localDateStr, num } from './format'

describe('num', () => {
  it('groups thousands with commas', () => {
    expect(num(1234567)).toBe('1,234,567')
  })

  it('handles zero and decimals', () => {
    expect(num(0)).toBe('0')
    expect(num(999.5)).toBe('999.5')
  })
})

describe('fmtDate', () => {
  it('renders a dash for missing or invalid input', () => {
    expect(fmtDate(null)).toBe('—')
    expect(fmtDate('')).toBe('—')
    expect(fmtDate('not-a-date')).toBe('—')
  })

  it('keeps bare YYYY-MM-DD on its calendar day and formats in Arabic', () => {
    const out = fmtDate('2026-09-01')
    expect(out).toContain('2026')
    expect(out).toContain('سبتمبر')
    expect(out).toContain('1')
  })

  it('renders a full ISO timestamp (noon UTC — safe in any timezone)', () => {
    // Noon UTC can't cross a date boundary within ±12h, so the month assertion
    // holds on every machine regardless of its local timezone.
    const out = fmtDate('2026-09-01T12:00:00Z')
    expect(out).toContain('2026')
    expect(out).toContain('سبتمبر')
  })
})

describe('localDateStr', () => {
  it('uses local calendar components (no UTC day-shift)', () => {
    expect(localDateStr(new Date(2026, 8, 1))).toBe('2026-09-01')
  })

  it('zero-pads month and day', () => {
    expect(localDateStr(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
