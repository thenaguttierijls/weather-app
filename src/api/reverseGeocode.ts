import { logger } from '@/lib/logger'

const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

export interface ReverseGeoResult {
  name: string
  country: string
  lat: number
  lng: number
  timezone?: string
}

interface RawReverseResponse {
  city?: string
  locality?: string
  principalSubdivision?: string
  countryName?: string
  countryCode?: string
}

function pickCityName(raw: RawReverseResponse): string {
  const candidates = [raw.city, raw.locality, raw.principalSubdivision]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }
  return ''
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeoResult | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    localityLanguage: 'en',
  })

  const url = `${REVERSE_URL}?${params.toString()}`

  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    logger.warn('Reverse geocode fetch failed', { url, error: String(err) })
    return null
  }

  if (!response.ok) {
    logger.warn('Reverse geocode returned non-OK', { url, status: response.status })
    return null
  }

  let raw: RawReverseResponse
  try {
    raw = (await response.json()) as RawReverseResponse
  } catch (err) {
    logger.warn('Reverse geocode parse failed', { url, error: String(err) })
    return null
  }

  const name = pickCityName(raw)
  if (name.length === 0) {
    logger.warn('Reverse geocode had no city name', { url })
    return null
  }

  const country =
    typeof raw.countryName === 'string' && raw.countryName.trim().length > 0
      ? raw.countryName.trim()
      : ''

  return {
    name,
    country,
    lat,
    lng,
  }
}
