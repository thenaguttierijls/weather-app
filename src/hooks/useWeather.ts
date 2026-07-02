import { useCallback, useEffect, useRef, useState } from 'react'

import { getForecast } from '@/api/openMeteo'
import type { NormalizedForecast } from '@/api/types'
import { WeatherApiError } from '@/api/types'

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
}

const GENERIC_ERROR = "Something went sideways loading the weather. Try again in a moment."

export function useWeather(city: WeatherCity | null): UseWeatherResult {
  const [data, setData] = useState<NormalizedForecast | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
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
      })
      return () => {
        cancelled = true
      }
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

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
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled || controller.signal.aborted) return
        const message = err instanceof WeatherApiError ? err.message : GENERIC_ERROR
        setError(message)
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

  return { data, loading, error, refetch }
}
