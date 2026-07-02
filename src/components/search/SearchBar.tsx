import { LoaderCircle, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { searchCities } from '@/api/geocoding'
import type { GeoResult } from '@/api/types'
import { logger } from '@/lib/logger'

interface SearchBarProps {
  onSelect: (result: GeoResult) => void
}

const DEBOUNCE_MS = 250

function toDisplayCountry(result: GeoResult): string {
  if (result.admin1 && result.country) {
    return `${result.admin1}, ${result.country}`
  }
  return result.country
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [loading, setLoading] = useState(false)
  const [ranQuery, setRanQuery] = useState(false)
  const timerRef = useRef<number | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    const trimmed = query.trim()

    if (trimmed.length === 0) {
      Promise.resolve().then(() => {
        if (cancelled) return
        setResults([])
        setLoading(false)
        setRanQuery(false)
      })
      return () => {
        cancelled = true
      }
    }

    const requestId = ++requestIdRef.current
    Promise.resolve().then(() => {
      if (cancelled) return
      setLoading(true)
    })

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      searchCities(trimmed)
        .then((next) => {
          if (cancelled || requestId !== requestIdRef.current) return
          setResults(next)
          setLoading(false)
          setRanQuery(true)
        })
        .catch((err: unknown) => {
          if (cancelled || requestId !== requestIdRef.current) return
          logger.warn('City search failed', { error: String(err) })
          setResults([])
          setLoading(false)
          setRanQuery(true)
        })
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [query])

  const trimmed = query.trim()
  const showEmptyPrompt = trimmed.length === 0
  const showNoResults = !loading && ranQuery && results.length === 0 && trimmed.length > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cities worldwide"
          aria-label="Search cities"
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          autoFocus
        />
        {loading && (
          <LoaderCircle
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      {showEmptyPrompt && (
        <p className="text-sm text-muted-foreground">
          Type a city name to search.
        </p>
      )}

      {showNoResults && (
        <p className="text-sm text-muted-foreground">
          No cities matched — try a different spelling.
        </p>
      )}

      {results.length > 0 && (
        <ul className="flex flex-col gap-1" role="listbox" aria-label="Search results">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => onSelect(result)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-medium">{result.name}</span>
                <span className="text-xs text-muted-foreground">
                  {toDisplayCountry(result)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
