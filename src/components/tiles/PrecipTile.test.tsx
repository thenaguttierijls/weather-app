import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { PrecipTile } from './PrecipTile'
import type { NormalizedForecast } from '@/api/types'

function makeForecast(overrides: {
  precip?: number
  precipProbability?: number
  emptyDaily?: boolean
} = {}): NormalizedForecast {
  const daily = overrides.emptyDaily
    ? []
    : [{
        date: '2100-01-01',
        weatherCode: 0,
        tempMaxC: 25,
        tempMinC: 15,
        sunrise: '',
        sunset: '',
        uvMax: 5,
        precipProbability: overrides.precipProbability ?? 40,
      }]
  return {
    location: { name: 'Chicago', country: 'US', timezone: 'UTC', lat: 0, lng: 0 },
    current: {
      tempC: 20, apparentC: 20, humidity: 50, windKph: 5, windDir: 0,
      weatherCode: 0, isDay: true, precip: overrides.precip ?? 0, uv: 3,
    },
    hourly: [],
    daily,
  }
}

describe('PrecipTile', () => {
  it('renders the tile header', () => {
    render(<PrecipTile forecast={makeForecast()} />)
    expect(screen.getByRole('region', { name: /precipitation/i })).toBeInTheDocument()
  })

  it("renders today's probability as a percentage", () => {
    render(<PrecipTile forecast={makeForecast({ precipProbability: 70 })} />)
    expect(screen.getByText('70%')).toBeInTheDocument()
  })

  it('shows a friendly "no precipitation" line when current precip is 0', () => {
    render(<PrecipTile forecast={makeForecast({ precip: 0 })} />)
    expect(screen.getByText(/no precipitation/i)).toBeInTheDocument()
  })

  it('reports recent mm when precip is positive', () => {
    render(<PrecipTile forecast={makeForecast({ precip: 0.5 })} />)
    expect(screen.getByText(/0\.5 mm/)).toBeInTheDocument()
  })

  it('falls back to em-dash when there is no daily data', () => {
    render(<PrecipTile forecast={makeForecast({ emptyDaily: true })} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
