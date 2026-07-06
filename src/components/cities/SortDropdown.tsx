import type { ChangeEvent } from 'react'

import { useCitiesStore } from '@/stores/useCitiesStore'
import type { SortMode } from '@/stores/useCitiesStore'

export function SortDropdown() {
  const sortMode = useCitiesStore((s) => s.sortMode)
  const setSort = useCitiesStore((s) => s.setSort)

  const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as SortMode)
  }

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="sr-only">Sort cities</span>
      <span aria-hidden="true">Sort by</span>
      <select
        aria-label="Sort cities"
        value={sortMode}
        onChange={onChange}
        className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="recent">Recently added</option>
        <option value="alpha">Alphabetical</option>
        <option value="temp">Temperature</option>
      </select>
    </label>
  )
}
