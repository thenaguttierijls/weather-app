import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface HeaderSearchButtonProps {
  onClick: () => void
}

export function HeaderSearchButton({ onClick }: HeaderSearchButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label="Search for a city"
      title="Search for a city"
    >
      <Search className="h-5 w-5" aria-hidden="true" />
    </Button>
  )
}
