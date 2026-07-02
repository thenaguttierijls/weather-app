const PREFIX = '[weather-app]'
const isDev = import.meta.env.DEV === true

function format(level: string, message: string, meta?: Record<string, unknown>): unknown[] {
  const parts: unknown[] = [`${PREFIX} [${level}]`, message]
  if (meta !== undefined) parts.push(meta)
  return parts
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (!isDev) return
    console.debug(...format('debug', message, meta))
  },
  info(message: string, meta?: Record<string, unknown>): void {
    if (!isDev) return
    console.info(...format('info', message, meta))
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(...format('warn', message, meta))
  },
  error(message: string, meta?: Record<string, unknown>): void {
    console.error(...format('error', message, meta))
  },
}
