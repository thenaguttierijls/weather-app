import { Droplets } from 'lucide-react'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { formatHumidity } from '@/lib/formatters'

interface HumidityTileProps {
  forecast: NormalizedForecast
  className?: string
}

function describeHumidity(pct: number): string {
  if (!Number.isFinite(pct)) return 'Humidity data unavailable.'
  if (pct < 30) return 'Dry air.'
  if (pct <= 60) return 'Comfortable.'
  return 'Muggy.'
}

export function HumidityTile({ forecast, className }: HumidityTileProps) {
  const { humidity } = forecast.current
  const big = Number.isFinite(humidity) ? formatHumidity(humidity) : '—'
  const detail = describeHumidity(humidity)

  return (
    <Tile title="Humidity" icon={Droplets} ariaLabel="Current humidity" className={className}>
      <div className="text-4xl font-light tabular-nums">{big}</div>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </Tile>
  )
}
