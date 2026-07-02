import type { NormalizedForecast } from '@/api/types'
import { WeatherIcon } from '@/components/WeatherIcon'
import { getHeroGradient } from '@/components/hero/gradient'
import { formatTemp } from '@/lib/formatters'
import type { TempUnit } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { getWmoInfo } from '@/lib/wmoCodes'
import type { WmoInfo } from '@/lib/wmoCodes'
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
      <HeroDecoration info={info} isDay={current.isDay} />

      <WeatherIcon
        code={current.weatherCode}
        isDay={current.isDay}
        size={112}
        className="absolute right-4 top-4 drop-shadow-md md:hidden"
        aria-label=""
      />

      <div className="relative flex w-full flex-col items-start justify-center gap-4 px-6 py-10 md:w-3/5 md:px-12 md:py-16">
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

      <div className="pointer-events-none relative hidden items-center justify-center md:flex md:w-2/5">
        {current.weatherCode !== 0 && (
          <>
            <WeatherIcon
              code={3}
              isDay={true}
              size={140}
              className="absolute left-2 top-6 opacity-40 drop-shadow-md"
              aria-label=""
            />
            <WeatherIcon
              code={3}
              isDay={true}
              size={100}
              className="absolute bottom-8 right-2 opacity-30 drop-shadow-md"
              aria-label=""
            />
          </>
        )}
        <WeatherIcon
          code={current.weatherCode}
          isDay={current.isDay}
          size={320}
          className="relative drop-shadow-2xl"
          aria-label=""
        />
      </div>
    </section>
  )
}

function HeroDecoration({ info, isDay }: { info: WmoInfo; isDay: boolean }) {
  if (info.isStormy) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-8 top-2 h-20 w-72 rounded-full bg-black/30 blur-2xl md:h-24 md:w-96" />
        <div className="absolute left-32 top-0 h-16 w-56 rounded-full bg-black/25 blur-2xl md:left-56 md:h-20 md:w-72" />
        <div className="absolute -right-4 top-8 h-14 w-40 rounded-full bg-black/20 blur-2xl md:h-16 md:w-56" />
        <RainStreaks count={40} opacity={0.55} />
      </div>
    )
  }

  if (info.isRainy) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-8 top-6 h-16 w-56 rounded-full bg-white/15 blur-2xl md:h-20 md:w-72" />
        <div className="absolute left-24 top-14 h-10 w-32 rounded-full bg-white/10 blur-xl md:left-40 md:h-12 md:w-40" />
        <div className="absolute -right-8 top-8 h-14 w-48 rounded-full bg-white/10 blur-2xl md:h-16 md:w-60" />
        <RainStreaks count={22} opacity={0.4} />
      </div>
    )
  }

  if (info.isSnowy) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-8 top-6 h-16 w-56 rounded-full bg-white/20 blur-2xl md:h-20 md:w-72" />
        <div className="absolute -right-6 top-10 h-14 w-48 rounded-full bg-white/15 blur-2xl md:h-16 md:w-60" />
        <Snowflakes count={28} />
      </div>
    )
  }

  if (info.isSunny && !isDay) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Stars count={18} />
      </div>
    )
  }

  if (info.isSunny) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-yellow-100/25 blur-3xl md:h-[28rem] md:w-[28rem]" />
        <div className="absolute -top-12 right-16 h-40 w-40 rounded-full bg-white/15 blur-2xl md:right-32 md:h-52 md:w-52" />
        <div className="absolute bottom-12 -left-12 h-32 w-32 rounded-full bg-yellow-100/10 blur-3xl md:h-40 md:w-40" />
      </div>
    )
  }

  if (info.isCloudy) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-8 top-6 h-16 w-56 rounded-full bg-white/20 blur-2xl md:h-20 md:w-72" />
        <div className="absolute left-24 top-14 h-10 w-32 rounded-full bg-white/12 blur-xl md:left-40 md:h-12 md:w-40" />
        <div className="absolute bottom-10 -right-6 h-14 w-48 rounded-full bg-white/15 blur-2xl md:bottom-16 md:h-16 md:w-60" />
        <div className="absolute bottom-24 right-24 h-8 w-28 rounded-full bg-white/10 blur-xl md:right-40 md:h-10 md:w-36" />
        <div className="absolute top-32 left-1/3 h-10 w-40 rounded-full bg-white/10 blur-2xl md:h-14 md:w-56" />
      </div>
    )
  }

  return null
}

function RainStreaks({ count, opacity }: { count: number; opacity: number }) {
  const streaks = Array.from({ length: count }, (_, i) => {
    const left = (i * 41 + 7) % 100
    const top = (i * 23 + 5) % 90
    const height = 14 + (i % 4) * 4
    return { left, top, height, i }
  })
  return (
    <div className="absolute inset-0" style={{ opacity }}>
      {streaks.map((s) => (
        <span
          key={s.i}
          className="absolute w-px bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            height: `${s.height}px`,
            transform: 'rotate(18deg)',
          }}
        />
      ))}
    </div>
  )
}

function Snowflakes({ count }: { count: number }) {
  const flakes = Array.from({ length: count }, (_, i) => {
    const left = (i * 37 + 5) % 100
    const top = (i * 19 + 3) % 90
    const size = 3 + (i % 3)
    return { left, top, size, i }
  })
  return (
    <div className="absolute inset-0">
      {flakes.map((f) => (
        <span
          key={f.i}
          className="absolute rounded-full bg-white/80"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
          }}
        />
      ))}
    </div>
  )
}

function Stars({ count }: { count: number }) {
  const stars = Array.from({ length: count }, (_, i) => {
    const left = (i * 47 + 11) % 100
    const top = (i * 29 + 7) % 80
    const size = 1 + (i % 3)
    const opacity = 0.4 + ((i % 4) * 0.15)
    return { left, top, size, opacity, i }
  })
  return (
    <div className="absolute inset-0">
      {stars.map((s) => (
        <span
          key={s.i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  )
}
