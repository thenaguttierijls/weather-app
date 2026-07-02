import { logger } from '@/lib/logger'

const SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary'

interface WikipediaSummary {
  thumbnail?: {
    source: string
  }
}

// Thumbnails are decorative garnish, not app data. Any failure -> null, never throw:
// a missing city image should not surface an error to the user.
export async function getCityThumbnail(cityName: string): Promise<string | null> {
  const url = `${SUMMARY_URL}/${encodeURIComponent(cityName)}`

  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    logger.warn('Wikipedia thumbnail fetch failed', { url, error: String(err) })
    return null
  }

  if (!response.ok) {
    logger.warn('Wikipedia thumbnail returned non-OK', { url, status: response.status })
    return null
  }

  let raw: WikipediaSummary
  try {
    raw = (await response.json()) as WikipediaSummary
  } catch (err) {
    logger.warn('Wikipedia thumbnail parse failed', { url, error: String(err) })
    return null
  }

  return raw.thumbnail?.source ?? null
}
