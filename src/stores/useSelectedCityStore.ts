import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { WeatherCity } from '@/hooks/useWeather'

interface SelectedCityState {
  city: WeatherCity | null
  setCity: (city: WeatherCity | null) => void
}

export const useSelectedCityStore = create<SelectedCityState>()(
  persist(
    (set) => ({
      city: null,
      setCity: (city) => set({ city }),
    }),
    {
      name: 'weather-app:selected-city',
    }
  )
)
