import { describe, expect, it } from 'vitest'

import { computeNowcast } from './nowcast'

const FIXED_NOW = new Date('2026-07-06T12:00:00Z').getTime()

function slots(startIso: string, precips: number[]) {
  const start = new Date(startIso).getTime()
  return precips.map((precip, i) => ({
    time: new Date(start + i * 15 * 60 * 1000).toISOString(),
    precip,
  }))
}

describe('computeNowcast', () => {
  it('returns unknown when minutely15 is empty', () => {
    expect(computeNowcast([], FIXED_NOW).status).toBe('unknown')
  })

  it('returns raining when the current slot has precipitation', () => {
    const result = computeNowcast(slots('2026-07-06T12:00:00Z', [0.8, 0.6, 0.5, 0.4]), FIXED_NOW)
    expect(result.status).toBe('raining')
    expect(result.intensity).toBeDefined()
  })

  it('reports light / moderate / heavy intensity based on max precipitation', () => {
    expect(computeNowcast(slots('2026-07-06T12:00:00Z', [0.3, 0.3, 0.3, 0.3]), FIXED_NOW).intensity).toBe('light')
    expect(computeNowcast(slots('2026-07-06T12:00:00Z', [0.3, 1.5, 0.3, 0.3]), FIXED_NOW).intensity).toBe('moderate')
    expect(computeNowcast(slots('2026-07-06T12:00:00Z', [0.3, 3, 0.3, 0.3]), FIXED_NOW).intensity).toBe('heavy')
  })

  it('returns rain-soon with minutesUntilRain when rain starts in the future', () => {
    const result = computeNowcast(slots('2026-07-06T12:00:00Z', [0, 0.5, 0.3, 0.2]), FIXED_NOW)
    expect(result.status).toBe('rain-soon')
    expect(result.minutesUntilRain).toBeGreaterThan(0)
    expect(result.minutesUntilRain).toBeLessThanOrEqual(60)
  })

  it('returns clear when no slot in the next hour has precipitation', () => {
    const result = computeNowcast(slots('2026-07-06T12:00:00Z', [0, 0, 0, 0]), FIXED_NOW)
    expect(result.status).toBe('clear')
  })
})
