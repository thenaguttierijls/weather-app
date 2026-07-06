import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  return (
    <span
      role="status"
      aria-label="You are offline"
      title="You are offline"
      className="inline-flex h-10 w-10 items-center justify-center text-muted-foreground"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
    </span>
  )
}
