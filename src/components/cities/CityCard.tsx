import { MapPin, X } from 'lucide-react'
import { toast } from 'sonner'

import { WeatherIcon } from '@/components/WeatherIcon'
import { useCityWeather } from '@/hooks/useCityWeather'
import { formatTemp, formatTime } from '@/lib/formatters'
import type { TempUnit } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { getWmoInfo } from '@/lib/wmoCodes'
import type { SavedCity } from '@/stores/useCitiesStore'
import { useCitiesStore } from '@/stores/useCitiesStore'
import { useSelectedCityStore } from '@/stores/useSelectedCityStore'
import { useUnitStore } from '@/stores/useUnitStore'
import { useViewStore } from '@/stores/useViewStore'

interface CityCardProps {
  city: SavedCity
}

function unitToTemp(unit: 'metric' | 'imperial'): TempUnit {
  return unit === 'imperial' ? 'F' : 'C'
}

export function CityCard({ city }: CityCardProps) {
  const unit = useUnitStore((s) => s.unit)
  const tempUnit = unitToTemp(unit)
  const setSelectedCity = useSelectedCityStore((s) => s.setCity)
  const setView = useViewStore((s) => s.setView)
  const remove = useCitiesStore((s) => s.remove)
  const restore = useCitiesStore((s) => s.restore)
  const currentIndex = useCitiesStore((s) => s.cities.findIndex((c) => c.id === city.id))

  const { data, isStale } = useCityWeather({
    lat: city.lat,
    lng: city.lng,
    timezone: city.timezone,
    name: city.name,
    country: city.country,
  })

  const info = data ? getWmoInfo(data.current.weatherCode, data.current.isDay) : null
  const temp = data && Number.isFinite(data.current.tempC)
    ? formatTemp(data.current.tempC, tempUnit)
    : '—'
  const today = data?.daily[0]
  const high = today ? formatTemp(today.tempMaxC, tempUnit) : '—'
  const low = today ? formatTemp(today.tempMinC, tempUnit) : '—'
  const localTime = formatTime(new Date().toISOString(), city.timezone)

  const openDetail = () => {
    setSelectedCity({
      lat: city.lat,
      lng: city.lng,
      timezone: city.timezone,
      name: city.name,
      country: city.country,
    })
    setView('detail')
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    const idx = currentIndex
    const removed = remove(city.id)
    if (!removed) return
    toast(`Removed ${removed.name}.`, {
      action: {
        label: 'Undo',
        onClick: () => restore(removed, idx),
      },
      duration: 5000,
    })
  }

  return (
    <div
      className={cn(
        'relative flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm',
        'transition-colors hover:bg-accent/50'
      )}
    >
      <button
        type="button"
        onClick={openDetail}
        aria-label={`Open ${city.name}`}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="pointer-events-none relative z-10 flex flex-col">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{city.name}</h3>
          {city.isPinned && (
            <MapPin
              className="h-4 w-4 text-muted-foreground"
              aria-label="Pinned — your current location"
            />
          )}
        </div>
        <div className="text-xs text-muted-foreground">{localTime}</div>
        {info && <div className="text-sm text-muted-foreground">{info.label}</div>}
      </div>
      <div className="pointer-events-none relative z-10 flex items-center gap-3">
        {info && <WeatherIcon code={data!.current.weatherCode} isDay={data!.current.isDay} size={40} />}
        <div className="flex flex-col items-end">
          <div className={cn('text-3xl font-light tabular-nums', isStale && 'opacity-70')}>
            {temp}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            H {high} / L {low}
          </div>
        </div>
      </div>
      {!city.isPinned && (
        <button
          type="button"
          onClick={handleRemove}
          aria-label={`Remove ${city.name}`}
          className="absolute right-2 top-2 z-20 rounded-full p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
