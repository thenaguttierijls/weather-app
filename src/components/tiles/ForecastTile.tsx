import { CalendarDays } from 'lucide-react'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { WeatherIcon } from '@/components/WeatherIcon'
import { formatTemp, formatWeekday } from '@/lib/formatters'
import type { TempUnit } from '@/lib/formatters'
import { useUnitStore } from '@/stores/useUnitStore'

interface ForecastTileProps {
  forecast: NormalizedForecast
  className?: string
}

function unitToTemp(unit: 'metric' | 'imperial'): TempUnit {
  return unit === 'imperial' ? 'F' : 'C'
}

export function ForecastTile({ forecast, className }: ForecastTileProps) {
  const unit = useUnitStore((state) => state.unit)
  const tempUnit = unitToTemp(unit)
  const timezone = forecast.location.timezone
  const days = forecast.daily.slice(0, 5)

  return (
    <Tile title="5-day outlook" icon={CalendarDays} ariaLabel="Five-day forecast" className={className}>
      {days.length === 0 ? (
        <p className="text-sm text-muted-foreground">Daily data unavailable.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {days.map((day) => {
            const high = Number.isFinite(day.tempMaxC) ? formatTemp(day.tempMaxC, tempUnit) : '—'
            const low = Number.isFinite(day.tempMinC) ? formatTemp(day.tempMinC, tempUnit) : '—'
            return (
              <li
                key={day.date}
                className="flex items-center justify-between gap-2 rounded-lg py-1"
              >
                <span className="w-12 text-sm font-medium">
                  {formatWeekday(day.date, timezone)}
                </span>
                <WeatherIcon code={day.weatherCode} isDay={true} size={28} />
                <span className="flex-1 text-right text-sm tabular-nums text-muted-foreground">
                  <span className="text-foreground">{high}</span>
                  <span className="mx-1">·</span>
                  <span>{low}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Tile>
  )
}
