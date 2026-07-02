import { describe, expect, it } from 'vitest'

import { WMO_CODES, getWmoInfo } from './wmoCodes'

const REQUIRED_CODES = [
  0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57,
  61, 63, 65, 66, 67, 71, 73, 75, 77,
  80, 81, 82, 85, 86, 95, 96, 99,
]

describe('getWmoInfo', () => {
  it.each(REQUIRED_CODES)('code %d returns a non-empty label and iconKey (day)', (code) => {
    const info = getWmoInfo(code, true)
    expect(info.label.length).toBeGreaterThan(0)
    expect(info.iconKey.length).toBeGreaterThan(0)
  })

  it.each(REQUIRED_CODES)('code %d returns a non-empty label and iconKey (night)', (code) => {
    const info = getWmoInfo(code, false)
    expect(info.label.length).toBeGreaterThan(0)
    expect(info.iconKey.length).toBeGreaterThan(0)
  })

  it('returns a safe default for an unknown code', () => {
    const info = getWmoInfo(9999, true)
    expect(info.label).toBe('Unknown conditions')
    expect(info.iconKey).toBe('not-available')
  })

  it('picks a day icon vs night icon for clear sky', () => {
    const day = getWmoInfo(0, true)
    const night = getWmoInfo(0, false)
    expect(day.iconKey).toBe('clear-day')
    expect(night.iconKey).toBe('clear-night')
  })

  it('flags 61 (light rain) as rainy', () => {
    expect(getWmoInfo(61, true).isRainy).toBe(true)
  })

  it('flags 71 (light snow) as snowy', () => {
    expect(getWmoInfo(71, true).isSnowy).toBe(true)
  })

  it('flags 95 (thunderstorm) as stormy', () => {
    expect(getWmoInfo(95, true).isStormy).toBe(true)
  })

  it('flags 0 (clear) as sunny', () => {
    expect(getWmoInfo(0, true).isSunny).toBe(true)
  })

  it('WMO_CODES covers every required code', () => {
    for (const code of REQUIRED_CODES) {
      expect(WMO_CODES).toContain(code)
    }
  })
})
