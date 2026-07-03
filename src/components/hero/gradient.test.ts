import { describe, expect, it } from 'vitest'

import { getHeroGradient, HERO_GRADIENT_DEFAULT } from './gradient'
import { getWmoInfo, WMO_CODES } from '@/lib/wmoCodes'

describe('getHeroGradient', () => {
  it('returns a class string that stays in the green family for every known WMO code (day)', () => {
    for (const code of WMO_CODES) {
      const cls = getHeroGradient({ weatherCode: code, isDay: true })
      expect(cls).toContain('from-brand-')
      expect(cls).toContain('via-brand-')
      expect(cls).toContain('to-brand-')
    }
  })

  it('returns a bg-gradient class for every known WMO code (night)', () => {
    for (const code of WMO_CODES) {
      const cls = getHeroGradient({ weatherCode: code, isDay: false })
      expect(cls).toContain('bg-gradient-to-br')
      expect(cls).toMatch(/from-\S+/)
    }
  })

  it('picks a darker night gradient (contains slate or brand-800/900) for each category', () => {
    // Every weather category should have a distinct night variant that is
    // darker than day — we detect that by presence of slate-* or brand-800/900.
    const nightIndicators = /(slate-|brand-800|brand-900|black)/
    const codes = [0, 3, 61, 71, 95]
    for (const code of codes) {
      const night = getHeroGradient({ weatherCode: code, isDay: false })
      expect(night).toMatch(nightIndicators)
    }
  })

  it('picks a different gradient for sunny+day vs sunny+night', () => {
    // Code 0 = clear sky, marked isSunny.
    const day = getHeroGradient({ weatherCode: 0, isDay: true })
    const night = getHeroGradient({ weatherCode: 0, isDay: false })
    expect(day).not.toEqual(night)
  })

  it('returns the default gradient for an unknown code', () => {
    const cls = getHeroGradient({ weatherCode: 99999, isDay: true })
    expect(cls).toEqual(HERO_GRADIENT_DEFAULT)
  })

  const categoryCases: Array<{
    name: string
    predicate: (info: ReturnType<typeof getWmoInfo>) => boolean | undefined
  }> = [
    { name: 'sunny', predicate: (i) => i.isSunny },
    { name: 'cloudy', predicate: (i) => i.isCloudy },
    { name: 'rainy', predicate: (i) => i.isRainy },
    { name: 'snowy', predicate: (i) => i.isSnowy },
    { name: 'stormy', predicate: (i) => i.isStormy },
  ]

  for (const { name, predicate } of categoryCases) {
    it(`returns a green-family gradient for every ${name} code`, () => {
      const matching = WMO_CODES.filter((code) => predicate(getWmoInfo(code, true)))
      expect(matching.length).toBeGreaterThan(0)
      for (const code of matching) {
        const cls = getHeroGradient({ weatherCode: code, isDay: true })
        expect(cls).toContain('from-brand-')
      }
    })
  }
})
