import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCityByName, searchCities } from './geocoding'
import { WeatherApiError } from './types'

function mockOk(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as unknown as Response
}

describe('searchCities', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns [] for empty query without hitting the network', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const results = await searchCities('')
    expect(results).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns [] for whitespace-only query', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const results = await searchCities('   ')
    expect(results).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns parsed results from the API', async () => {
    const payload = {
      results: [
        {
          id: 1,
          name: 'Paris',
          country: 'France',
          latitude: 48.85,
          longitude: 2.35,
          timezone: 'Europe/Paris',
        },
      ],
    }
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(payload)))

    const results = await searchCities('Paris')
    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('Paris')
    expect(results[0]?.country).toBe('France')
  })

  it('returns [] when API omits results', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockOk({})))
    const results = await searchCities('Nowhere')
    expect(results).toEqual([])
  })

  it('caps at 5 by passing count=5', async () => {
    const fetchSpy = vi.fn(async () => mockOk({ results: [] }))
    vi.stubGlobal('fetch', fetchSpy)

    await searchCities('London')

    const url = (fetchSpy.mock.calls[0] as unknown[] | undefined)?.[0] as string
    expect(url).toContain('count=5')
    expect(url).toContain('name=London')
  })

  it('throws WeatherApiError on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    await expect(searchCities('Berlin')).rejects.toThrow(WeatherApiError)
  })

  it('throws WeatherApiError on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as unknown as Response)))
    await expect(searchCities('Berlin')).rejects.toThrow(WeatherApiError)
  })
})

describe('getCityByName', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns the first match', async () => {
    const payload = {
      results: [
        {
          id: 42,
          name: 'Tokyo',
          country: 'Japan',
          latitude: 35.68,
          longitude: 139.65,
          timezone: 'Asia/Tokyo',
        },
      ],
    }
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(payload)))

    const city = await getCityByName('Tokyo')
    expect(city?.name).toBe('Tokyo')
  })

  it('returns null when no results', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockOk({ results: [] })))
    const city = await getCityByName('Zzzz')
    expect(city).toBeNull()
  })

  it('returns null for empty query without hitting the network', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const city = await getCityByName('')
    expect(city).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
