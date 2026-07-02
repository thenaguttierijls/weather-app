import { useEffect, useState } from 'react'

import { getCityThumbnail } from '@/api/wikipedia'
import { logger } from '@/lib/logger'

export interface UseCityImageResult {
  url: string | null
  loading: boolean
}

export function useCityImage(cityName: string | null | undefined): UseCityImageResult {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false

    if (!cityName) {
      // Defer state resets to a microtask so we don't set state during render.
      Promise.resolve().then(() => {
        if (cancelled) return
        setUrl(null)
        setLoading(false)
      })
      return () => {
        cancelled = true
      }
    }

    Promise.resolve().then(() => {
      if (cancelled) return
      setLoading(true)
    })

    getCityThumbnail(cityName)
      .then((result) => {
        if (cancelled) return
        setUrl(result)
        setLoading(false)
      })
      .catch((err: unknown) => {
        // getCityThumbnail is designed not to throw; belt-and-braces log.
        if (cancelled) return
        logger.warn('useCityImage fetch threw unexpectedly', { error: String(err) })
        setUrl(null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cityName])

  return { url, loading }
}
