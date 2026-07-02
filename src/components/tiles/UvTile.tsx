import { Sun } from 'lucide-react'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'

interface UvTileProps {
  forecast: NormalizedForecast
  className?: string
}

function uvCategory(uv: number): string {
  if (uv >= 11) return 'Extreme'
  if (uv >= 8) return 'Very high'
  if (uv >= 6) return 'High'
  if (uv >= 3) return 'Moderate'
  return 'Low'
}

export function UvTile({ forecast, className }: UvTileProps) {
  const raw = forecast.current.uv
  const has = raw !== null && raw !== undefined && Number.isFinite(raw)
  const rounded = has ? Math.round(raw) : null
  const big = rounded === null ? '—' : String(rounded)
  const detail = rounded === null ? 'UV index unavailable.' : uvCategory(rounded)

  return (
    <Tile title="UV index" icon={Sun} ariaLabel="Ultraviolet index" className={className}>
      <div className="text-4xl font-light tabular-nums">{big}</div>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </Tile>
  )
}
