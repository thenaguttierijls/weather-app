import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useCityWeather } from './useCityWeather'
import type { WeatherCity } from './useWeather'

function goodPayload() {
  return {
    latitude: 41.88, longitude: -87.63, timezone: 'America/Chicago',
    current: {
      time: '2026-07-06T12:00', temperature_2m: 20, apparent_temperature: 19,
      relative_humidity_2m: 50, wind_speed_10m: 10, wind_direction_10m: 180,
      weather_code: 0, is_day: 1, precipitation: 0,
    },
    hourly: { time: ['2026-07-06T12:00'], temperature_2m: [20], weather_code: [0], precipitation_probability: [0] },
    daily: {
      time: ['2026-07-06'], weather_code: [0],
      temperature_2m_max: [24], temperature_2m_min: [15],
      sunrise: ['2026-07-06T05:15'], sunset: ['2026-07-06T20:30'],
      uv_index_max: [6], precipitation_probability_max: [10],
    },
  }
}

function mockOk(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as unknown as Response
}

const chicago: WeatherCity = {
  lat: 41.88, lng: -87.63, timezone: 'America/Chicago',
  name: 'Chicago', country: 'United States',
}

function cacheKey(city: WeatherCity): string {
  return `${city.lat.toFixed(3)},${city.lng.toFixed(3)}`
}

function seedCache(city: WeatherCity, forecast: unknown, ageMinutes: number) {
  const fetchedAt = new Date(Date.now() - ageMinutes * 60_000).toISOString()
  const store = { entries: [{ key: cacheKey(city), forecast, fetchedAt }] }
  window.localStorage.setItem('weather-app:last-forecast', JSON.stringify(store))
}

describe('useCityWeather', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns cached data instantly when cache is fresh', async () => {
    const seeded = { location: { name: 'Chicago', country: 'US', timezone: 'UTC', lat: 41.88, lng: -87.63 },
      current: { tempC: 25, apparentC: 25, humidity: 50, windKph: 0, windDir: 0, weatherCode: 0, isDay: true, precip: 0, uv: 3 },
      hourly: [], daily: [] }
    seedCache(chicago, seeded, 5)
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(goodPayload())))

    const { result } = renderHook(() => useCityWeather(chicago))
    expect(result.current.data?.current.tempC).toBe(25)
    expect(result.current.loading).toBe(false)
  })

  it('fetches when no cache exists', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(goodPayload())))
    const { result } = renderHook(() => useCityWeather(chicago))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.data).not.toBeNull())
    expect(result.current.data?.location.name).toBe('Chicago')
  })

  it('serves cache immediately then refreshes when cache is >15min stale', async () => {
    const seeded = { location: { name: 'Chicago-old', country: 'US', timezone: 'UTC', lat: 41.88, lng: -87.63 },
      current: { tempC: 10, apparentC: 10, humidity: 50, windKph: 0, windDir: 0, weatherCode: 0, isDay: true, precip: 0, uv: 3 },
      hourly: [], daily: [] }
    seedCache(chicago, seeded, 20)
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(goodPayload())))

    const { result } = renderHook(() => useCityWeather(chicago))
    expect(result.current.data?.current.tempC).toBe(10)
    expect(result.current.refreshing).toBe(true)
    await waitFor(() => expect(result.current.refreshing).toBe(false))
    expect(result.current.data?.location.name).toBe('Chicago')
  })

  it('keeps cached data on fetch failure and sets isStale', async () => {
    const seeded = { location: { name: 'Chicago', country: 'US', timezone: 'UTC', lat: 41.88, lng: -87.63 },
      current: { tempC: 22, apparentC: 22, humidity: 50, windKph: 0, windDir: 0, weatherCode: 0, isDay: true, precip: 0, uv: 3 },
      hourly: [], daily: [] }
    seedCache(chicago, seeded, 30)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))

    const { result } = renderHook(() => useCityWeather(chicago))
    await waitFor(() => expect(result.current.refreshing).toBe(false))
    expect(result.current.data?.current.tempC).toBe(22)
    expect(result.current.isStale).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('sets error when fetch fails with no cache', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const { result } = renderHook(() => useCityWeather(chicago))
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.data).toBeNull()
  })

  it('handles a null city (returns empty state)', () => {
    const { result } = renderHook(() => useCityWeather(null))
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('does not refetch when parent creates a new city object with identical values', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(goodPayload())))
    const cityA: WeatherCity = { lat: 41.88, lng: -87.63, timezone: 'America/Chicago', name: 'Chicago', country: 'United States' }
    const cityB: WeatherCity = { lat: 41.88, lng: -87.63, timezone: 'America/Chicago', name: 'Chicago', country: 'United States' }

    const { result, rerender } = renderHook(({ c }: { c: WeatherCity }) => useCityWeather(c), {
      initialProps: { c: cityA },
    })

    await waitFor(() => expect(result.current.data).not.toBeNull())
    const fetchCallsAfterFirst = (globalThis.fetch as unknown as { mock: { calls: unknown[] } }).mock.calls.length

    rerender({ c: cityB })
    // Give any spurious refetch a chance to fire
    await new Promise((r) => setTimeout(r, 50))

    const fetchCallsAfterRerender = (globalThis.fetch as unknown as { mock: { calls: unknown[] } }).mock.calls.length
    expect(fetchCallsAfterRerender).toBe(fetchCallsAfterFirst)
  })
})
