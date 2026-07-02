import { Thermometer } from 'lucide-react'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { formatTemp } from '@/lib/formatters'
import type { TempUnit } from '@/lib/formatters'
import { useUnitStore } from '@/stores/useUnitStore'

interface FeelsLikeTileProps {
  forecast: NormalizedForecast
  className?: string
}

function unitToTemp(unit: 'metric' | 'imperial'): TempUnit {
  return unit === 'imperial' ? 'F' : 'C'
}

function describeFeelsLike(actualC: number, apparentC: number, unit: TempUnit): string {
  if (!Number.isFinite(actualC) || !Number.isFinite(apparentC)) {
    return 'Feels-like data unavailable.'
  }
  const diffC = apparentC - actualC
  if (Math.abs(diffC) < 2) return 'Close to the actual temperature.'
  const diffInUnit = unit === 'F' ? (diffC * 9) / 5 : diffC
  const displayDiff = Math.round(Math.abs(diffInUnit))
  const unitLabel = unit === 'F' ? '°F' : '°C'
  if (diffC <= -2) return `Wind chill drops it about ${displayDiff}${unitLabel}.`
  return `Humidity pushes it up about ${displayDiff}${unitLabel}.`
}

export function FeelsLikeTile({ forecast, className }: FeelsLikeTileProps) {
  const unit = useUnitStore((state) => state.unit)
  const tempUnit = unitToTemp(unit)
  const { tempC, apparentC } = forecast.current
  const big = Number.isFinite(apparentC) ? formatTemp(apparentC, tempUnit) : '—'
  const detail = describeFeelsLike(tempC, apparentC, tempUnit)

  return (
    <Tile title="Feels like" icon={Thermometer} ariaLabel="Feels-like temperature" className={className}>
      <div className="text-4xl font-light tabular-nums">{big}</div>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </Tile>
  )
}
