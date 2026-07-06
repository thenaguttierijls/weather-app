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

  it('shows a sunrise indicator on the hour when sunrise occurs', () => {
    render(
      <HourlyTile
        forecast={makeForecast({
          hourly: [
            { time: '2100-01-01T05:00Z', tempC: 10, weatherCode: 0, precipProbability: 0 },
            { time: '2100-01-01T06:00Z', tempC: 12, weatherCode: 0, precipProbability: 0 },
            { time: '2100-01-01T07:00Z', tempC: 14, weatherCode: 0, precipProbability: 0 },
          ],
          daily: [
            { date: '2100-01-01', weatherCode: 0, tempMaxC: 20, tempMinC: 5, sunrise: '2100-01-01T06:12Z', sunset: '2100-01-01T20:30Z', uvMax: 5, precipProbability: 0 },
          ],
        })}
      />
    )
    expect(screen.getByLabelText(/Sunrise at 6:12 AM/)).toBeInTheDocument()
  })

  it('shows a sunset indicator on the hour when sunset occurs', () => {
    render(
      <HourlyTile
        forecast={makeForecast({
          hourly: [
            { time: '2100-01-01T19:00Z', tempC: 18, weatherCode: 0, precipProbability: 0 },
            { time: '2100-01-01T20:00Z', tempC: 16, weatherCode: 0, precipProbability: 0 },
            { time: '2100-01-01T21:00Z', tempC: 14, weatherCode: 0, precipProbability: 0 },
          ],
          daily: [
            { date: '2100-01-01', weatherCode: 0, tempMaxC: 20, tempMinC: 5, sunrise: '2100-01-01T06:12Z', sunset: '2100-01-01T20:30Z', uvMax: 5, precipProbability: 0 },
          ],
        })}
      />
    )
    expect(screen.getByLabelText(/Sunset at 8:30 PM/)).toBeInTheDocument()
  })

  it('does not render sun indicators when no hour overlaps with sunrise or sunset', () => {
    render(
      <HourlyTile
        forecast={makeForecast({
          hourly: [
            { time: '2100-01-01T10:00Z', tempC: 18, weatherCode: 0, precipProbability: 0 },
            { time: '2100-01-01T11:00Z', tempC: 20, weatherCode: 0, precipProbability: 0 },
          ],
          daily: [
            { date: '2100-01-01', weatherCode: 0, tempMaxC: 20, tempMinC: 5, sunrise: '2100-01-01T06:12Z', sunset: '2100-01-01T20:30Z', uvMax: 5, precipProbability: 0 },
          ],
        })}
      />
    )
    expect(screen.queryByLabelText(/Sunrise at/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Sunset at/)).not.toBeInTheDocument()
  })
})
