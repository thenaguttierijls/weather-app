export interface OpenMeteoCurrent {
  time: string
  temperature_2m: number
  apparent_temperature: number
  relative_humidity_2m: number
  wind_speed_10m: number
  wind_direction_10m: number
  weather_code: number
  is_day: number
  precipitation: number
}

export interface OpenMeteoHourly {
  time: string[]
  temperature_2m: number[]
  weather_code: number[]
  precipitation_probability: number[]
}

export interface OpenMeteoDaily {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  sunrise: string[]
  sunset: string[]
  uv_index_max: number[]
  precipitation_probability_max: number[]
}

export interface OpenMeteoForecast {
  latitude: number
  longitude: number
  timezone: string
  current: OpenMeteoCurrent
  hourly: OpenMeteoHourly
  daily: OpenMeteoDaily
}

export interface GeoResult {
  id: number
  name: string
  country: string
  latitude: number
  longitude: number
  admin1?: string
  timezone: string
}

export interface NormalizedLocation {
  name: string
  country: string
  timezone: string
  lat: number
  lng: number
}

export interface NormalizedCurrent {
  tempC: number
  apparentC: number
  humidity: number
  windKph: number
  windDir: number
  weatherCode: number
  isDay: boolean
  precip: number
  uv: number | null
}

export interface NormalizedHourlyEntry {
  time: string
  tempC: number
  weatherCode: number
  precipProbability: number
}

export interface NormalizedDailyEntry {
  date: string
  weatherCode: number
  tempMaxC: number
  tempMinC: number
  sunrise: string
  sunset: string
  uvMax: number
  precipProbability: number
}

export interface NormalizedForecast {
  location: NormalizedLocation
  current: NormalizedCurrent
  hourly: NormalizedHourlyEntry[]
  daily: NormalizedDailyEntry[]
}

export class WeatherApiError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'WeatherApiError'
    this.status = status
  }
}
