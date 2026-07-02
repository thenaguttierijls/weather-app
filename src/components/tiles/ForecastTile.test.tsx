import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ForecastTile } from './ForecastTile'
import type { NormalizedForecast } from '@/api/types'
import { useUnitStore } from '@/stores/useUnitStore'

function makeForecast(overrides: Partial<NormalizedForecast> = {}): NormalizedForecast {
  const base: NormalizedForecast = {
    location: { name: 'Chicago', country: 'US', timezone: 'UTC', lat: 0, lng: 0 },
    current: {
      tempC: 20, apparentC: 20, humidity: 50, windKph: 5, windDir: 0,
      weatherCode: 0, isDay: true, precip: 0, uv: 3,
    },
    hourly: [],
    daily: Array.from({ length: 7 }).map((_, i) => ({
      date: `2100-01-0${i + 1}`,
      weatherCode: 0,
      tempMaxC: 25 + i,
      tempMinC: 10 + i,
      sunrise: `2100-01-0${i + 1}T05:00`,
      sunset: `2100-01-0${i + 1}T20:00`,
      uvMax: 5,
      precipProbability: 0,
    })),
  }
  return { ...base, ...overrides }
}

describe('ForecastTile', () => {
  beforeEach(() => {
    useUnitStore.setState({ unit: 'metric' })
  })

  it('renders the 5-day outlook heading', () => {
    render(<ForecastTile forecast={makeForecast()} />)
    expect(screen.getByRole('region', { name: 'Five-day forecast' })).toBeInTheDocument()
    expect(screen.getByText(/5-day outlook/i)).toBeInTheDocument()
  })

  it('renders exactly 5 days', () => {
    render(<ForecastTile forecast={makeForecast()} />)
    const region = screen.getByRole('region', { name: 'Five-day forecast' })
    const items = region.querySelectorAll('li')
    expect(items).toHaveLength(5)
  })

  it('shows temperature ranges for each day', () => {
    render(<ForecastTile forecast={makeForecast()} />)
    expect(screen.getByText('25°C')).toBeInTheDocument()
    expect(screen.getByText('10°C')).toBeInTheDocument()
  })

  it('shows a fallback when daily is empty', () => {
    render(<ForecastTile forecast={makeForecast({ daily: [] })} />)
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
  })

  it('renders em-dashes for non-finite temperatures', () => {
    render(
      <ForecastTile
        forecast={makeForecast({
          daily: [
            {
              date: '2100-01-01',
              weatherCode: 0,
              tempMaxC: Number.NaN,
              tempMinC: Number.NaN,
              sunrise: '',
              sunset: '',
              uvMax: 0,
              precipProbability: 0,
            },
          ],
        })}
      />
    )
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })
})
