import type { NormalizedMinutely15Entry } from '@/api/types'

export type NowcastStatus = 'raining' | 'rain-soon' | 'clear' | 'unknown'
export type NowcastIntensity = 'light' | 'moderate' | 'heavy'

export interface NowcastSummary {
  status: NowcastStatus
  minutesUntilRain?: number
  intensity?: NowcastIntensity
}

const RAIN_THRESHOLD = 0.1
const HORIZON_MS = 60 * 60 * 1000
const SLOT_MS = 15 * 60 * 1000

function intensityFor(precipPerHour: number): NowcastIntensity {
  if (precipPerHour < 2) return 'light'
  if (precipPerHour < 8) return 'moderate'
  return 'heavy'
}

export function computeNowcast(
  minutely15: NormalizedMinutely15Entry[],
  now: number
): NowcastSummary {
  if (!minutely15 || minutely15.length === 0) return { status: 'unknown' }

  const horizon = now + HORIZON_MS
  const slots = minutely15
    .map((e) => ({ ...e, ts: new Date(e.time).getTime() }))
    .filter((e) => !Number.isNaN(e.ts) && e.ts >= now - SLOT_MS && e.ts <= horizon)
    .sort((a, b) => a.ts - b.ts)

  if (slots.length === 0) return { status: 'unknown' }

  const currentSlot = [...slots].reverse().find((s) => s.ts <= now)
  const currentlyRaining = !!currentSlot && currentSlot.precip >= RAIN_THRESHOLD
  const upcomingRainy = slots.find((s) => s.ts > now && s.precip >= RAIN_THRESHOLD)
  const maxPrecip = slots.reduce((max, s) => Math.max(max, s.precip), 0)
  const perHour = maxPrecip * 4

  if (currentlyRaining) {
    return { status: 'raining', intensity: intensityFor(perHour) }
  }
  if (upcomingRainy) {
    const minutesUntilRain = Math.max(0, Math.round((upcomingRainy.ts - now) / 60_000))
    return { status: 'rain-soon', minutesUntilRain, intensity: intensityFor(perHour) }
  }
  return { status: 'clear' }
}
