import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  message?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center text-muted-foreground">
      {Icon && <Icon className="h-10 w-10 opacity-70" aria-hidden="true" />}
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {message && <p className="max-w-md text-sm">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
