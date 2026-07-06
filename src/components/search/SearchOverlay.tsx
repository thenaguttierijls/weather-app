import type { GeoResult } from '@/api/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCitiesStore } from '@/stores/useCitiesStore'
import { useSelectedCityStore } from '@/stores/useSelectedCityStore'

import { SearchBar } from './SearchBar'

interface SearchOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const setSelectedCity = useSelectedCityStore((s) => s.setCity)
  const addCity = useCitiesStore((s) => s.add)

  const handleSearchSelect = (result: GeoResult) => {
    addCity({
      name: result.name,
      country: result.country,
      lat: result.latitude,
      lng: result.longitude,
      timezone: result.timezone,
    })
    setSelectedCity({
      lat: result.latitude,
      lng: result.longitude,
      timezone: result.timezone,
      name: result.name,
      country: result.country,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a city</DialogTitle>
          <DialogDescription>
            Search worldwide and tap a result to add it to your list.
          </DialogDescription>
        </DialogHeader>
        <SearchBar onSelect={handleSearchSelect} />
      </DialogContent>
    </Dialog>
  )
}
