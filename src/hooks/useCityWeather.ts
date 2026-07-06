import { useEffect, useRef, useState } from 'react'

import { getForecast } from '@/api/openMeteo'
import type { NormalizedForecast } from '@/api/types'
import { WeatherApiError } from '@/api/types'
import { logger } from '@/lib/logger'
import type { WeatherCity } from './useWeather'

const CACHE_KEY = 'weather-app:last-forecast'
const FRESH_MS = 15 * 60 * 1000
const GENERIC_ERROR = "Couldn't load."

interface CacheEntry {
  key: string
  forecast: NormalizedForecast
  fetchedAt: string
}

interface CacheStore {
  entries: CacheEntry[]
}

interface HookState {
  data: NormalizedForecast | null
  loading: boolean
  refreshing: boolean
  isStale: boolean
  staleSince: string | null
  error: string | null
}

export type UseCityWeatherResult = HookState

const EMPTY_STATE: HookState = {
  data: null,
  loading: false,
  refreshing: false,
  isStale: false,
  staleSince: null,
  error: null,
}

function cacheKeyFor(city: WeatherCity): string {
  return `${city.lat.toFixed(3)},${city.lng.toFixed(3)}`
}

function readStore(): CacheStore {
  if (typeof window === 'undefined') return { entries: [] }
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (raw === null) return { entries: [] }
    const parsed = JSON.parse(raw) as CacheStore
    if (!parsed || !Array.isArray(parsed.entries)) return { entries: [] }
    return parsed
  } catch (err) {
    logger.warn('City forecast cache read failed', { error: String(err) })
    return { entries: [] }
  }
}

function readEntry(key: string): CacheEntry | null {
  return readStore().entries.find((e) => e.key === key) ?? null
}

function writeEntry(entry: CacheEntry): void {
  if (typeof window === 'undefined') return
  const store = readStore()
  const filtered = store.entries.filter((e) => e.key !== entry.key)
  const next: CacheStore = { entries: [entry, ...filtered].slice(0, 15) }
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(next))
  } catch (err) {
    logger.warn('City forecast cache write failed', { error: String(err) })
  }
}

function isFresh(fetchedAt: string): boolean {
  const t = new Date(fetchedAt).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t < FRESH_MS
}

function initialStateFor(city: WeatherCity | null): HookState {
  if (!city) return EMPTY_STATE
  const cached = readEntry(cacheKeyFor(city))
  if (!cached) {
    return { ...EMPTY_STATE, loading: true }
  }
  const fresh = isFresh(cached.fetchedAt)
  return {
    data: cached.forecast,
    loading: false,
    refreshing: !fresh,
    isStale: false,
    staleSince: cached.fetchedAt,
    error: null,
  }
}

export function useCityWeather(city: WeatherCity | null): UseCityWeatherResult {
  const [state, setState] = useState<HookState>(() => initialStateFor(city))
  const cityRef = useRef<WeatherCity | null>(city)
  const abortRef = useRef<AbortController | null>(null)
  const firstRunRef = useRef<boolean>(true)

  useEffect(() => {
    let cancelled = false

    if (!city) {
      abortRef.current?.abort()
      abortRef.current = null
      cityRef.current = null
      const wasFirstRun = firstRunRef.current
      firstRunRef.current = false
      if (!wasFirstRun) {
        Promise.resolve().then(() => {
          if (cancelled) return
          setState(EMPTY_STATE)
        })
      }
      return () => {
        cancelled = true
      }
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const key = cacheKeyFor(city)
    const cityChanged = cityRef.current !== city
    cityRef.current = city
    const cached = readEntry(key)
    const wasFirstRun = firstRunRef.current
    firstRunRef.current = false

    if (!wasFirstRun && cityChanged) {
      const nextInitial: HookState = cached
        ? {
            data: cached.forecast,
            loading: false,
            refreshing: !isFresh(cached.fetchedAt),
            isStale: false,
            staleSince: cached.fetchedAt,
            error: null,
          }
        : { ...EMPTY_STATE, loading: true }
      Promise.resolve().then(() => {
        if (cancelled || controller.signal.aborted) return
        setState(nextInitial)
      })
    }

    const shouldFetch = !cached || !isFresh(cached.fetchedAt)
    if (!shouldFetch) {
      return () => {
        cancelled = true
        controller.abort()
      }
    }

    getForecast({
      lat: city.lat,
      lng: city.lng,
      timezone: city.timezone,
      locationName: city.name,
      countryName: city.country,
    })
      .then((result) => {
        if (cancelled || controller.signal.aborted) return
        setState({
          data: result,
          loading: false,
          refreshing: false,
          isStale: false,
          staleSince: new Date().toISOString(),
          error: null,
        })
        writeEntry({ key, forecast: result, fetchedAt: new Date().toISOString() })
      })
      .catch((err: unknown) => {
        if (cancelled || controller.signal.aborted) return
        const message = err instanceof WeatherApiError ? err.message : GENERIC_ERROR
        if (cached) {
          setState((prev) => ({
            ...prev,
            data: prev.data ?? cached.forecast,
            loading: false,
            refreshing: false,
            isStale: true,
            staleSince: prev.staleSince ?? cached.fetchedAt,
            error: null,
          }))
        } else {
          setState({
            data: null,
            loading: false,
            refreshing: false,
            isStale: false,
            staleSince: null,
            error: message,
          })
        }
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [city])

  return state
}
