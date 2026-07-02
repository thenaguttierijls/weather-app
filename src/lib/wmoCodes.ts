export interface WmoInfo {
  label: string
  iconKey: string
  isRainy?: boolean
  isSnowy?: boolean
  isSunny?: boolean
  isCloudy?: boolean
  isStormy?: boolean
}

interface WmoEntry {
  label: string
  dayIcon: string
  nightIcon: string
  isRainy?: boolean
  isSnowy?: boolean
  isSunny?: boolean
  isCloudy?: boolean
  isStormy?: boolean
}

const WMO_MAP: Record<number, WmoEntry> = {
  0: { label: 'Clear sky', dayIcon: 'clear-day', nightIcon: 'clear-night', isSunny: true },
  1: { label: 'Mainly clear', dayIcon: 'partly-cloudy-day', nightIcon: 'partly-cloudy-night', isSunny: true },
  2: { label: 'Partly cloudy', dayIcon: 'partly-cloudy-day', nightIcon: 'partly-cloudy-night', isCloudy: true },
  3: { label: 'Overcast', dayIcon: 'cloudy', nightIcon: 'cloudy', isCloudy: true },
  45: { label: 'Fog', dayIcon: 'fog-day', nightIcon: 'fog-night', isCloudy: true },
  48: { label: 'Icy fog', dayIcon: 'fog-day', nightIcon: 'fog-night', isCloudy: true },
  51: { label: 'Light drizzle', dayIcon: 'drizzle', nightIcon: 'drizzle', isRainy: true },
  53: { label: 'Drizzle', dayIcon: 'drizzle', nightIcon: 'drizzle', isRainy: true },
  55: { label: 'Heavy drizzle', dayIcon: 'drizzle', nightIcon: 'drizzle', isRainy: true },
  56: { label: 'Freezing drizzle', dayIcon: 'sleet', nightIcon: 'sleet', isRainy: true, isSnowy: true },
  57: { label: 'Heavy freezing drizzle', dayIcon: 'sleet', nightIcon: 'sleet', isRainy: true, isSnowy: true },
  61: { label: 'Light rain', dayIcon: 'rain', nightIcon: 'rain', isRainy: true },
  63: { label: 'Rain', dayIcon: 'rain', nightIcon: 'rain', isRainy: true },
  65: { label: 'Heavy rain', dayIcon: 'rain', nightIcon: 'rain', isRainy: true },
  66: { label: 'Freezing rain', dayIcon: 'sleet', nightIcon: 'sleet', isRainy: true, isSnowy: true },
  67: { label: 'Heavy freezing rain', dayIcon: 'sleet', nightIcon: 'sleet', isRainy: true, isSnowy: true },
  71: { label: 'Light snow', dayIcon: 'snow', nightIcon: 'snow', isSnowy: true },
  73: { label: 'Snow', dayIcon: 'snow', nightIcon: 'snow', isSnowy: true },
  75: { label: 'Heavy snow', dayIcon: 'snow', nightIcon: 'snow', isSnowy: true },
  77: { label: 'Snow grains', dayIcon: 'snow', nightIcon: 'snow', isSnowy: true },
  80: { label: 'Light showers', dayIcon: 'rain', nightIcon: 'rain', isRainy: true },
  81: { label: 'Showers', dayIcon: 'rain', nightIcon: 'rain', isRainy: true },
  82: { label: 'Heavy showers', dayIcon: 'rain', nightIcon: 'rain', isRainy: true },
  85: { label: 'Light snow showers', dayIcon: 'snow', nightIcon: 'snow', isSnowy: true },
  86: { label: 'Heavy snow showers', dayIcon: 'snow', nightIcon: 'snow', isSnowy: true },
  95: { label: 'Thunderstorm', dayIcon: 'thunderstorms', nightIcon: 'thunderstorms', isStormy: true, isRainy: true },
  96: { label: 'Thunderstorm with hail', dayIcon: 'thunderstorms', nightIcon: 'thunderstorms', isStormy: true, isRainy: true },
  99: { label: 'Severe thunderstorm', dayIcon: 'thunderstorms', nightIcon: 'thunderstorms', isStormy: true, isRainy: true },
}

const UNKNOWN: WmoEntry = {
  label: 'Unknown conditions',
  dayIcon: 'not-available',
  nightIcon: 'not-available',
}

export function getWmoInfo(code: number, isDay: boolean): WmoInfo {
  const entry = WMO_MAP[code] ?? UNKNOWN
  return {
    label: entry.label,
    iconKey: isDay ? entry.dayIcon : entry.nightIcon,
    isRainy: entry.isRainy,
    isSnowy: entry.isSnowy,
    isSunny: entry.isSunny,
    isCloudy: entry.isCloudy,
    isStormy: entry.isStormy,
  }
}

export const WMO_CODES: readonly number[] = Object.freeze(
  Object.keys(WMO_MAP).map((k) => Number(k))
)
