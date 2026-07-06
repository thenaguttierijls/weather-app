import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import type { NormalizedForecast } from '@/api/types'
import { NowcastTile } from './NowcastTile'

const FIXED_NOW = new Date('2026-07-06T12:00:00Z')

function slots(startIso: string, precips: number[]) {
  const start = new Date(startIso).getTime()
  return precips.map((precip, i) => ({
    time: new Date(start + i * 15 * 60 * 1000).toISOString(),
    precip,
  }))
}

function makeForecast(overrides: Partial<NormalizedForecast> = {}): NormalizedForecast {
  return {
    location: { name: 'Chicago', country: 'US', timezone: 'UTC', lat: 0, lng: 0 },
    current: {
      tempC: 20, apparentC: 20, humidity: 50, windKph: 5, windDir: 0,
      weatherCode: 0, isDay: true, precip: 0, uv: 3,
    },
    hourly: [],
    daily: [],
    minutely15: [],
    ...overrides,
  }
}

describe('NowcastTile', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the tile chrome', () => {
    render(<NowcastTile forecast={makeForecast()} />)
    expect(screen.getByRole('region', { name: /nowcast/i })).toBeInTheDocument()
  })

  it('shows "Raining now" when currently raining', () => {
    render(<NowcastTile forecast={makeForecast({ minutely15: slots('2026-07-06T12:00:00Z', [1.5, 1.2, 0.8, 0.5]) })} />)
    expect(screen.getByText(/raining now/i)).toBeInTheDocument()
  })

  it('shows "Rain in ~X min" when rain starts soon', () => {
    render(<NowcastTile forecast={makeForecast({ minutely15: slots('2026-07-06T12:00:00Z', [0, 0, 0.5, 0.3]) })} />)
    expect(screen.getByText(/rain in ~\d+ min/i)).toBeInTheDocument()
  })

  it('shows "No rain in the next hour" when clear', () => {
    render(<NowcastTile forecast={makeForecast({ minutely15: slots('2026-07-06T12:00:00Z', [0, 0, 0, 0]) })} />)
    expect(screen.getByText(/no rain in the next hour/i)).toBeInTheDocument()
  })

  it('shows an unavailable message when there is no minutely data', () => {
    render(<NowcastTile forecast={makeForecast({ minutely15: [] })} />)
    expect(screen.getByText(/nowcast unavailable/i)).toBeInTheDocument()
  })
})
