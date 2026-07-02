import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useCityImage } from './useCityImage'

function mockOk(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as unknown as Response
}

function mock404(): Response {
  return { ok: false, status: 404, json: async () => ({}) } as unknown as Response
}

describe('useCityImage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns { url: null, loading: false } when cityName is null', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const { result } = renderHook(() => useCityImage(null))
    expect(result.current.url).toBeNull()
    expect(result.current.loading).toBe(false)

    // Give any microtask a chance to fire — nothing should have hit the network.
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns { url: null, loading: false } when cityName is undefined', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const { result } = renderHook(() => useCityImage(undefined))
    expect(result.current.url).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns { url: null, loading: false } when cityName is empty string', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const { result } = renderHook(() => useCityImage(''))
    expect(result.current.url).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('loads then returns the URL on happy path', async () => {
    const payload = {
      title: 'Paris',
      thumbnail: { source: 'https://upload.wikimedia.org/paris.jpg' },
    }
    vi.stubGlobal('fetch', vi.fn(async () => mockOk(payload)))

    const { result } = renderHook(() => useCityImage('Paris'))

    await waitFor(() => {
      expect(result.current.url).toBe('https://upload.wikimedia.org/paris.jpg')
    })
    expect(result.current.loading).toBe(false)
  })

  it('returns { url: null } when the API returns null (404)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mock404()))

    const { result } = renderHook(() => useCityImage('Nowhereville'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.url).toBeNull()
  })

  it('returns { url: null } when the API returns no thumbnail', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => mockOk({ title: 'Something' })))

    const { result } = renderHook(() => useCityImage('Something'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.url).toBeNull()
  })

  it('only the latest city wins when cityName changes rapidly', async () => {
    // Two fetches in flight; the older one resolves after the newer one.
    // The hook must ignore the stale response.
    let resolveParis: ((r: Response) => void) | null = null
    let resolveTokyo: ((r: Response) => void) | null = null
    const parisPromise = new Promise<Response>((r) => { resolveParis = r })
    const tokyoPromise = new Promise<Response>((r) => { resolveTokyo = r })

    const fetchSpy = vi.fn((url: string) => {
      if (url.includes('Paris')) return parisPromise
      if (url.includes('Tokyo')) return tokyoPromise
      return Promise.reject(new Error('unexpected url'))
    })
    vi.stubGlobal('fetch', fetchSpy)

    const { result, rerender } = renderHook(({ city }: { city: string }) => useCityImage(city), {
      initialProps: { city: 'Paris' },
    })

    rerender({ city: 'Tokyo' })

    resolveTokyo!(mockOk({ thumbnail: { source: 'https://upload.wikimedia.org/tokyo.jpg' } }))

    await waitFor(() => {
      expect(result.current.url).toBe('https://upload.wikimedia.org/tokyo.jpg')
    })

    resolveParis!(mockOk({ thumbnail: { source: 'https://upload.wikimedia.org/paris.jpg' } }))

    // Give Paris a chance to (wrongly) overwrite. It shouldn't.
    await new Promise((r) => setTimeout(r, 20))
    expect(result.current.url).toBe('https://upload.wikimedia.org/tokyo.jpg')
  })
})
