import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface LoadingStateProps {
  variant?: 'inline' | 'full-page'
  message?: string
}

export function LoadingState({
  variant = 'inline',
  message = 'Loading…',
}: LoadingStateProps) {
  const isFullPage = variant === 'full-page'

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 text-muted-foreground',
        isFullPage && 'min-h-screen flex-col justify-center'
      )}
    >
      <Loader2
        className={cn('animate-spin', isFullPage ? 'h-8 w-8' : 'h-4 w-4')}
        aria-hidden="true"
      />
      {message && (
        <span className={cn(isFullPage ? 'text-base' : 'text-sm')}>{message}</span>
      )}
    </div>
  )
}
