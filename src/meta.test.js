import { describe, expect, it } from 'vitest'
import { allFilter, feeFor, options, sessionTypes, statusChoices } from './meta'

describe('options', () => {
  it('returns the label list for a known key', () => {
    expect(options({ enrollmentStatus: ['مكتمل الدفع', 'بانتظار الدفع'] }, 'enrollmentStatus')).toEqual([
      'مكتمل الدفع',
      'بانتظار الدفع',
    ])
  })

  it('returns an empty array for missing meta or keys', () => {
    expect(options(null, 'anything')).toEqual([])
    expect(options({}, 'anything')).toEqual([])
    expect(options({ a: [1] }, 'missing')).toEqual([])
  })
})

describe('allFilter', () => {
  it('prepends the UI-only sentinel', () => {
    expect(allFilter(['نشط', 'معلق'])).toEqual(['الكل', 'نشط', 'معلق'])
  })

  it('defaults to just the sentinel', () => {
    expect(allFilter()).toEqual(['الكل'])
    expect(allFilter([])).toEqual(['الكل'])
  })
})

describe('sessionTypes', () => {
  it('maps API names to frontend price multipliers', () => {
    const meta = { sessionType: ['جلسة استشارية', 'جلسة مكثفة', 'لقاء مرئي'] }
    expect(sessionTypes(meta)).toEqual([
      { name: 'جلسة استشارية', mult: 1 },
      { name: 'جلسة مكثفة', mult: 1.4 },
      { name: 'لقاء مرئي', mult: 0.8 },
    ])
  })

  it('defaults unknown types to the base multiplier', () => {
    expect(sessionTypes({ sessionType: ['نوع غريب'] })).toEqual([{ name: 'نوع غريب', mult: 1 }])
    expect(sessionTypes({})).toEqual([])
  })
})

describe('statusChoices', () => {
  it('returns the meta labels without the «الكل» sentinel', () => {
    expect(statusChoices({ courseStatus: ['منشورة', 'مسودة'] }, 'courseStatus', 'منشورة')).toEqual([
      'منشورة',
      'مسودة',
    ])
  })

  it('always includes the current status even when not listed in meta', () => {
    expect(statusChoices({ programStatus: ['مفتوح', 'مكتمل'] }, 'programStatus', 'ملغي')).toEqual([
      'ملغي',
      'مفتوح',
      'مكتمل',
    ])
  })

  it('degrades to just the current status without meta', () => {
    expect(statusChoices(undefined, 'meetingStatus', 'مجدول')).toEqual(['مجدول'])
  })
})

describe('feeFor', () => {
  it('applies the multiplier then rounds to the nearest 25', () => {
    expect(feeFor(400, 'جلسة استشارية')).toBe(400) // 400 * 1.0
    expect(feeFor(400, 'جلسة مكثفة')).toBe(550) // 560 → 22.4 → 22 * 25
    expect(feeFor(400, 'لقاء مرئي')).toBe(325) // 320 → 12.8 → 13 * 25
  })

  it('falls back to the base price for unknown types', () => {
    expect(feeFor(400, 'غير معروف')).toBe(400)
  })
})
