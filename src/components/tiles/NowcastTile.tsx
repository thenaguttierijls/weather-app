import { Cloud, CloudDrizzle, CloudLightning, CloudRain } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { WeatherIcon } from '@/components/WeatherIcon'
import { computeNowcast } from '@/lib/nowcast'
import type { NowcastSummary } from '@/lib/nowcast'

interface NowcastTileProps {
  forecast: NormalizedForecast
  className?: string
}

function headerIconForSummary(summary: NowcastSummary) {
  if (summary.status === 'raining' || summary.status === 'rain-soon') {
    if (summary.intensity === 'heavy') return CloudLightning
    if (summary.intensity === 'moderate') return CloudRain
    return CloudDrizzle
  }
  return Cloud
}

function weatherCodeForSummary(summary: NowcastSummary, fallback: number): number {
  if (summary.status === 'raining') {
    if (summary.intensity === 'heavy') return 95
    if (summary.intensity === 'moderate') return 63
    return 51
  }
  if (summary.status === 'rain-soon') return 51
  if (summary.status === 'clear') return fallback
  return 3
}

function headlineForSummary(summary: NowcastSummary): string {
  switch (summary.status) {
    case 'raining':
      return 'Raining now'
    case 'rain-soon':
      return `Rain in ~${summary.minutesUntilRain} min`
    case 'clear':
      return 'No rain expected'
    case 'unknown':
      return 'Nowcast unavailable'
  }
}

function subtitleForSummary(summary: NowcastSummary): string | null {
  if (summary.status === 'raining' || summary.status === 'rain-soon') {
    return summary.intensity ?? null
  }
  if (summary.status === 'clear') return 'in the next hour'
  return null
}

export function NowcastTile({ forecast, className }: NowcastTileProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const summary = computeNowcast(forecast.minutely15 ?? [], now)
  const HeaderIcon = headerIconForSummary(summary)
  const weatherCode = weatherCodeForSummary(summary, forecast.current.weatherCode)
  const headline = headlineForSummary(summary)
  const subtitle = subtitleForSummary(summary)

  return (
    <Tile title="Nowcast" icon={HeaderIcon} ariaLabel="Nowcast" className={className}>
      <div className="flex items-center gap-4">
        <WeatherIcon
          code={weatherCode}
          isDay={forecast.current.isDay}
          size={72}
          aria-label=""
        />
        <div className="flex flex-col">
          <p className="text-lg font-medium leading-tight">{headline}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground capitalize">{subtitle}</p>
          )}
        </div>
      </div>
    </Tile>
  )
}
