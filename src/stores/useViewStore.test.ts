import { beforeEach, describe, expect, it } from 'vitest'

import { useViewStore } from './useViewStore'

describe('useViewStore', () => {
  beforeEach(() => {
    useViewStore.setState({ view: 'detail' })
  })

  it('starts with view "detail"', () => {
    expect(useViewStore.getState().view).toBe('detail')
  })

  it('setView switches to "cities"', () => {
    useViewStore.getState().setView('cities')
    expect(useViewStore.getState().view).toBe('cities')
  })

  it('toggle flips detail to cities and back', () => {
    useViewStore.getState().toggle()
    expect(useViewStore.getState().view).toBe('cities')
    useViewStore.getState().toggle()
    expect(useViewStore.getState().view).toBe('detail')
  })
})
