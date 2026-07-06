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
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
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

  it('sets an error message on fetch failure when no cache exists', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const { result } = renderHook(() => useWeather(chicago))

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.isStale).toBe(false)
    expect(typeof result.current.error).toBe('string')
    expect(result.current.error).not.toContain('Error:')
  })

  it('persists a successful fetch to localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(goodPayload())))
    const { result } = renderHook(() => useWeather(chicago))

    await waitFor(() => {
      expect(result.current.data).not.toBeNull()
    })

    const raw = localStorage.getItem('weather-app:last-forecast')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(Array.isArray(parsed.entries)).toBe(true)
    expect(parsed.entries.length).toBe(1)
    expect(parsed.entries[0].key).toBe('41.880,-87.630')
    expect(typeof parsed.entries[0].fetchedAt).toBe('string')
  })

  it('returns cached forecast + isStale=true when the fetch fails and a cache exists', async () => {
    const cachedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    localStorage.setItem(
      'weather-app:last-forecast',
      JSON.stringify({
        entries: [
          {
            key: '41.880,-87.630',
            fetchedAt: cachedAt,
            forecast: {
              location: {
                name: 'Chicago',
                country: 'United States',
                timezone: 'America/Chicago',
                lat: 41.88,
                lng: -87.63,
              },
              current: {
                tempC: 18, apparentC: 17, humidity: 55, windKph: 10, windDir: 180,
                weatherCode: 1, isDay: true, precip: 0, uv: 4,
              },
              hourly: [],
              daily: [],
            },
          },
        ],
      })
    )

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const { result } = renderHook(() => useWeather(chicago))

    await waitFor(() => {
      expect(result.current.data).not.toBeNull()
    })

    expect(result.current.isStale).toBe(true)
    expect(result.current.staleSince).toBe(cachedAt)
    expect(result.current.error).toBeNull()
    expect(result.current.data?.location.name).toBe('Chicago')
  })

  it('clears stale state after a subsequent successful refetch', async () => {
    const cachedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    localStorage.setItem(
      'weather-app:last-forecast',
      JSON.stringify({
        entries: [
          {
            key: '41.880,-87.630',
            fetchedAt: cachedAt,
            forecast: {
              location: {
                name: 'Chicago', country: 'US', timezone: 'America/Chicago', lat: 41.88, lng: -87.63,
              },
              current: {
                tempC: 18, apparentC: 17, humidity: 55, windKph: 10, windDir: 180,
                weatherCode: 1, isDay: true, precip: 0, uv: 4,
              },
              hourly: [], daily: [],
            },
          },
        ],
      })
    )

    let shouldFail = true
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        if (shouldFail) throw new Error('offline')
        return mockOk(goodPayload())
      })
    )
    const { result } = renderHook(() => useWeather(chicago))

    await waitFor(() => {
      expect(result.current.isStale).toBe(true)
    })

    shouldFail = false
    act(() => {
      result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.isStale).toBe(false)
    })
    expect(result.current.staleSince).toBeNull()
    expect(result.current.error).toBeNull()
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

  it('caps the persisted cache at 15 entries', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(goodPayload())))

    for (let i = 0; i < 20; i++) {
      const city: WeatherCity = {
        lat: i * 0.5,
        lng: i * 0.5,
        timezone: 'UTC',
        name: `City${i}`,
        country: 'X',
      }
      const { unmount } = renderHook(() => useWeather(city))
      await waitFor(() => {
        const raw = window.localStorage.getItem('weather-app:last-forecast')
        expect(raw).not.toBeNull()
      })
      unmount()
    }

    const raw = window.localStorage.getItem('weather-app:last-forecast')
    const parsed = JSON.parse(raw!) as { entries: unknown[] }
    expect(parsed.entries).toHaveLength(15)
  })
})
