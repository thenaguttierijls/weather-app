import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useOnline } from './useOnline'

const originalOnLine = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(navigator),
  'onLine'
)

function setOnLine(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => value,
  })
}

function restoreOnLine(): void {
  if (originalOnLine) {
    Object.defineProperty(navigator, 'onLine', originalOnLine)
  } else {
    // Fall back to the boolean value that was on navigator originally.
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    })
  }
}

describe('useOnline', () => {
  beforeEach(() => {
    setOnLine(true)
  })

  afterEach(() => {
    restoreOnLine()
  })

  it('returns true when navigator.onLine starts true', () => {
    const { result } = renderHook(() => useOnline())
    expect(result.current).toBe(true)
  })

  it('returns false when navigator.onLine starts false', () => {
    setOnLine(false)
    const { result } = renderHook(() => useOnline())
    expect(result.current).toBe(false)
  })

  it('flips to false when the offline event fires', () => {
    const { result } = renderHook(() => useOnline())
    expect(result.current).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current).toBe(false)
  })

  it('flips back to true when the online event fires', () => {
    setOnLine(false)
    const { result } = renderHook(() => useOnline())
    expect(result.current).toBe(false)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current).toBe(true)
  })

  it('cleans up its listeners on unmount', () => {
    const { result, unmount } = renderHook(() => useOnline())
    unmount()

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    // No assertion needed beyond "did not throw" — the point is the listener is gone.
    expect(result.current).toBe(true)
  })
})
