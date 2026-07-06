import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SortMode = 'recent' | 'alpha' | 'temp'

export interface SavedCity {
  id: string
  name: string
  country: string
  lat: number
  lng: number
  timezone: string
  addedAt: string
  isPinned: boolean
}

type CityInput = Omit<SavedCity, 'id' | 'addedAt' | 'isPinned'>

interface CitiesState {
  cities: SavedCity[]
  sortMode: SortMode
  add: (city: CityInput, opts?: { pinned?: boolean }) => void
  remove: (id: string) => SavedCity | null
  restore: (city: SavedCity, atIndex: number) => void
  setSort: (mode: SortMode) => void
  hasByCoords: (lat: number, lng: number) => boolean
}

const CAP = 15

function idFor(lat: number, lng: number): string {
  return `${lat.toFixed(3)}_${lng.toFixed(3)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export const useCitiesStore = create<CitiesState>()(
  persist(
    (set, get) => ({
      cities: [],
      sortMode: 'recent',

      add: (input, opts) => {
        const id = idFor(input.lat, input.lng)
        const pinned = opts?.pinned === true
        const existing = get().cities
        const existingEntry = existing.find((c) => c.id === id)

        if (existingEntry) {
          if (pinned && !existingEntry.isPinned) {
            const promoted: SavedCity = { ...existingEntry, isPinned: true }
            const others = existing.filter((c) => c.id !== id && !c.isPinned)
            set({ cities: [promoted, ...others] })
          }
          return
        }

        const entry: SavedCity = {
          id,
          name: input.name,
          country: input.country,
          lat: input.lat,
          lng: input.lng,
          timezone: input.timezone,
          addedAt: nowIso(),
          isPinned: pinned,
        }

        let next: SavedCity[]
        if (pinned) {
          next = [entry, ...existing.filter((c) => !c.isPinned)]
        } else {
          next = [...existing, entry]
        }

        if (next.length > CAP) {
          const pinnedEntries = next.filter((c) => c.isPinned)
          const nonPinned = next.filter((c) => !c.isPinned)
          const trimmed = nonPinned.slice(-(CAP - pinnedEntries.length))
          next = [...pinnedEntries, ...trimmed]
        }

        set({ cities: next })
      },

      remove: (id) => {
        const entry = get().cities.find((c) => c.id === id)
        if (!entry || entry.isPinned) return null
        set({ cities: get().cities.filter((c) => c.id !== id) })
        return entry
      },

      restore: (city, atIndex) => {
        const cities = [...get().cities]
        const clamped = Math.max(0, Math.min(atIndex, cities.length))
        cities.splice(clamped, 0, city)
        set({ cities })
      },

      setSort: (mode) => set({ sortMode: mode }),

      hasByCoords: (lat, lng) => {
        const id = idFor(lat, lng)
        return get().cities.some((c) => c.id === id)
      },
    }),
    { name: 'weather-app:cities' }
  )
)
