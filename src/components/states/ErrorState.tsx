import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  variant?: 'inline' | 'full-page'
}

export function ErrorState({
  title = 'Something went wrong.',
  message,
  onRetry,
  variant = 'inline',
}: ErrorStateProps) {
  const isFullPage = variant === 'full-page'

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 p-4 text-center',
        isFullPage && 'min-h-screen justify-center'
      )}
    >
      <AlertCircle className="h-8 w-8 text-brand-500" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {message && <p className="max-w-md text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
