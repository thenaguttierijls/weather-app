import { X } from 'lucide-react'

import type { WeatherCity } from '@/hooks/useWeather'
import { useRecentCitiesStore } from '@/stores/useRecentCitiesStore'

interface RecentCitiesProps {
  onSelect: (city: WeatherCity) => void
}

export function RecentCities({ onSelect }: RecentCitiesProps) {
  const cities = useRecentCitiesStore((state) => state.cities)
  const remove = useRecentCitiesStore((state) => state.remove)

  if (cities.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Recent
      </h3>
      <div className="flex flex-wrap gap-2">
        {cities.map((city) => {
          const name = city.name ?? ''
          const country = city.country ?? ''
          const key = `${name}|${country}`
          return (
            <div
              key={key}
              className="flex items-center gap-1 rounded-full border border-border bg-background pl-3 pr-1 text-sm"
            >
              <button
                type="button"
                onClick={() => onSelect(city)}
                aria-label={`Load weather for ${name}`}
                className="rounded-full py-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {name}
              </button>
              <button
                type="button"
                onClick={() => remove(name, country)}
                aria-label={`Remove ${name} from recents`}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
