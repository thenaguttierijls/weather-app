import { useCallback, useEffect, useRef, useState } from 'react'

import { getForecast } from '@/api/openMeteo'
import type { NormalizedForecast } from '@/api/types'
import { WeatherApiError } from '@/api/types'
import { logger } from '@/lib/logger'

export interface WeatherCity {
  lat: number
  lng: number
  timezone: string
  name?: string
  country?: string
}

export interface UseWeatherResult {
  data: NormalizedForecast | null
  loading: boolean
  error: string | null
  refetch: () => void
  isStale: boolean
  staleSince: string | null
}

const GENERIC_ERROR = "Something went sideways loading the weather. Try again in a moment."
const CACHE_KEY = 'weather-app:last-forecast'

interface CacheEntry {
  key: string
  forecast: NormalizedForecast
  fetchedAt: string
}

interface CacheStore {
  entries: CacheEntry[]
}

// 3 decimal places ~= 111m; slight geo drift after a fresh geolocation still hits the same cache slot.
function cacheKey(city: WeatherCity): string {
  const lat = city.lat.toFixed(3)
  const lng = city.lng.toFixed(3)
  return `${lat},${lng}`
}

function readCacheStore(): CacheStore {
  if (typeof window === 'undefined') return { entries: [] }
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (raw === null) return { entries: [] }
    const parsed = JSON.parse(raw) as CacheStore
    if (!parsed || !Array.isArray(parsed.entries)) return { entries: [] }
    return parsed
  } catch (err) {
    logger.warn('Forecast cache read failed', { error: String(err) })
    return { entries: [] }
  }
}

function writeCacheEntry(entry: CacheEntry): void {
  if (typeof window === 'undefined') return
  const store = readCacheStore()
  const filtered = store.entries.filter((e) => e.key !== entry.key)
  const next: CacheStore = { entries: [entry, ...filtered].slice(0, 5) }
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(next))
  } catch (err) {
    logger.warn('Forecast cache write failed', { error: String(err) })
  }
}

function readCacheEntry(key: string): CacheEntry | null {
  const store = readCacheStore()
  return store.entries.find((e) => e.key === key) ?? null
}

export function useWeather(city: WeatherCity | null): UseWeatherResult {
  const [data, setData] = useState<NormalizedForecast | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState<boolean>(false)
  const [staleSince, setStaleSince] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!city) {
      abortRef.current?.abort()
      abortRef.current = null
      Promise.resolve().then(() => {
        if (cancelled) return
        setData(null)
        setLoading(false)
        setError(null)
        setIsStale(false)
        setStaleSince(null)
      })
      return () => {
        cancelled = true
      }
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const key = cacheKey(city)

    Promise.resolve().then(() => {
      if (cancelled || controller.signal.aborted) return
      setLoading(true)
      setError(null)
    })

    getForecast({
      lat: city.lat,
      lng: city.lng,
      timezone: city.timezone,
      locationName: city.name,
      countryName: city.country,
    })
      .then((result) => {
        if (cancelled || controller.signal.aborted) return
        setData(result)
        setIsStale(false)
        setStaleSince(null)
        setLoading(false)
        writeCacheEntry({ key, forecast: result, fetchedAt: new Date().toISOString() })
      })
      .catch((err: unknown) => {
        if (cancelled || controller.signal.aborted) return
        const message = err instanceof WeatherApiError ? err.message : GENERIC_ERROR
        const cached = readCacheEntry(key)
        if (cached) {
          setData(cached.forecast)
          setIsStale(true)
          setStaleSince(cached.fetchedAt)
          setError(null)
        } else {
          setError(message)
          setIsStale(false)
          setStaleSince(null)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [city, nonce])

  const refetch = useCallback(() => {
    setNonce((n) => n + 1)
  }, [])

  return { data, loading, error, refetch, isStale, staleSince }
}
