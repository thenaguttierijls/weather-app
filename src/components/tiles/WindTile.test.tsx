import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { WindTile } from './WindTile'
import type { NormalizedForecast } from '@/api/types'
import { useUnitStore } from '@/stores/useUnitStore'

function makeForecast(overrides: Partial<NormalizedForecast['current']> = {}): NormalizedForecast {
  return {
    location: { name: 'Chicago', country: 'US', timezone: 'UTC', lat: 0, lng: 0 },
    current: {
      tempC: 20, apparentC: 20, humidity: 50, windKph: 12, windDir: 225,
      weatherCode: 0, isDay: true, precip: 0, uv: 3,
      ...overrides,
    },
    hourly: [],
    daily: [],
  }
}

describe('WindTile', () => {
  beforeEach(() => {
    useUnitStore.setState({ unit: 'metric' })
  })

  it('renders the tile header and speed', () => {
    render(<WindTile forecast={makeForecast()} />)
    expect(screen.getByRole('region', { name: 'Current wind' })).toBeInTheDocument()
    expect(screen.getByText('12 kph')).toBeInTheDocument()
  })

  it('shows the compass direction label', () => {
    render(<WindTile forecast={makeForecast({ windDir: 225 })} />)
    expect(screen.getByText('SW')).toBeInTheDocument()
  })

  it('rotates the needle to match the wind direction', () => {
    const { getByTestId } = render(<WindTile forecast={makeForecast({ windDir: 90 })} />)
    const needle = getByTestId('wind-needle')
    expect(needle.getAttribute('transform')).toContain('rotate(90')
  })

  it('sets an aria-label with the speed and direction', () => {
    render(<WindTile forecast={makeForecast({ windKph: 20, windDir: 0 })} />)
    expect(screen.getByRole('img', { name: /wind 20 kph from N/i })).toBeInTheDocument()
  })

  it('switches units when the imperial preference is set', () => {
    useUnitStore.setState({ unit: 'imperial' })
    render(<WindTile forecast={makeForecast({ windKph: 16 })} />)
    expect(screen.getByText('10 mph')).toBeInTheDocument()
  })

  it('handles non-finite wind data', () => {
    render(<WindTile forecast={makeForecast({ windKph: Number.NaN, windDir: Number.NaN })} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /unavailable/i })).toBeInTheDocument()
  })

  it('renders cardinal labels', () => {
    render(<WindTile forecast={makeForecast()} />)
    expect(screen.getByText('N')).toBeInTheDocument()
    expect(screen.getByText('E')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('W')).toBeInTheDocument()
  })
})
