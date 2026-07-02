import type { NormalizedForecast } from '@/api/types'
import { WeatherIcon } from '@/components/WeatherIcon'
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
        'relative flex w-full flex-col overflow-hidden rounded-2xl text-white shadow-lg md:flex-row',
        'min-h-[420px] md:min-h-[520px]',
        gradient
      )}
    >
      <WeatherIcon
        code={current.weatherCode}
        isDay={current.isDay}
        size={112}
        className="absolute right-4 top-4 drop-shadow-md md:hidden"
        aria-label=""
      />

      <div className="flex w-full flex-col items-start justify-center gap-4 px-6 py-10 md:w-3/5 md:px-12 md:py-16">
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

      <div className="pointer-events-none hidden items-center justify-center md:flex md:w-2/5">
        <WeatherIcon
          code={current.weatherCode}
          isDay={current.isDay}
          size={320}
          className="drop-shadow-2xl"
          aria-label=""
        />
      </div>
    </section>
  )
}
