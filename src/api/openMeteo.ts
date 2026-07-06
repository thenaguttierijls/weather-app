import { logger } from '@/lib/logger'
import type {
  NormalizedDailyEntry,
  NormalizedForecast,
  NormalizedHourlyEntry,
  NormalizedMinutely15Entry,
  OpenMeteoDaily,
  OpenMeteoForecast,
  OpenMeteoHourly,
  OpenMeteoMinutely15,
} from './types'
import { WeatherApiError } from './types'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

const CURRENT_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'wind_speed_10m',
  'wind_direction_10m',
  'weather_code',
  'is_day',
  'precipitation',
].join(',')

const HOURLY_FIELDS = [
  'temperature_2m',
  'weather_code',
  'precipitation_probability',
].join(',')

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'uv_index_max',
  'precipitation_probability_max',
].join(',')

const MINUTELY_15_FIELDS = ['precipitation'].join(',')

interface GetForecastArgs {
  lat: number
  lng: number
  timezone: string
  locationName?: string
  countryName?: string
}

export async function getForecast({
  lat,
  lng,
  timezone,
  locationName,
  countryName,
}: GetForecastArgs): Promise<NormalizedForecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: CURRENT_FIELDS,
    hourly: HOURLY_FIELDS,
    daily: DAILY_FIELDS,
    minutely_15: MINUTELY_15_FIELDS,
    forecast_minutely_15: '96',
    wind_speed_unit: 'kmh',
    timezone,
    forecast_days: '7',
  })

  const url = `${FORECAST_URL}?${params.toString()}`

  let response: Response
  try {
    response = await fetch(url)
  } catch (err) {
    logger.error('Weather fetch failed', { url, error: String(err) })
    throw new WeatherApiError("We couldn't reach the weather service. Check your connection and try again.")
  }

  if (!response.ok) {
    logger.error('Weather fetch returned non-OK', { url, status: response.status })
    throw new WeatherApiError(
      "The weather service didn't respond as expected. Give it a moment and try again.",
      response.status
    )
  }

  let raw: OpenMeteoForecast
  try {
    raw = (await response.json()) as OpenMeteoForecast
  } catch (err) {
    logger.error('Weather response parse failed', { url, error: String(err) })
    throw new WeatherApiError("We couldn't read the weather data. Try again in a moment.")
  }

  if (!raw?.current || !raw?.hourly || !raw?.daily) {
    logger.error('Weather response missing fields', { url })
    throw new WeatherApiError("The weather data came back incomplete. Try again in a moment.")
  }

  return normalize(raw, { locationName, countryName })
}

function normalize(
  raw: OpenMeteoForecast,
  meta: { locationName?: string; countryName?: string }
): NormalizedForecast {
  return {
    location: {
      name: meta.locationName ?? '',
      country: meta.countryName ?? '',
      timezone: raw.timezone,
      lat: raw.latitude,
      lng: raw.longitude,
    },
    current: {
      tempC: raw.current.temperature_2m,
      apparentC: raw.current.apparent_temperature,
      humidity: raw.current.relative_humidity_2m,
      windKph: raw.current.wind_speed_10m,
      windDir: raw.current.wind_direction_10m,
      weatherCode: raw.current.weather_code,
      isDay: raw.current.is_day === 1,
      precip: raw.current.precipitation,
      uv: raw.daily.uv_index_max?.[0] ?? null,
    },
    hourly: buildHourly(raw.hourly),
    daily: buildDaily(raw.daily),
    minutely15: raw.minutely_15 ? buildMinutely15(raw.minutely_15) : [],
  }
}

function buildMinutely15(m: OpenMeteoMinutely15): NormalizedMinutely15Entry[] {
  const len = Math.min(m.time.length, 96)
  const out: NormalizedMinutely15Entry[] = []
  for (let i = 0; i < len; i++) {
    out.push({
      time: m.time[i]!,
      precip: m.precipitation[i] ?? 0,
    })
  }
  return out
}

function buildHourly(h: OpenMeteoHourly): NormalizedHourlyEntry[] {
  const len = Math.min(h.time.length, 48)
  const out: NormalizedHourlyEntry[] = []
  for (let i = 0; i < len; i++) {
    out.push({
      time: h.time[i]!,
      tempC: h.temperature_2m[i] ?? 0,
      weatherCode: h.weather_code[i] ?? 0,
      precipProbability: h.precipitation_probability[i] ?? 0,
    })
  }
  return out
}

function buildDaily(d: OpenMeteoDaily): NormalizedDailyEntry[] {
  const len = d.time.length
  const out: NormalizedDailyEntry[] = []
  for (let i = 0; i < len; i++) {
    out.push({
      date: d.time[i]!,
      weatherCode: d.weather_code[i] ?? 0,
      tempMaxC: d.temperature_2m_max[i] ?? 0,
      tempMinC: d.temperature_2m_min[i] ?? 0,
      sunrise: d.sunrise[i] ?? '',
      sunset: d.sunset[i] ?? '',
      uvMax: d.uv_index_max[i] ?? 0,
      precipProbability: d.precipitation_probability_max[i] ?? 0,
    })
  }
  return out
}
