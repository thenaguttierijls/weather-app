import { Clock } from 'lucide-react'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { WeatherIcon } from '@/components/WeatherIcon'
import { formatTemp, formatTime } from '@/lib/formatters'
import type { TempUnit } from '@/lib/formatters'
import { useUnitStore } from '@/stores/useUnitStore'

interface HourlyTileProps {
  forecast: NormalizedForecast
  className?: string
}

function unitToTemp(unit: 'metric' | 'imperial'): TempUnit {
  return unit === 'imperial' ? 'F' : 'C'
}

export function HourlyTile({ forecast, className }: HourlyTileProps) {
  const unit = useUnitStore((state) => state.unit)
  const tempUnit = unitToTemp(unit)
  const timezone = forecast.location.timezone
  const now = new Date()
  const upcoming = forecast.hourly
    .filter((entry) => {
      const t = new Date(entry.time)
      return !Number.isNaN(t.getTime()) && t.getTime() >= now.getTime() - 60 * 60 * 1000
    })
    .slice(0, 12)

  const rows = upcoming.length > 0 ? upcoming : forecast.hourly.slice(0, 12)

  return (
    <Tile title="Next 12 hours" icon={Clock} ariaLabel="Hourly forecast" className={className}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hourly data unavailable.</p>
      ) : (
        <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 py-1 snap-x">
          {rows.map((entry) => (
            <li
              key={entry.time}
              className="flex min-w-[64px] shrink-0 snap-start flex-col items-center gap-1 rounded-xl bg-background/40 px-2 py-2"
            >
              <span className="text-xs text-muted-foreground">
                {formatTime(entry.time, timezone)}
              </span>
              <WeatherIcon code={entry.weatherCode} isDay={true} size={32} />
              <span className="text-sm font-medium">
                {Number.isFinite(entry.tempC) ? formatTemp(entry.tempC, tempUnit) : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  )
}
