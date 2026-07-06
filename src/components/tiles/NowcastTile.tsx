import { Cloud, CloudDrizzle, CloudLightning, CloudRain } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { NormalizedForecast } from '@/api/types'
import { Tile } from '@/components/tiles/Tile'
import { computeNowcast } from '@/lib/nowcast'
import type { NowcastSummary } from '@/lib/nowcast'

interface NowcastTileProps {
  forecast: NormalizedForecast
  className?: string
}

function iconForSummary(summary: NowcastSummary) {
  if (summary.status === 'raining' || summary.status === 'rain-soon') {
    if (summary.intensity === 'heavy') return CloudLightning
    if (summary.intensity === 'moderate') return CloudRain
    return CloudDrizzle
  }
  return Cloud
}

function textForSummary(summary: NowcastSummary): string {
  switch (summary.status) {
    case 'raining':
      return `Raining now — ${summary.intensity}`
    case 'rain-soon':
      return `Rain in ~${summary.minutesUntilRain} min — ${summary.intensity}`
    case 'clear':
      return 'No rain in the next hour'
    case 'unknown':
      return 'Nowcast unavailable'
  }
}

export function NowcastTile({ forecast, className }: NowcastTileProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const summary = computeNowcast(forecast.minutely15 ?? [], now)
  const Icon = iconForSummary(summary)
  const text = textForSummary(summary)

  return (
    <Tile title="Nowcast" icon={Icon} ariaLabel="Nowcast" className={className}>
      <p className="text-lg font-medium">{text}</p>
    </Tile>
  )
}
