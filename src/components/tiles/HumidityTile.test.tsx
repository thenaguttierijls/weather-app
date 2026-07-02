import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { HumidityTile } from './HumidityTile'
import type { NormalizedForecast } from '@/api/types'

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

describe('HumidityTile', () => {
  it('renders the tile header', () => {
    render(<HumidityTile forecast={makeForecast()} />)
    expect(screen.getByRole('region', { name: 'Current humidity' })).toBeInTheDocument()
  })

  it('formats humidity as a percentage', () => {
    render(<HumidityTile forecast={makeForecast({ humidity: 55 })} />)
    expect(screen.getByText('55%')).toBeInTheDocument()
  })

  it('describes low humidity as dry', () => {
    render(<HumidityTile forecast={makeForecast({ humidity: 20 })} />)
    expect(screen.getByText(/dry/i)).toBeInTheDocument()
  })

  it('describes mid humidity as comfortable', () => {
    render(<HumidityTile forecast={makeForecast({ humidity: 45 })} />)
    expect(screen.getByText(/comfortable/i)).toBeInTheDocument()
  })

  it('describes high humidity as muggy', () => {
    render(<HumidityTile forecast={makeForecast({ humidity: 80 })} />)
    expect(screen.getByText(/muggy/i)).toBeInTheDocument()
  })

  it('falls back gracefully when humidity is non-finite', () => {
    render(<HumidityTile forecast={makeForecast({ humidity: Number.NaN })} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
  })
})
