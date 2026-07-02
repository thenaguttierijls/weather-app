import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { TrendChartTile } from './TrendChartTile'
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
    daily: Array.from({ length: 5 }).map((_, i) => ({
      date: `2100-01-0${i + 1}`,
      weatherCode: 0,
      tempMaxC: 20 + i,
      tempMinC: 10 + i,
      sunrise: `2100-01-0${i + 1}T05:00`,
      sunset: `2100-01-0${i + 1}T20:00`,
      uvMax: 5,
      precipProbability: 0,
    })),
  }
  return { ...base, ...overrides }
}

describe('TrendChartTile', () => {
  beforeEach(() => {
    useUnitStore.setState({ unit: 'metric' })
  })

  it('renders the tile chrome and chart region', () => {
    render(<TrendChartTile forecast={makeForecast()} />)
    expect(screen.getByRole('region', { name: 'Five-day temperature trend' })).toBeInTheDocument()
    expect(screen.getByText(/5-day trend/i)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /trend chart/i })).toBeInTheDocument()
  })

  it('exposes a chart region with the expected aria label', () => {
    render(<TrendChartTile forecast={makeForecast()} />)
    const chart = screen.getByRole('img', { name: /trend chart/i })
    expect(chart).toBeInTheDocument()
    expect(chart.className).toContain('text-primary')
  })

  it('shows the fallback when daily data is empty', () => {
    render(<TrendChartTile forecast={makeForecast({ daily: [] })} />)
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /trend chart/i })).not.toBeInTheDocument()
  })

  it('renders inside the shared Tile chrome', () => {
    render(<TrendChartTile forecast={makeForecast()} />)
    const region = screen.getByRole('region', { name: 'Five-day temperature trend' })
    expect(region.className).toContain('rounded-2xl')
    expect(region.className).toContain('bg-card')
  })
})
