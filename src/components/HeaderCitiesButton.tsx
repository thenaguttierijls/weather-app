import { LayoutList } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useViewStore } from '@/stores/useViewStore'

export function HeaderCitiesButton() {
  const view = useViewStore((s) => s.view)
  const toggle = useViewStore((s) => s.toggle)
  const label = view === 'cities' ? 'Show weather detail' : 'Show cities list'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <LayoutList className="h-5 w-5" aria-hidden="true" />
    </Button>
  )
}
