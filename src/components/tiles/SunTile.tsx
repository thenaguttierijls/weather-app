import { Sun, Sunrise, Sunset } from 'lucide-react'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { formatTime } from '@/lib/formatters'

interface SunTileProps {
  forecast: NormalizedForecast
  className?: string
  now?: Date
}

const WIDTH = 200
const HEIGHT = 100
const CENTER_X = WIDTH / 2
const BASELINE_Y = 90
const ARC_RADIUS = 80
const START_X = CENTER_X - ARC_RADIUS
const END_X = CENTER_X + ARC_RADIUS

function computeProgress(now: number, sunrise: number, sunset: number): number {
  if (!Number.isFinite(sunrise) || !Number.isFinite(sunset) || sunset <= sunrise) return 0
  const raw = (now - sunrise) / (sunset - sunrise)
  if (raw < 0) return 0
  if (raw > 1) return 1
  return raw
}

function sunPosition(progress: number): { x: number; y: number } {
  const angle = Math.PI * progress
  return {
    x: CENTER_X - ARC_RADIUS * Math.cos(angle),
    y: BASELINE_Y - ARC_RADIUS * Math.sin(angle),
  }
}

export function SunTile({ forecast, className, now = new Date() }: SunTileProps) {
  const today = forecast.daily[0]
  const timezone = forecast.location.timezone

  if (!today || !today.sunrise || !today.sunset) {
    return (
      <Tile title="Sun" icon={Sun} ariaLabel="Sunrise and sunset" className={className}>
        <p className="text-sm text-muted-foreground">Sun data unavailable.</p>
      </Tile>
    )
  }

  const sunriseMs = new Date(today.sunrise).getTime()
  const sunsetMs = new Date(today.sunset).getTime()
  const progress = computeProgress(now.getTime(), sunriseMs, sunsetMs)
  const { x, y } = sunPosition(progress)
  const sunriseLabel = formatTime(today.sunrise, timezone)
  const sunsetLabel = formatTime(today.sunset, timezone)
  const ariaLabel = `Sunrise ${sunriseLabel}, sunset ${sunsetLabel}`

  return (
    <Tile title="Sun" icon={Sun} ariaLabel="Sunrise and sunset" className={className}>
      <div className="flex flex-col items-center">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          height={HEIGHT}
          role="img"
          aria-label={ariaLabel}
          className="text-primary"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={`M ${START_X} ${BASELINE_Y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${END_X} ${BASELINE_Y}`}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.4}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <line
            x1={START_X - 4}
            y1={BASELINE_Y}
            x2={END_X + 4}
            y2={BASELINE_Y}
            stroke="hsl(var(--border))"
            strokeWidth={1}
          />
          <circle
            data-testid="sun-dot"
            cx={x}
            cy={y}
            r={7}
            fill="currentColor"
            stroke="hsl(var(--background))"
            strokeWidth={2}
          />
        </svg>
        <div className="mt-2 flex w-full items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Sunrise className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">{sunriseLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <Sunset className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">{sunsetLabel}</span>
          </div>
        </div>
      </div>
    </Tile>
  )
}
