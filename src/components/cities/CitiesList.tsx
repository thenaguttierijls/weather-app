import { CityCard } from './CityCard'
import { SortDropdown } from './SortDropdown'
import { EmptyState } from '@/components/states/EmptyState'
import type { SavedCity } from '@/stores/useCitiesStore'
import { useCitiesStore } from '@/stores/useCitiesStore'

function readCachedTempC(city: SavedCity): number {
  if (typeof window === 'undefined') return Number.NEGATIVE_INFINITY
  try {
    const raw = window.localStorage.getItem('weather-app:last-forecast')
    if (!raw) return Number.NEGATIVE_INFINITY
    const store = JSON.parse(raw) as { entries: { key: string; forecast: { current: { tempC: number } } }[] }
    const key = `${city.lat.toFixed(3)},${city.lng.toFixed(3)}`
    const entry = store.entries.find((e) => e.key === key)
    return entry?.forecast.current.tempC ?? Number.NEGATIVE_INFINITY
  } catch {
    return Number.NEGATIVE_INFINITY
  }
}

function sortCities(cities: SavedCity[], mode: 'recent' | 'alpha' | 'temp'): SavedCity[] {
  const pinned = cities.filter((c) => c.isPinned)
  const rest = cities.filter((c) => !c.isPinned)
  const sorted = [...rest]
  if (mode === 'alpha') {
    sorted.sort((a, b) => a.name.localeCompare(b.name))
  } else if (mode === 'temp') {
    sorted.sort((a, b) => {
      const ta = readCachedTempC(a)
      const tb = readCachedTempC(b)
      if (tb !== ta) return tb - ta
      return a.name.localeCompare(b.name)
    })
  } else {
    sorted.sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1))
  }
  return [...pinned, ...sorted]
}

export function CitiesList() {
  const cities = useCitiesStore((s) => s.cities)
  const sortMode = useCitiesStore((s) => s.sortMode)
  const sorted = sortCities(cities, sortMode)

  if (sorted.length === 0) {
    return (
      <EmptyState
        title="No cities yet"
        message="Search for a city to add it to your list."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Cities</h2>
        <SortDropdown />
      </div>
      <ul className="flex flex-col gap-3">
        {sorted.map((city) => (
          <li key={city.id}>
            <CityCard city={city} />
          </li>
        ))}
      </ul>
    </div>
  )
}
