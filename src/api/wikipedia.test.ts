import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCityThumbnail } from './wikipedia'

function mockOk(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as unknown as Response
}

function mock404(): Response {
  return {
    ok: false,
    status: 404,
    json: async () => ({}),
  } as unknown as Response
}

describe('getCityThumbnail', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns the thumbnail URL on happy path', async () => {
    const payload = {
      title: 'Paris',
      thumbnail: {
        source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/paris.jpg',
        width: 320,
        height: 213,
      },
    }
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(payload)))

    const url = await getCityThumbnail('Paris')
    expect(url).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/paris.jpg')
  })

  it('returns null when the API returns 404', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mock404()))

    const url = await getCityThumbnail('Nowhereville')
    expect(url).toBeNull()
  })

  it('returns null when the response has no thumbnail field', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockOk({ title: 'Something' })))

    const url = await getCityThumbnail('Something')
    expect(url).toBeNull()
  })

  it('returns null when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))

    const url = await getCityThumbnail('Paris')
    expect(url).toBeNull()
  })

  it('returns null when the JSON body is malformed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('bad json') },
    } as unknown as Response)))

    const url = await getCityThumbnail('Paris')
    expect(url).toBeNull()
  })

  it('URL-encodes city names that contain spaces', async () => {
    const fetchSpy = vi.fn(async () => mockOk({ title: 'Ho Chi Minh City' }))
    vi.stubGlobal('fetch', fetchSpy)

    await getCityThumbnail('Ho Chi Minh City')

    const url = (fetchSpy.mock.calls[0] as unknown[] | undefined)?.[0] as string
    expect(url).toContain('Ho%20Chi%20Minh%20City')
    expect(url).not.toContain('Ho Chi Minh City')
  })

  it('never throws — even on unexpected errors', async () => {
    vi.stubGlobal('fetch', vi.fn(() => {
      throw new Error('sync throw')
    }))

    await expect(getCityThumbnail('Paris')).resolves.toBeNull()
  })
})
