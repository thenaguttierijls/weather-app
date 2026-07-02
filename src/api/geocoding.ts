import { logger } from '@/lib/logger'
import type { GeoResult } from './types'
import { WeatherApiError } from './types'

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'

interface RawGeoResponse {
  results?: GeoResult[]
}

async function fetchGeo(query: string, count: number): Promise<GeoResult[]> {
  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const params = new URLSearchParams({
    name: trimmed,
    count: String(count),
    language: 'en',
    format: 'json',
  })

  const url = `${GEO_URL}?${params.toString()}`

  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    logger.error('Geocoding fetch failed', { url, error: String(err) })
    throw new WeatherApiError("We couldn't search for that city. Check your connection and try again.")
  }

  if (!response.ok) {
    logger.error('Geocoding fetch returned non-OK', { url, status: response.status })
    throw new WeatherApiError(
      "The city search isn't responding. Give it a moment and try again.",
      response.status
    )
  }

  let raw: RawGeoResponse
  try {
    raw = (await response.json()) as RawGeoResponse
  } catch (err) {
    logger.error('Geocoding response parse failed', { url, error: String(err) })
    throw new WeatherApiError("We couldn't read the city search results. Try again in a moment.")
  }

  return raw.results ?? []
}

export async function searchCities(query: string): Promise<GeoResult[]> {
  return fetchGeo(query, 5)
}

export async function getCityByName(name: string): Promise<GeoResult | null> {
  const results = await fetchGeo(name, 1)
  return results[0] ?? null
}
