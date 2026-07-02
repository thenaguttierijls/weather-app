import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useWeather } from './useWeather'
import type { WeatherCity } from './useWeather'

function goodPayload() {
  return {
    latitude: 41.88,
    longitude: -87.63,
    timezone: 'America/Chicago',
    current: {
      time: '2026-07-02T15:00',
      temperature_2m: 21.4,
      apparent_temperature: 20.1,
      relative_humidity_2m: 62,
      wind_speed_10m: 12.3,
      wind_direction_10m: 180,
      weather_code: 1,
      is_day: 1,
      precipitation: 0,
    },
    hourly: {
      time: ['2026-07-02T15:00'],
      temperature_2m: [21.4],
      weather_code: [1],
      precipitation_probability: [10],
    },
    daily: {
      time: ['2026-07-02'],
      weather_code: [1],
      temperature_2m_max: [24],
      temperature_2m_min: [15],
      sunrise: ['2026-07-02T05:15'],
      sunset: ['2026-07-02T20:30'],
      uv_index_max: [6.5],
      precipitation_probability_max: [10],
    },
  }
}

function mockOk(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as unknown as Response
}

const chicago: WeatherCity = {
  lat: 41.88,
  lng: -87.63,
  timezone: 'America/Chicago',
  name: 'Chicago',
  country: 'United States',
}

const paris: WeatherCity = {
  lat: 48.85,
  lng: 2.35,
  timezone: 'Europe/Paris',
  name: 'Paris',
  country: 'France',
}

describe('useWeather', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('starts with no data, no loading when city is null', () => {
    vi.stubGlobal('fetch', vi.fn())
    const { result } = renderHook(() => useWeather(null))
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('loads then returns data on happy path', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(goodPayload())))
    const { result } = renderHook(() => useWeather(chicago))

    await waitFor(() => {
      expect(result.current.data).not.toBeNull()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.data?.location.name).toBe('Chicago')
    expect(result.current.error).toBeNull()
  })

  it('shows loading state while a slow fetch is in flight', async () => {
    let resolveFetch: ((r: Response) => void) | null = null
    const slow = new Promise<Response>((resolve) => { resolveFetch = resolve })
    vi.stubGlobal('fetch', vi.fn(() => slow))

    const { result } = renderHook(() => useWeather(chicago))

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })

    resolveFetch!(mockOk(goodPayload()))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('sets an error message on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const { result } = renderHook(() => useWeather(chicago))

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(typeof result.current.error).toBe('string')
    expect(result.current.error).not.toContain('Error:')
  })

  it('refetch triggers another fetch', async () => {
    const fetchSpy = vi.fn(async () => mockOk(goodPayload()))
    vi.stubGlobal('fetch', fetchSpy)

    const { result } = renderHook(() => useWeather(chicago))

    await waitFor(() => expect(result.current.loading).toBe(false))
    const firstCount = fetchSpy.mock.calls.length

    act(() => {
      result.current.refetch()
    })

    await waitFor(() => {
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(firstCount)
    })
  })

  it('aborts prior request when city changes', async () => {
    const fetchSpy = vi.fn(async () => mockOk(goodPayload()))
    vi.stubGlobal('fetch', fetchSpy)

    const { result, rerender } = renderHook(({ city }) => useWeather(city), {
      initialProps: { city: chicago },
    })

    rerender({ city: paris })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('resets to empty when city becomes null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(goodPayload())))
    const initial: { city: WeatherCity | null } = { city: chicago }
    const { result, rerender } = renderHook(
      ({ city }: { city: WeatherCity | null }) => useWeather(city),
      { initialProps: initial }
    )

    await waitFor(() => expect(result.current.data).not.toBeNull())

    rerender({ city: null })

    await waitFor(() => {
      expect(result.current.data).toBeNull()
    })
    expect(result.current.loading).toBe(false)
  })
})
