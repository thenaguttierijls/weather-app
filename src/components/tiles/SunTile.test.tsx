import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { SunTile } from './SunTile'
import type { NormalizedForecast } from '@/api/types'

function makeForecast(overrides: {
  sunrise?: string
  sunset?: string
  daily?: NormalizedForecast['daily']
} = {}): NormalizedForecast {
  const { sunrise = '2100-06-01T06:00:00Z', sunset = '2100-06-01T20:00:00Z', daily } = overrides
  const base: NormalizedForecast = {
    location: { name: 'Chicago', country: 'US', timezone: 'UTC', lat: 0, lng: 0 },
    current: {
      tempC: 20, apparentC: 20, humidity: 50, windKph: 5, windDir: 0,
      weatherCode: 0, isDay: true, precip: 0, uv: 3,
    },
    hourly: [],
    daily: daily ?? [
      {
        date: '2100-06-01',
        weatherCode: 0,
        tempMaxC: 25,
        tempMinC: 15,
        sunrise,
        sunset,
        uvMax: 5,
        precipProbability: 0,
      },
    ],
  }
  return base
}

describe('SunTile', () => {
  it('renders the tile header and both times', () => {
    render(<SunTile forecast={makeForecast()} now={new Date('2100-06-01T13:00:00Z')} />)
    expect(screen.getByRole('region', { name: 'Sunrise and sunset' })).toBeInTheDocument()
    expect(screen.getByText(/6\s*AM/i)).toBeInTheDocument()
    expect(screen.getByText(/8\s*PM/i)).toBeInTheDocument()
  })

  it('positions the sun dot near the arc start before sunrise', () => {
    const { getByTestId } = render(
      <SunTile forecast={makeForecast()} now={new Date('2100-06-01T00:00:00Z')} />
    )
    const dot = getByTestId('sun-dot')
    expect(Number(dot.getAttribute('cx'))).toBeCloseTo(20, 0)
    expect(Number(dot.getAttribute('cy'))).toBeCloseTo(90, 0)
  })

  it('positions the sun dot near the arc end after sunset', () => {
    const { getByTestId } = render(
      <SunTile forecast={makeForecast()} now={new Date('2100-06-01T23:00:00Z')} />
    )
    const dot = getByTestId('sun-dot')
    expect(Number(dot.getAttribute('cx'))).toBeCloseTo(180, 0)
    expect(Number(dot.getAttribute('cy'))).toBeCloseTo(90, 0)
  })

  it('positions the sun dot near the top of the arc at midday (halfway between sunrise and sunset)', () => {
    const { getByTestId } = render(
      <SunTile forecast={makeForecast()} now={new Date('2100-06-01T13:00:00Z')} />
    )
    const dot = getByTestId('sun-dot')
    expect(Number(dot.getAttribute('cx'))).toBeCloseTo(100, 0)
    expect(Number(dot.getAttribute('cy'))).toBeCloseTo(10, 0)
  })

  it('places the sun dot between the arc endpoints during daylight', () => {
    const { getByTestId } = render(
      <SunTile forecast={makeForecast()} now={new Date('2100-06-01T10:00:00Z')} />
    )
    const dot = getByTestId('sun-dot')
    const cx = Number(dot.getAttribute('cx'))
    expect(cx).toBeGreaterThan(20)
    expect(cx).toBeLessThan(180)
  })

  it('sets an aria-label with both times', () => {
    render(<SunTile forecast={makeForecast()} now={new Date('2100-06-01T13:00:00Z')} />)
    expect(screen.getByRole('img', { name: /Sunrise .* sunset/i })).toBeInTheDocument()
  })

  it('shows a fallback when daily data is missing', () => {
    render(<SunTile forecast={makeForecast({ daily: [] })} now={new Date('2100-06-01T13:00:00Z')} />)
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
  })
})
