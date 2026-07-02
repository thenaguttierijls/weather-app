import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useGeolocation } from './useGeolocation'

interface StubGeolocation {
  getCurrentPosition: (
    success: (pos: GeolocationPosition) => void,
    error?: (err: GeolocationPositionError) => void
  ) => void
}

function stubGeolocation(impl: StubGeolocation): void {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: impl,
  })
}

function removeGeolocation(): void {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: undefined,
  })
}

function stubPermissions(state: PermissionState | 'error' | null): void {
  if (state === null) {
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: undefined,
    })
    return
  }
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: {
      query: async () => {
        if (state === 'error') throw new Error('boom')
        return { state } as unknown as PermissionStatus
      },
    },
  })
}

function mockOk(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as unknown as Response
}

function makePosition(lat: number, lng: number): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition
}

function makeError(code: number): GeolocationPositionError {
  return {
    code,
    message: 'geo error',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError
}

describe('useGeolocation', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    stubPermissions(null)
    removeGeolocation()
  })

  it('sets status to unavailable when geolocation is not available', async () => {
    removeGeolocation()
    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.status).toBe('unavailable')
    })
    expect(result.current.city).toBeNull()
  })

  it('reads city from fresh cache without hitting geolocation or fetch', async () => {
    const cache = {
      lat: 13.36,
      lng: 103.86,
      name: 'Siem Reap',
      country: 'Cambodia',
      timezone: 'Asia/Phnom_Penh',
      ts: Date.now(),
    }
    localStorage.setItem('weather-app:geo', JSON.stringify(cache))

    const getCurrentPosition = vi.fn()
    stubGeolocation({ getCurrentPosition })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    expect(result.current.city?.name).toBe('Siem Reap')
    expect(result.current.city?.country).toBe('Cambodia')
    expect(getCurrentPosition).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('ignores expired cache and prompts again', async () => {
    const stale = {
      lat: 0,
      lng: 0,
      name: 'Old',
      country: 'Old',
      timezone: 'UTC',
      ts: Date.now() - 48 * 60 * 60 * 1000,
    }
    localStorage.setItem('weather-app:geo', JSON.stringify(stale))
    stubPermissions('prompt')

    stubGeolocation({
      getCurrentPosition: (success) => {
        success(makePosition(13.36, 103.86))
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        mockOk({ city: 'Siem Reap', countryName: 'Cambodia' })
      )
    )

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })
    expect(result.current.city?.name).toBe('Siem Reap')

    const raw = localStorage.getItem('weather-app:geo')
    expect(raw).toContain('Siem Reap')
  })

  it('sets status to denied when permissions API says denied', async () => {
    stubPermissions('denied')
    const getCurrentPosition = vi.fn()
    stubGeolocation({ getCurrentPosition })

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.status).toBe('denied')
    })
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })

  it('sets status to denied when getCurrentPosition errors with code 1', async () => {
    stubPermissions('prompt')
    stubGeolocation({
      getCurrentPosition: (_success, error) => {
        error?.(makeError(1))
      },
    })

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.status).toBe('denied')
    })
  })

  it('sets status to error on non-permission geolocation error', async () => {
    stubPermissions('prompt')
    stubGeolocation({
      getCurrentPosition: (_success, error) => {
        error?.(makeError(3))
      },
    })

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
  })

  it('sets status to error when reverse geocoding fails', async () => {
    stubPermissions('prompt')
    stubGeolocation({
      getCurrentPosition: (success) => {
        success(makePosition(13.36, 103.86))
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      })
    )

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
  })

  it('writes fresh cache after successful lookup', async () => {
    stubPermissions('prompt')
    stubGeolocation({
      getCurrentPosition: (success) => {
        success(makePosition(51.5, -0.12))
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => mockOk({ city: 'London', countryName: 'United Kingdom' }))
    )

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    const raw = localStorage.getItem('weather-app:geo')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.name).toBe('London')
    expect(parsed.country).toBe('United Kingdom')
    expect(typeof parsed.ts).toBe('number')
  })

  it('markToasted updates the flag on the result and in the cache', async () => {
    const cache = {
      lat: 1,
      lng: 2,
      name: 'CityX',
      country: 'CountryX',
      timezone: 'UTC',
      ts: Date.now(),
    }
    localStorage.setItem('weather-app:geo', JSON.stringify(cache))
    stubGeolocation({ getCurrentPosition: vi.fn() })

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })
    expect(result.current.toasted).toBe(false)

    act(() => {
      result.current.markToasted()
    })

    await waitFor(() => {
      expect(result.current.toasted).toBe(true)
    })
    const raw = JSON.parse(localStorage.getItem('weather-app:geo') ?? '{}')
    expect(raw.toasted).toBe(true)
  })
})
