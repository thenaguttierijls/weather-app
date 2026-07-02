import { useEffect, useState } from 'react'

import { reverseGeocode } from '@/api/reverseGeocode'
import { logger } from '@/lib/logger'
import type { WeatherCity } from './useWeather'

const CACHE_KEY = 'weather-app:geo'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const GEO_TIMEOUT_MS = 10_000

export type GeoStatus =
  | 'idle'
  | 'prompting'
  | 'denied'
  | 'unavailable'
  | 'ready'
  | 'error'

export interface UseGeolocationResult {
  city: WeatherCity | null
  status: GeoStatus
  toasted: boolean
  markToasted: () => void
}

interface GeoCache {
  lat: number
  lng: number
  name: string
  country: string
  timezone: string
  ts: number
  toasted?: boolean
}

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function readCache(): GeoCache | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as GeoCache
    if (!parsed || typeof parsed.ts !== 'number') return null
    return parsed
  } catch (err) {
    logger.warn('Geo cache read failed', { error: String(err) })
    return null
  }
}

function writeCache(cache: GeoCache): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (err) {
    logger.warn('Geo cache write failed', { error: String(err) })
  }
}

function isFresh(cache: GeoCache): boolean {
  return Date.now() - cache.ts < CACHE_TTL_MS
}

function cacheToCity(cache: GeoCache): WeatherCity {
  return {
    lat: cache.lat,
    lng: cache.lng,
    timezone: cache.timezone,
    name: cache.name,
    country: cache.country,
  }
}

function getCurrentPositionPromise(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('geolocation-unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: GEO_TIMEOUT_MS,
      maximumAge: 5 * 60 * 1000,
    })
  })
}

async function checkPermissionDenied(): Promise<boolean> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.permissions ||
    typeof navigator.permissions.query !== 'function'
  ) {
    return false
  }
  try {
    const status = await navigator.permissions.query({
      name: 'geolocation' as PermissionName,
    })
    return status.state === 'denied'
  } catch {
    return false
  }
}

export function useGeolocation(): UseGeolocationResult {
  const [city, setCity] = useState<WeatherCity | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [toasted, setToasted] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        Promise.resolve().then(() => {
          if (cancelled) return
          setStatus('unavailable')
        })
        return
      }

      const cache = readCache()
      if (cache && isFresh(cache)) {
        Promise.resolve().then(() => {
          if (cancelled) return
          setCity(cacheToCity(cache))
          setToasted(cache.toasted === true)
          setStatus('ready')
        })
        return
      }

      const denied = await checkPermissionDenied()
      if (cancelled) return
      if (denied) {
        setStatus('denied')
        return
      }

      Promise.resolve().then(() => {
        if (cancelled) return
        setStatus('prompting')
      })

      let position: GeolocationPosition
      try {
        position = await getCurrentPositionPromise()
      } catch (err) {
        if (cancelled) return
        const code = (err as GeolocationPositionError | undefined)?.code
        if (code === 1) {
          setStatus('denied')
        } else {
          setStatus('error')
        }
        return
      }
      if (cancelled) return

      const lat = position.coords.latitude
      const lng = position.coords.longitude
      const timezone = detectTimezone()

      const reversed = await reverseGeocode(lat, lng)
      if (cancelled) return

      if (!reversed) {
        setStatus('error')
        return
      }

      const nextCache: GeoCache = {
        lat,
        lng,
        name: reversed.name,
        country: reversed.country,
        timezone,
        ts: Date.now(),
        toasted: false,
      }
      writeCache(nextCache)

      setCity(cacheToCity(nextCache))
      setToasted(false)
      setStatus('ready')
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [])

  const markToasted = () => {
    setToasted(true)
    const cache = readCache()
    if (cache) {
      writeCache({ ...cache, toasted: true })
    }
  }

  return { city, status, toasted, markToasted }
}
