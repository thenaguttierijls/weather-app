import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { FeelsLikeTile } from './FeelsLikeTile'
import type { NormalizedForecast } from '@/api/types'
import { useUnitStore } from '@/stores/useUnitStore'

function makeForecast(overrides: Partial<NormalizedForecast['current']> = {}): NormalizedForecast {
  return {
    location: { name: 'Chicago', country: 'US', timezone: 'UTC', lat: 0, lng: 0 },
    current: {
      tempC: 20, apparentC: 20, humidity: 50, windKph: 5, windDir: 0,
      weatherCode: 0, isDay: true, precip: 0, uv: 3,
      ...overrides,
    },
    hourly: [],
    daily: [],
  }
}

describe('FeelsLikeTile', () => {
  beforeEach(() => {
    useUnitStore.setState({ unit: 'metric' })
  })

  it('renders the tile header', () => {
    render(<FeelsLikeTile forecast={makeForecast()} />)
    expect(screen.getByRole('region', { name: 'Feels-like temperature' })).toBeInTheDocument()
  })

  it('renders the apparent temperature as the main number', () => {
    render(<FeelsLikeTile forecast={makeForecast({ tempC: 20, apparentC: 18 })} />)
    expect(screen.getByText('18°C')).toBeInTheDocument()
  })

  it('shows a wind-chill hint when apparent is much cooler than actual', () => {
    render(<FeelsLikeTile forecast={makeForecast({ tempC: 20, apparentC: 15 })} />)
    expect(screen.getByText(/wind chill/i)).toBeInTheDocument()
  })

  it('shows a humidity hint when apparent is much warmer than actual', () => {
    render(<FeelsLikeTile forecast={makeForecast({ tempC: 20, apparentC: 25 })} />)
    expect(screen.getByText(/humidity/i)).toBeInTheDocument()
  })

  it('shows a "close to actual" line when the delta is small', () => {
    render(<FeelsLikeTile forecast={makeForecast({ tempC: 20, apparentC: 21 })} />)
    expect(screen.getByText(/close to the actual/i)).toBeInTheDocument()
  })

  it('handles non-finite apparent temperature gracefully', () => {
    render(<FeelsLikeTile forecast={makeForecast({ apparentC: Number.NaN })} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
  })
})
