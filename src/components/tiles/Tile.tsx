import type { ComponentType, ReactNode, SVGProps } from 'react'

import { cn } from '@/lib/utils'

interface TileProps {
  title: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  ariaLabel: string
  className?: string
  children: ReactNode
}

export function Tile({ title, icon: Icon, ariaLabel, className, children }: TileProps) {
  return (
    <section
      role="region"
      aria-label={ariaLabel}
      className={cn(
        'flex flex-col rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm',
        className
      )}
    >
      <header className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{title}</span>
      </header>
      <div className="flex flex-1 flex-col justify-between">{children}</div>
    </section>
  )
}
