import { Clock, Sunrise, Sunset } from 'lucide-react'

import type { NormalizedDailyEntry, NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { WeatherIcon } from '@/components/WeatherIcon'
import { formatLocalTime, formatTemp, formatTime } from '@/lib/formatters'
import type { TempUnit } from '@/lib/formatters'
import { useUnitStore } from '@/stores/useUnitStore'

interface HourlyTileProps {
  forecast: NormalizedForecast
  className?: string
}

interface SunEvent {
  type: 'sunrise' | 'sunset'
  time: string
}

function unitToTemp(unit: 'metric' | 'imperial'): TempUnit {
  return unit === 'imperial' ? 'F' : 'C'
}

function collectSunEvents(daily: NormalizedDailyEntry[]): SunEvent[] {
  const events: SunEvent[] = []
  for (const day of daily) {
    if (day.sunrise) events.push({ type: 'sunrise', time: day.sunrise })
    if (day.sunset) events.push({ type: 'sunset', time: day.sunset })
  }
  return events
}

function sunEventInHour(hourIso: string, events: SunEvent[]): SunEvent | null {
  const startMs = new Date(hourIso).getTime()
  if (Number.isNaN(startMs)) return null
  const endMs = startMs + 60 * 60 * 1000
  return (
    events.find((ev) => {
      const t = new Date(ev.time).getTime()
      return !Number.isNaN(t) && t >= startMs && t < endMs
    }) ?? null
  )
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
  const sunEvents = collectSunEvents(forecast.daily)

  return (
    <Tile title="Next 12 hours" icon={Clock} ariaLabel="Hourly forecast" className={className}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hourly data unavailable.</p>
      ) : (
        <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 py-1 snap-x">
          {rows.map((entry) => {
            const sun = sunEventInHour(entry.time, sunEvents)
            return (
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
                {sun && (
                  <span
                    className="flex items-center gap-0.5 text-[10px] text-primary tabular-nums"
                    aria-label={`${sun.type === 'sunrise' ? 'Sunrise' : 'Sunset'} at ${formatLocalTime(sun.time, timezone)}`}
                  >
                    {sun.type === 'sunrise' ? (
                      <Sunrise className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <Sunset className="h-3 w-3" aria-hidden="true" />
                    )}
                    <span>{formatLocalTime(sun.time, timezone)}</span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Tile>
  )
}
