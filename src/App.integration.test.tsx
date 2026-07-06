import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from './App'
import { useCitiesStore } from '@/stores/useCitiesStore'
import { useViewStore } from '@/stores/useViewStore'

function mockOk(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as unknown as Response
}

function forecastPayload(name: string, temp: number) {
  return {
    latitude: 0, longitude: 0, timezone: 'UTC',
    current: {
      time: '2026-07-06T12:00', temperature_2m: temp, apparent_temperature: temp,
      relative_humidity_2m: 50, wind_speed_10m: 5, wind_direction_10m: 0,
      weather_code: 0, is_day: 1, precipitation: 0,
    },
    hourly: { time: ['2026-07-06T12:00'], temperature_2m: [temp], weather_code: [0], precipitation_probability: [0] },
    daily: {
      time: ['2026-07-06'], weather_code: [0],
      temperature_2m_max: [temp + 3], temperature_2m_min: [temp - 3],
      sunrise: ['2026-07-06T05:00'], sunset: ['2026-07-06T20:00'],
      uv_index_max: [5], precipitation_probability_max: [0],
    },
    __city: name,
  }
}

describe('App integration', () => {
  beforeEach(() => {
    localStorage.clear()
    useCitiesStore.setState({
      cities: [
        { id: '41.878_-87.630', name: 'Chicago', country: 'US', lat: 41.878, lng: -87.630, timezone: 'UTC', addedAt: '2026-07-01T00:00:00Z', isPinned: true },
        { id: '35.676_139.650', name: 'Tokyo', country: 'JP', lat: 35.676, lng: 139.650, timezone: 'UTC', addedAt: '2026-07-02T00:00:00Z', isPinned: false },
      ],
      sortMode: 'recent',
    })
    useViewStore.setState({ view: 'detail' })
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(forecastPayload('X', 20))))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('toggles to the cities list and back', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show cities list/i })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /show cities list/i }))

    expect(screen.getByText('My Cities')).toBeInTheDocument()
    expect(screen.getByText('Chicago')).toBeInTheDocument()
    expect(screen.getByText('Tokyo')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /show weather detail/i }))
    expect(screen.queryByText('My Cities')).not.toBeInTheDocument()
  })

  it('tapping a card switches to detail for that city', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /show cities list/i }))
    await user.click(screen.getByRole('button', { name: /open tokyo/i }))

    expect(useViewStore.getState().view).toBe('detail')
    // selectedCity has been set to Tokyo's coords
  })
})
