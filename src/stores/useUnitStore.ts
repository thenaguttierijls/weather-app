import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Unit = 'metric' | 'imperial'

interface UnitState {
  unit: Unit
  setUnit: (unit: Unit) => void
  toggleUnit: () => void
}

function getDefaultUnit(): Unit {
  if (typeof navigator === 'undefined') return 'metric'
  const language = navigator.language ?? ''
  return language.toLowerCase() === 'en-us' ? 'imperial' : 'metric'
}

export const useUnitStore = create<UnitState>()(
  persist(
    (set, get) => ({
      unit: getDefaultUnit(),
      setUnit: (unit) => set({ unit }),
      toggleUnit: () => {
        const next: Unit = get().unit === 'metric' ? 'imperial' : 'metric'
        set({ unit: next })
      },
    }),
    {
      name: 'weather-app:units',
    }
  )
)
