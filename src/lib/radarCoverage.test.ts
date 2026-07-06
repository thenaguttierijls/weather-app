import { describe, expect, it } from 'vitest'

import { hasRadarCoverage } from './radarCoverage'

describe('hasRadarCoverage', () => {
  it.each<[string, number, number, boolean]>([
    ['Chicago (US)', 41.88, -87.63, true],
    ['London (EU)', 51.51, -0.13, true],
    ['Sydney (AU)', -33.87, 151.21, true],
    ['Tokyo (JP)', 35.68, 139.65, true],
    ['Bangkok (TH)', 13.76, 100.5, false],
    ['Nairobi (KE)', -1.29, 36.82, false],
    ['Buenos Aires (AR)', -34.6, -58.38, false],
  ])('%s → %s', (_name, lat, lng, expected) => {
    expect(hasRadarCoverage(lat, lng)).toBe(expected)
  })
})
