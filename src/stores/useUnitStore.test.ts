import { beforeEach, describe, expect, it } from 'vitest'

import { useUnitStore } from './useUnitStore'

describe('useUnitStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useUnitStore.setState({ unit: 'metric' })
  })

  it('starts with a defined default unit', () => {
    const { unit } = useUnitStore.getState()
    expect(unit === 'metric' || unit === 'imperial').toBe(true)
  })

  it('setUnit changes the unit', () => {
    useUnitStore.getState().setUnit('imperial')
    expect(useUnitStore.getState().unit).toBe('imperial')

    useUnitStore.getState().setUnit('metric')
    expect(useUnitStore.getState().unit).toBe('metric')
  })

  it('toggleUnit flips metric to imperial and back', () => {
    useUnitStore.setState({ unit: 'metric' })
    useUnitStore.getState().toggleUnit()
    expect(useUnitStore.getState().unit).toBe('imperial')

    useUnitStore.getState().toggleUnit()
    expect(useUnitStore.getState().unit).toBe('metric')
  })

  it('persists to localStorage under weather-app:units', () => {
    useUnitStore.getState().setUnit('imperial')
    const raw = localStorage.getItem('weather-app:units')
    expect(raw).not.toBeNull()
    expect(raw).toContain('imperial')
  })
})
