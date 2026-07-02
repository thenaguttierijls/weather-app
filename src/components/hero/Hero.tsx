import type { NormalizedForecast } from '@/api/types'
import { getHeroGradient } from '@/components/hero/gradient'
import { formatTemp } from '@/lib/formatters'
import type { TempUnit } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { getWmoInfo } from '@/lib/wmoCodes'
import { useUnitStore } from '@/stores/useUnitStore'

interface HeroProps {
  forecast: NormalizedForecast
}

function unitToTemp(unit: 'metric' | 'imperial'): TempUnit {
  return unit === 'imperial' ? 'F' : 'C'
}

export function Hero({ forecast }: HeroProps) {
  const unit = useUnitStore((state) => state.unit)
  const tempUnit = unitToTemp(unit)

  const { current, daily, location } = forecast
  const info = getWmoInfo(current.weatherCode, current.isDay)
  const gradient = getHeroGradient({
    weatherCode: current.weatherCode,
    isDay: current.isDay,
  })

  const today = daily[0]
  const bigTemp = formatTemp(current.tempC, tempUnit)
  const feelsLike = formatTemp(current.apparentC, tempUnit)
  const tempNumber = bigTemp.split('°')[0]
  const tempReadable = `Temperature ${tempNumber} degrees ${tempUnit === 'F' ? 'Fahrenheit' : 'Celsius'}`

  const sectionLabel = location.name
    ? `Current weather for ${location.name}`
    : 'Current weather'

  return (
    <section
      aria-label={sectionLabel}
      className={cn(
        'relative flex w-full flex-col justify-center overflow-hidden rounded-2xl px-6 py-10 text-white shadow-lg',
        'min-h-[420px] md:min-h-[520px] md:px-12 md:py-16',
        gradient
      )}
    >
      <div className="flex flex-col items-start gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
            {location.name || 'Unknown location'}
          </h2>
          {location.country && (
            <span className="text-sm text-white/70">{location.country}</span>
          )}
        </div>

        <div
          className="text-8xl font-light leading-none md:text-9xl"
          aria-label={tempReadable}
        >
          {bigTemp}
        </div>

        <div className="text-xl font-medium text-white/90 md:text-2xl">
          {info.label}
        </div>

        {today && (
          <div className="text-base text-white/80 md:text-lg">
            High {formatTemp(today.tempMaxC, tempUnit)} /
            {' '}
            Low {formatTemp(today.tempMinC, tempUnit)}
          </div>
        )}

        <div className="text-sm text-white/70">
          Feels like {feelsLike}
        </div>
      </div>
    </section>
  )
}
