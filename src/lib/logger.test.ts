import { afterEach, describe, expect, it, vi } from 'vitest'
import { logger } from './logger'

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls console.info for logger.info in dev', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('hello')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('prefixes messages with [weather-app]', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('hello')
    const firstArg = spy.mock.calls[0]?.[0]
    expect(typeof firstArg).toBe('string')
    expect(firstArg as string).toContain('[weather-app]')
  })

  it('passes message and meta object through to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const meta = { code: 42, detail: 'oops' }
    logger.error('kaboom', meta)
    expect(spy).toHaveBeenCalledTimes(1)
    const args = spy.mock.calls[0] ?? []
    expect(args).toContain('kaboom')
    expect(args).toContain(meta)
  })

  it('includes the level tag in the prefix', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('careful now')
    const firstArg = spy.mock.calls[0]?.[0]
    expect(typeof firstArg).toBe('string')
    expect(firstArg as string).toContain('[warn]')
  })
})
