import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the initial value when the key is missing', () => {
    const { result } = renderHook(() => useLocalStorage('missing-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('reads an existing value from localStorage on mount', async () => {
    localStorage.setItem('preset-key', JSON.stringify({ hello: 'world' }))
    const { result } = renderHook(() =>
      useLocalStorage<{ hello: string }>('preset-key', { hello: 'default' })
    )
    await waitFor(() => {
      expect(result.current[0]).toEqual({ hello: 'world' })
    })
  })

  it('writes JSON-serialized values on set', async () => {
    const { result } = renderHook(() =>
      useLocalStorage<number[]>('list-key', [])
    )

    await waitFor(() => {
      expect(result.current[0]).toEqual([])
    })

    act(() => {
      result.current[1]([1, 2, 3])
    })

    expect(result.current[0]).toEqual([1, 2, 3])
    expect(localStorage.getItem('list-key')).toBe(JSON.stringify([1, 2, 3]))
  })

  it('round-trips complex objects', async () => {
    const initial = { a: 1, b: { c: 'x' } }
    const { result } = renderHook(() => useLocalStorage('obj-key', initial))

    await waitFor(() => {
      expect(result.current[0]).toEqual(initial)
    })

    act(() => {
      result.current[1]({ a: 2, b: { c: 'y' } })
    })

    const stored = JSON.parse(localStorage.getItem('obj-key') ?? '{}')
    expect(stored).toEqual({ a: 2, b: { c: 'y' } })
  })

  it('returns initial value when stored JSON is malformed', () => {
    localStorage.setItem('bad-key', '{not json')
    const { result } = renderHook(() =>
      useLocalStorage<string>('bad-key', 'fallback')
    )
    expect(result.current[0]).toBe('fallback')
  })

  it('re-reads when the key changes', async () => {
    localStorage.setItem('key-a', JSON.stringify('a-value'))
    localStorage.setItem('key-b', JSON.stringify('b-value'))

    const { result, rerender } = renderHook(
      ({ key }: { key: string }) => useLocalStorage<string>(key, 'fallback'),
      { initialProps: { key: 'key-a' } }
    )

    expect(result.current[0]).toBe('a-value')

    rerender({ key: 'key-b' })

    await waitFor(() => {
      expect(result.current[0]).toBe('b-value')
    })
  })
})
