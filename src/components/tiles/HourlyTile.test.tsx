import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { HourlyTile } from './HourlyTile'
import type { NormalizedForecast } from '@/api/types'
import { useUnitStore } from '@/stores/useUnitStore'

function makeForecast(overrides: Partial<NormalizedForecast> = {}): NormalizedForecast {
  const base: NormalizedForecast = {
    location: { name: 'Chicago', country: 'US', timezone: 'UTC', lat: 0, lng: 0 },
    current: {
      tempC: 20, apparentC: 20, humidity: 50, windKph: 5, windDir: 0,
      weatherCode: 0, isDay: true, precip: 0, uv: 3,
    },
    hourly: Array.from({ length: 12 }).map((_, i) => ({
      time: `2100-01-01T${String(i).padStart(2, '0')}:00`,
      tempC: 20 + i,
      weatherCode: 0,
      precipProbability: 0,
    })),
    daily: [],
  }
  return { ...base, ...overrides }
}

describe('HourlyTile', () => {
  beforeEach(() => {
    useUnitStore.setState({ unit: 'metric' })
  })

  it('renders the tile header', () => {
    render(<HourlyTile forecast={makeForecast()} />)
    expect(screen.getByRole('region', { name: 'Hourly forecast' })).toBeInTheDocument()
    expect(screen.getByText(/Next 12 hours/i)).toBeInTheDocument()
  })

  it('renders 12 hourly cells at most', () => {
    render(<HourlyTile forecast={makeForecast()} />)
    const region = screen.getByRole('region', { name: 'Hourly forecast' })
    const items = region.querySelectorAll('li')
    expect(items.length).toBeLessThanOrEqual(12)
    expect(items.length).toBeGreaterThan(0)
  })

  it('handles an empty hourly array without crashing', () => {
    render(<HourlyTile forecast={makeForecast({ hourly: [] })} />)
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
  })

  it('shows an em-dash for non-finite tempC values', () => {
    render(
      <HourlyTile
        forecast={makeForecast({
          hourly: [
            { time: '2100-01-01T00:00', tempC: Number.NaN, weatherCode: 0, precipProbability: 0 },
          ],
        })}
      />
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
