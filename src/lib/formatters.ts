export type TempUnit = 'C' | 'F'
export type SpeedUnit = 'metric' | 'imperial'

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32
}

export function formatTemp(celsius: number, unit: TempUnit): string {
  const value = unit === 'F' ? celsiusToFahrenheit(celsius) : celsius
  return `${Math.round(value)}°${unit}`
}

export function formatWind(kph: number, unit: SpeedUnit): string {
  if (unit === 'imperial') {
    const mph = kph * 0.621371
    return `${Math.round(mph)} mph`
  }
  return `${Math.round(kph)} kph`
}

export function formatHumidity(pct: number): string {
  return `${Math.round(pct)}%`
}

export function formatPercent(pct: number): string {
  return `${Math.round(pct)}%`
}

export function formatTime(isoOrHour: string, timezone: string): string {
  const date = new Date(isoOrHour)
  if (Number.isNaN(date.getTime())) return isoOrHour
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: true,
    timeZone: timezone,
  }).format(date)
}

export function formatLocalTime(iso: string, timezone: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(date)
}

export function formatWeekday(iso: string, timezone: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: timezone,
  }).format(date)
}

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return 'just now'
  const diffMs = now.getTime() - then.getTime()
  if (diffMs < 60_000) return 'just now'
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  }
  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }
  const days = Math.round(hours / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}

const WIND_DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW',
] as const

export function windDirectionLabel(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360
  const index = Math.round(normalized / 22.5) % 16
  return WIND_DIRECTIONS[index]!
}
