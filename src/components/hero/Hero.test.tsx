import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Hero } from './Hero'
import type { NormalizedForecast } from '@/api/types'
import { useUnitStore } from '@/stores/useUnitStore'

function makeForecast(overrides: Partial<NormalizedForecast> = {}): NormalizedForecast {
  return {
    location: {
      name: 'Chicago',
      country: 'United States',
      timezone: 'America/Chicago',
      lat: 41.88,
      lng: -87.63,
    },
    current: {
      tempC: 22,
      apparentC: 20,
      humidity: 55,
      windKph: 10,
      windDir: 180,
      weatherCode: 0,
      isDay: true,
      precip: 0,
      uv: 5,
    },
    hourly: [
      {
        time: '2026-07-02T15:00',
        tempC: 22,
        weatherCode: 0,
        precipProbability: 10,
      },
    ],
    daily: [
      {
        date: '2026-07-02',
        weatherCode: 0,
        tempMaxC: 26,
        tempMinC: 15,
        sunrise: '2026-07-02T05:15',
        sunset: '2026-07-02T20:30',
        uvMax: 6,
        precipProbability: 10,
      },
    ],
    ...overrides,
  }
}

describe('Hero', () => {
  beforeEach(() => {
    useUnitStore.setState({ unit: 'metric' })
  })

  it('renders the city name and country', () => {
    render(<Hero forecast={makeForecast()} />)
    expect(screen.getByText('Chicago')).toBeInTheDocument()
    expect(screen.getByText('United States')).toBeInTheDocument()
  })

  it('renders the temperature in Celsius when unit is metric', () => {
    useUnitStore.setState({ unit: 'metric' })
    render(<Hero forecast={makeForecast({ current: { ...makeForecast().current, tempC: 22 } })} />)
    expect(screen.getByText('22°C')).toBeInTheDocument()
  })

  it('renders the temperature in Fahrenheit when unit is imperial', () => {
    useUnitStore.setState({ unit: 'imperial' })
    render(<Hero forecast={makeForecast({ current: { ...makeForecast().current, tempC: 0 } })} />)
    expect(screen.getByText('32°F')).toBeInTheDocument()
  })

  it('renders the WMO condition label', () => {
    render(<Hero forecast={makeForecast()} />)
    expect(screen.getByText('Clear sky')).toBeInTheDocument()
  })

  it('renders the daily high/low', () => {
    render(<Hero forecast={makeForecast()} />)
    expect(screen.getByText(/High 26°C/)).toBeInTheDocument()
    expect(screen.getByText(/Low 15°C/)).toBeInTheDocument()
  })

  it('renders the "feels like" line', () => {
    render(<Hero forecast={makeForecast()} />)
    expect(screen.getByText(/Feels like 20°C/)).toBeInTheDocument()
  })

  it('sets an aria-label on the big temperature', () => {
    render(<Hero forecast={makeForecast()} />)
    expect(screen.getByLabelText(/Temperature 22 degrees Celsius/)).toBeInTheDocument()
  })

  it('sets an aria-label on the section for the current city', () => {
    render(<Hero forecast={makeForecast()} />)
    const section = screen.getByRole('region', { name: /Current weather for Chicago/ })
    expect(section).toBeInTheDocument()
  })

  it('falls back to a generic section label when location name is empty', () => {
    render(
      <Hero
        forecast={makeForecast({
          location: {
            name: '',
            country: '',
            timezone: 'UTC',
            lat: 0,
            lng: 0,
          },
        })}
      />
    )
    expect(screen.getByRole('region', { name: 'Current weather' })).toBeInTheDocument()
  })

  it('applies a green gradient class to the section', () => {
    render(<Hero forecast={makeForecast()} />)
    const section = screen.getByRole('region', { name: /Current weather/ })
    expect(section.className).toMatch(/from-brand-/)
  })

  it('shows a sun icon labelled "Day" when isDay is true', () => {
    render(
      <Hero
        forecast={makeForecast({
          current: { ...makeForecast().current, isDay: true },
        })}
      />
    )
    expect(screen.getByLabelText('Day')).toBeInTheDocument()
    expect(screen.queryByLabelText('Night')).not.toBeInTheDocument()
  })

  it('shows a moon icon labelled "Night" when isDay is false', () => {
    render(
      <Hero
        forecast={makeForecast({
          current: { ...makeForecast().current, isDay: false },
        })}
      />
    )
    expect(screen.getByLabelText('Night')).toBeInTheDocument()
    expect(screen.queryByLabelText('Day')).not.toBeInTheDocument()
  })

  it('picks a darker gradient at night than during the day for the same weather code', () => {
    const { container: dayContainer } = render(
      <Hero
        forecast={makeForecast({
          current: { ...makeForecast().current, weatherCode: 0, isDay: true },
        })}
      />
    )
    const dayGradient = dayContainer.querySelector('section')?.className ?? ''

    const { container: nightContainer } = render(
      <Hero
        forecast={makeForecast({
          current: { ...makeForecast().current, weatherCode: 0, isDay: false },
        })}
      />
    )
    const nightGradient = nightContainer.querySelector('section')?.className ?? ''

    expect(dayGradient).not.toEqual(nightGradient)
    expect(nightGradient).toMatch(/(slate-|brand-800|brand-900|black)/)
  })
})
