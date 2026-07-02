import type { GeoResult } from '@/api/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { WeatherCity } from '@/hooks/useWeather'
import { useRecentCitiesStore } from '@/stores/useRecentCitiesStore'
import { useSelectedCityStore } from '@/stores/useSelectedCityStore'

import { RecentCities } from './RecentCities'
import { SearchBar } from './SearchBar'

interface SearchOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function geoToCity(result: GeoResult): WeatherCity {
  return {
    name: result.name,
    country: result.country,
    lat: result.latitude,
    lng: result.longitude,
    timezone: result.timezone,
  }
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const setSelectedCity = useSelectedCityStore((s) => s.setCity)
  const addRecent = useRecentCitiesStore((s) => s.add)

  const pickCity = (city: WeatherCity) => {
    setSelectedCity(city)
    addRecent(city)
    onOpenChange(false)
  }

  const handleSearchSelect = (result: GeoResult) => {
    pickCity(geoToCity(result))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change city</DialogTitle>
          <DialogDescription>
            Type to search worldwide, or pick a recent one below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <SearchBar onSelect={handleSearchSelect} />
          <RecentCities onSelect={pickCity} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
