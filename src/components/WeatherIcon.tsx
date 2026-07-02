import { getWmoInfo } from '@/lib/wmoCodes'
import { cn } from '@/lib/utils'

// Eager glob so Vite hashes every icon URL at build time and we can look up
// by iconKey without a runtime dynamic import.
const ICON_URLS = import.meta.glob<string>(
  '/node_modules/@bybas/weather-icons/production/fill/all/*.svg',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>

const ICON_BY_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(ICON_URLS).map(([path, url]) => {
    const name = path.split('/').pop()!.replace('.svg', '')
    return [name, url]
  })
)

const FALLBACK_KEY = 'not-available'

interface WeatherIconProps {
  code: number
  isDay: boolean
  size?: number
  className?: string
  'aria-label'?: string
}

export function WeatherIcon({
  code,
  isDay,
  size = 48,
  className,
  'aria-label': ariaLabel,
}: WeatherIconProps) {
  const info = getWmoInfo(code, isDay)
  const url = ICON_BY_KEY[info.iconKey] ?? ICON_BY_KEY[FALLBACK_KEY]
  const label = ariaLabel ?? info.label

  if (!url) {
    return (
      <span
        role="img"
        aria-label={label}
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-border text-muted-foreground',
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        ?
      </span>
    )
  }

  return (
    <img
      src={url}
      alt=""
      role="img"
      aria-label={label}
      width={size}
      height={size}
      className={cn('inline-block select-none', className)}
      draggable={false}
    />
  )
}
