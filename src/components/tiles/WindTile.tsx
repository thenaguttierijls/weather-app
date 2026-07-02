import { Wind } from 'lucide-react'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { formatWind, windDirectionLabel } from '@/lib/formatters'
import type { SpeedUnit } from '@/lib/formatters'
import { useUnitStore } from '@/stores/useUnitStore'

interface WindTileProps {
  forecast: NormalizedForecast
  className?: string
}

const CARDINALS: Array<{ label: string; angle: number }> = [
  { label: 'N', angle: 0 },
  { label: 'E', angle: 90 },
  { label: 'S', angle: 180 },
  { label: 'W', angle: 270 },
]

const SIZE = 150
const CENTER = SIZE / 2
const RING_RADIUS = CENTER - 10
const LABEL_RADIUS = CENTER - 2

function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  }
}

export function WindTile({ forecast, className }: WindTileProps) {
  const unit = useUnitStore((state) => state.unit) as SpeedUnit
  const { windKph, windDir } = forecast.current
  const hasSpeed = Number.isFinite(windKph)
  const hasDir = Number.isFinite(windDir)
  const speed = hasSpeed ? formatWind(windKph, unit) : '—'
  const direction = hasDir ? windDirectionLabel(windDir) : '—'
  const rotation = hasDir ? ((windDir % 360) + 360) % 360 : 0
  const ariaLabel = hasSpeed && hasDir
    ? `Wind ${speed} from ${direction}`
    : 'Wind data unavailable'

  return (
    <Tile title="Wind" icon={Wind} ariaLabel="Current wind">
      <div className={className}>
        <div className="flex flex-col items-center justify-center">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width={SIZE}
            height={SIZE}
            role="img"
            aria-label={ariaLabel}
            className="text-primary"
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RING_RADIUS}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
            {CARDINALS.map(({ label, angle }) => {
              const { x, y } = polar(angle, LABEL_RADIUS - 8)
              return (
                <text
                  key={label}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="hsl(var(--muted-foreground))"
                >
                  {label}
                </text>
              )
            })}
            <g
              data-testid="wind-needle"
              transform={`rotate(${rotation} ${CENTER} ${CENTER})`}
              fill="currentColor"
            >
              <polygon
                points={`${CENTER},${CENTER - RING_RADIUS + 8} ${CENTER - 5},${CENTER} ${CENTER + 5},${CENTER}`}
              />
            </g>
          </svg>
          <div className="mt-2 text-center">
            <div className="text-2xl font-light tabular-nums text-foreground">{speed}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {hasDir ? direction : 'unavailable'}
            </div>
          </div>
        </div>
      </div>
    </Tile>
  )
}
