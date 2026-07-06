import { CloudOff } from 'lucide-react'

import { formatRelativeTime } from '@/lib/formatters'

interface StaleBannerProps {
  staleSince: string
  now?: Date
}

export function StaleBanner({ staleSince, now }: StaleBannerProps) {
  const relative = formatRelativeTime(staleSince, now)
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-start gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
    >
      <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
      <p>
        Showing last known weather from {relative}. We&rsquo;ll refresh when your connection is back.
      </p>
    </div>
  )
}
