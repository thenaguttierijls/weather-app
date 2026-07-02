import { CloudRain } from 'lucide-react'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { formatPercent } from '@/lib/formatters'

interface PrecipTileProps {
  forecast: NormalizedForecast
  className?: string
}

function describeRecent(mm: number | undefined | null): string {
  if (mm === null || mm === undefined || !Number.isFinite(mm) || mm <= 0) {
    return 'No precipitation right now.'
  }
  const display = mm < 0.1 ? mm.toFixed(2) : mm.toFixed(1)
  return `${display} mm in the last hour.`
}

export function PrecipTile({ forecast, className }: PrecipTileProps) {
  const today = forecast.daily[0]
  const chance = today && Number.isFinite(today.precipProbability)
    ? formatPercent(today.precipProbability)
    : '—'
  const detail = describeRecent(forecast.current.precip)

  return (
    <Tile title="Precipitation" icon={CloudRain} ariaLabel="Chance of precipitation today" className={className}>
      <div className="text-4xl font-light tabular-nums">{chance}</div>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </Tile>
  )
}
