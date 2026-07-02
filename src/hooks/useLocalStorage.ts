import { useCallback, useEffect, useState } from 'react'

import { logger } from '@/lib/logger'

function readValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') return initialValue
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return initialValue
    return JSON.parse(raw) as T
  } catch (err) {
    logger.warn('useLocalStorage read failed', { key, error: String(err) })
    return initialValue
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [value, setStateValue] = useState<T>(() => readValue(key, initialValue))

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      setStateValue(readValue(key, initialValue))
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const setValue = useCallback(
    (next: T) => {
      setStateValue(next)
      if (typeof window === 'undefined') return
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch (err) {
        logger.warn('useLocalStorage write failed', { key, error: String(err) })
      }
    },
    [key]
  )

  return [value, setValue]
}
