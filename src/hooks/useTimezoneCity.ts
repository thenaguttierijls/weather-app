import { useMemo } from 'react'

export interface DefaultCity {
  name: string
  country: string
  lat: number
  lng: number
  timezone: string
}

const FALLBACK: DefaultCity = {
  name: 'Chicago',
  country: 'United States',
  lat: 41.8781,
  lng: -87.6298,
  timezone: 'America/Chicago',
}

const TIMEZONE_CITIES: Record<string, DefaultCity> = {
  'America/Chicago': { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298, timezone: 'America/Chicago' },
  'America/Los_Angeles': { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles' },
  'America/New_York': { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006, timezone: 'America/New_York' },
  'America/Denver': { name: 'Denver', country: 'United States', lat: 39.7392, lng: -104.9903, timezone: 'America/Denver' },
  'America/Phoenix': { name: 'Phoenix', country: 'United States', lat: 33.4484, lng: -112.074, timezone: 'America/Phoenix' },
  'America/Anchorage': { name: 'Anchorage', country: 'United States', lat: 61.2181, lng: -149.9003, timezone: 'America/Anchorage' },
  'Pacific/Honolulu': { name: 'Honolulu', country: 'United States', lat: 21.3069, lng: -157.8583, timezone: 'Pacific/Honolulu' },
  'America/Toronto': { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, timezone: 'America/Toronto' },
  'America/Vancouver': { name: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207, timezone: 'America/Vancouver' },
  'America/Mexico_City': { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332, timezone: 'America/Mexico_City' },
  'America/Sao_Paulo': { name: 'Sao Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, timezone: 'America/Sao_Paulo' },
  'America/Buenos_Aires': { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816, timezone: 'America/Buenos_Aires' },
  'America/Argentina/Buenos_Aires': { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816, timezone: 'America/Argentina/Buenos_Aires' },
  'Europe/London': { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
  'Europe/Paris': { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris' },
  'Europe/Berlin': { name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405, timezone: 'Europe/Berlin' },
  'Europe/Madrid': { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038, timezone: 'Europe/Madrid' },
  'Europe/Rome': { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964, timezone: 'Europe/Rome' },
  'Europe/Amsterdam': { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041, timezone: 'Europe/Amsterdam' },
  'Europe/Warsaw': { name: 'Warsaw', country: 'Poland', lat: 52.2297, lng: 21.0122, timezone: 'Europe/Warsaw' },
  'Europe/Moscow': { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173, timezone: 'Europe/Moscow' },
  'Europe/Istanbul': { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, timezone: 'Europe/Istanbul' },
  'Europe/Athens': { name: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275, timezone: 'Europe/Athens' },
  'Europe/Dublin': { name: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603, timezone: 'Europe/Dublin' },
  'Europe/Stockholm': { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686, timezone: 'Europe/Stockholm' },
  'Europe/Helsinki': { name: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384, timezone: 'Europe/Helsinki' },
  'Asia/Tokyo': { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo' },
  'Asia/Shanghai': { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737, timezone: 'Asia/Shanghai' },
  'Asia/Hong_Kong': { name: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694, timezone: 'Asia/Hong_Kong' },
  'Asia/Singapore': { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, timezone: 'Asia/Singapore' },
  'Asia/Seoul': { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978, timezone: 'Asia/Seoul' },
  'Asia/Bangkok': { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, timezone: 'Asia/Bangkok' },
  'Asia/Kolkata': { name: 'Kolkata', country: 'India', lat: 22.5726, lng: 88.3639, timezone: 'Asia/Kolkata' },
  'Asia/Dubai': { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708, timezone: 'Asia/Dubai' },
  'Asia/Jakarta': { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, timezone: 'Asia/Jakarta' },
  'Asia/Manila': { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842, timezone: 'Asia/Manila' },
  'Asia/Kuala_Lumpur': { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lng: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  'Asia/Ho_Chi_Minh': { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lng: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
  'Australia/Sydney': { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney' },
  'Australia/Melbourne': { name: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631, timezone: 'Australia/Melbourne' },
  'Australia/Perth': { name: 'Perth', country: 'Australia', lat: -31.9505, lng: 115.8605, timezone: 'Australia/Perth' },
  'Pacific/Auckland': { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lng: 174.7633, timezone: 'Pacific/Auckland' },
  'Africa/Lagos': { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, timezone: 'Africa/Lagos' },
  'Africa/Cairo': { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, timezone: 'Africa/Cairo' },
  'Africa/Johannesburg': { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473, timezone: 'Africa/Johannesburg' },
  'Africa/Nairobi': { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219, timezone: 'Africa/Nairobi' },
}

export function defaultCityForTimezone(tz: string): DefaultCity {
  return TIMEZONE_CITIES[tz] ?? FALLBACK
}

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/Chicago'
  }
}

export function useTimezoneCity(): DefaultCity {
  return useMemo(() => defaultCityForTimezone(detectTimezone()), [])
}
