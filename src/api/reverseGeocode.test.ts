import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { reverseGeocode } from './reverseGeocode'

function mockOk(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as unknown as Response
}

describe('reverseGeocode', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns city on happy path (city field populated)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        mockOk({
          city: 'Siem Reap',
          locality: 'Siem Reap',
          principalSubdivision: 'Siem Reap',
          countryName: 'Cambodia',
          countryCode: 'KH',
        })
      )
    )

    const result = await reverseGeocode(13.36, 103.86)
    expect(result).not.toBeNull()
    expect(result?.name).toBe('Siem Reap')
    expect(result?.country).toBe('Cambodia')
    expect(result?.lat).toBe(13.36)
    expect(result?.lng).toBe(103.86)
  })

  it('falls back to locality if city is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        mockOk({
          city: '',
          locality: 'Rural Locality',
          principalSubdivision: 'Some State',
          countryName: 'Nowhereland',
        })
      )
    )

    const result = await reverseGeocode(0, 0)
    expect(result?.name).toBe('Rural Locality')
  })

  it('falls back to principalSubdivision if city and locality are empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        mockOk({
          city: '',
          locality: '',
          principalSubdivision: 'A Region',
          countryName: 'Country',
        })
      )
    )

    const result = await reverseGeocode(0, 0)
    expect(result?.name).toBe('A Region')
  })

  it('returns null when all city-ish fields are empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        mockOk({
          city: '',
          locality: '',
          principalSubdivision: '',
          countryName: 'Country',
        })
      )
    )

    const result = await reverseGeocode(0, 0)
    expect(result).toBeNull()
  })

  it('returns null on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      })
    )

    const result = await reverseGeocode(1, 2)
    expect(result).toBeNull()
  })

  it('returns null on non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            ok: false,
            status: 503,
            json: async () => ({}),
          }) as unknown as Response
      )
    )

    const result = await reverseGeocode(1, 2)
    expect(result).toBeNull()
  })

  it('returns null on malformed JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => {
              throw new Error('bad json')
            },
          }) as unknown as Response
      )
    )

    const result = await reverseGeocode(1, 2)
    expect(result).toBeNull()
  })

  it('URL includes latitude and longitude', async () => {
    const fetchSpy = vi.fn(async () => mockOk({ city: 'X', countryName: 'Y' }))
    vi.stubGlobal('fetch', fetchSpy)

    await reverseGeocode(51.5074, -0.1278)

    const url = (fetchSpy.mock.calls[0] as unknown[] | undefined)?.[0] as string
    expect(url).toContain('latitude=51.5074')
    expect(url).toContain('longitude=-0.1278')
    expect(url).toContain('localityLanguage=en')
  })

  it('leaves country blank if countryName is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        mockOk({
          city: 'Nowhere',
        })
      )
    )

    const result = await reverseGeocode(0, 0)
    expect(result?.name).toBe('Nowhere')
    expect(result?.country).toBe('')
  })
})
