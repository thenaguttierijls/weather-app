import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getForecast } from './openMeteo'
import { WeatherApiError } from './types'

function goodResponsePayload() {
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
      time: ['2026-07-02T15:00', '2026-07-02T16:00'],
      temperature_2m: [21.4, 22.0],
      weather_code: [1, 2],
      precipitation_probability: [10, 20],
    },
    daily: {
      time: ['2026-07-02', '2026-07-03'],
      weather_code: [1, 61],
      temperature_2m_max: [24, 23],
      temperature_2m_min: [15, 16],
      sunrise: ['2026-07-02T05:15', '2026-07-03T05:16'],
      sunset: ['2026-07-02T20:30', '2026-07-03T20:29'],
      uv_index_max: [6.5, 5.2],
      precipitation_probability_max: [10, 60],
    },
  }
}

function mockOk(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as unknown as Response
}

function mockNotOk(status = 500): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
  } as unknown as Response
}

describe('getForecast', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns normalized forecast on happy path', async () => {
    const payload = goodResponsePayload()
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(payload)))

    const result = await getForecast({
      lat: 41.88,
      lng: -87.63,
      timezone: 'America/Chicago',
      locationName: 'Chicago',
      countryName: 'United States',
    })

    expect(result.location.name).toBe('Chicago')
    expect(result.location.country).toBe('United States')
    expect(result.location.timezone).toBe('America/Chicago')
    expect(result.current.tempC).toBe(21.4)
    expect(result.current.humidity).toBe(62)
    expect(result.current.isDay).toBe(true)
    expect(result.current.uv).toBe(6.5)
    expect(result.hourly).toHaveLength(2)
    expect(result.hourly[0]?.tempC).toBe(21.4)
    expect(result.daily).toHaveLength(2)
    expect(result.daily[1]?.precipProbability).toBe(60)
  })

  it('passes the timezone and requests kmh wind unit', async () => {
    const payload = goodResponsePayload()
    const fetchSpy = vi.fn(async () => mockOk(payload))
    vi.stubGlobal('fetch', fetchSpy)

    await getForecast({ lat: 0, lng: 0, timezone: 'Europe/Paris' })

    const url = (fetchSpy.mock.calls[0] as unknown[] | undefined)?.[0] as string
    expect(url).toContain('timezone=Europe%2FParis')
    expect(url).toContain('wind_speed_unit=kmh')
    expect(url).toContain('forecast_days=7')
    expect(url).toContain('current=')
    expect(url).toContain('hourly=')
    expect(url).toContain('daily=')
  })

  it('throws WeatherApiError on network failure and logs', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))

    await expect(
      getForecast({ lat: 0, lng: 0, timezone: 'UTC' })
    ).rejects.toThrow(WeatherApiError)
    expect(errorSpy).toHaveBeenCalled()
  })

  it('throws WeatherApiError on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockNotOk(503)))

    await expect(
      getForecast({ lat: 0, lng: 0, timezone: 'UTC' })
    ).rejects.toThrow(WeatherApiError)
  })

  it('throws WeatherApiError on malformed JSON', async () => {
    const bad = {
      ok: true,
      status: 200,
      json: async () => { throw new Error('bad json') },
    } as unknown as Response
    vi.stubGlobal('fetch', vi.fn(async () => bad))

    await expect(
      getForecast({ lat: 0, lng: 0, timezone: 'UTC' })
    ).rejects.toThrow(WeatherApiError)
  })

  it('throws WeatherApiError when response is missing required fields', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockOk({ latitude: 0, longitude: 0, timezone: 'UTC' })))

    await expect(
      getForecast({ lat: 0, lng: 0, timezone: 'UTC' })
    ).rejects.toThrow(WeatherApiError)
  })
})
