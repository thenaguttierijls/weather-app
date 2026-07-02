import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { UvTile } from './UvTile'
import type { NormalizedForecast } from '@/api/types'

function makeForecast(uv: number | null): NormalizedForecast {
  return {
    location: { name: 'Chicago', country: 'US', timezone: 'UTC', lat: 0, lng: 0 },
    current: {
      tempC: 20, apparentC: 20, humidity: 50, windKph: 5, windDir: 0,
      weatherCode: 0, isDay: true, precip: 0, uv,
    },
    hourly: [],
    daily: [],
  }
}

describe('UvTile', () => {
  it('renders the tile header', () => {
    render(<UvTile forecast={makeForecast(3)} />)
    expect(screen.getByRole('region', { name: 'Ultraviolet index' })).toBeInTheDocument()
  })

  it('renders a rounded UV number', () => {
    render(<UvTile forecast={makeForecast(4.6)} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('labels low UV', () => {
    render(<UvTile forecast={makeForecast(2)} />)
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('labels moderate UV', () => {
    render(<UvTile forecast={makeForecast(4)} />)
    expect(screen.getByText('Moderate')).toBeInTheDocument()
  })

  it('labels high UV', () => {
    render(<UvTile forecast={makeForecast(6)} />)
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('labels very high UV', () => {
    render(<UvTile forecast={makeForecast(9)} />)
    expect(screen.getByText('Very high')).toBeInTheDocument()
  })

  it('labels extreme UV', () => {
    render(<UvTile forecast={makeForecast(11)} />)
    expect(screen.getByText('Extreme')).toBeInTheDocument()
  })

  it('falls back when UV is null', () => {
    render(<UvTile forecast={makeForecast(null)} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
  })
})
