import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { WeatherCity } from '@/hooks/useWeather'

const MAX_RECENTS = 5

interface RecentCitiesState {
  cities: WeatherCity[]
  add: (city: WeatherCity) => void
  remove: (name: string, country: string) => void
  clear: () => void
}

function sameCity(a: WeatherCity, b: WeatherCity): boolean {
  return (a.name ?? '') === (b.name ?? '') && (a.country ?? '') === (b.country ?? '')
}

export const useRecentCitiesStore = create<RecentCitiesState>()(
  persist(
    (set, get) => ({
      cities: [],
      add: (city) => {
        const current = get().cities
        const deduped = current.filter((existing) => !sameCity(existing, city))
        const next = [city, ...deduped].slice(0, MAX_RECENTS)
        set({ cities: next })
      },
      remove: (name, country) => {
        const next = get().cities.filter(
          (city) => (city.name ?? '') !== name || (city.country ?? '') !== country
        )
        set({ cities: next })
      },
      clear: () => set({ cities: [] }),
    }),
    {
      name: 'weather-app:recents',
    }
  )
)
