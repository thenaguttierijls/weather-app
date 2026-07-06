import { beforeEach, describe, expect, it } from 'vitest'

import { useCitiesStore } from './useCitiesStore'

function reset() {
  localStorage.clear()
  useCitiesStore.setState({ cities: [], sortMode: 'recent' })
}

const chicago = {
  name: 'Chicago', country: 'United States',
  lat: 41.8781, lng: -87.6298, timezone: 'America/Chicago',
}
const tokyo = {
  name: 'Tokyo', country: 'Japan',
  lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo',
}
const bangkok = {
  name: 'Bangkok', country: 'Thailand',
  lat: 13.7563, lng: 100.5018, timezone: 'Asia/Bangkok',
}

describe('useCitiesStore', () => {
  beforeEach(reset)

  it('starts with an empty list', () => {
    expect(useCitiesStore.getState().cities).toEqual([])
  })

  it('add inserts a non-pinned city at the end', () => {
    useCitiesStore.getState().add(chicago)
    useCitiesStore.getState().add(tokyo)
    const cities = useCitiesStore.getState().cities
    expect(cities.map((c) => c.name)).toEqual(['Chicago', 'Tokyo'])
    expect(cities[0]?.isPinned).toBe(false)
  })

  it('add with pinned: true inserts at index 0 and marks pinned', () => {
    useCitiesStore.getState().add(chicago)
    useCitiesStore.getState().add(tokyo, { pinned: true })
    const cities = useCitiesStore.getState().cities
    expect(cities[0]?.name).toBe('Tokyo')
    expect(cities[0]?.isPinned).toBe(true)
    expect(cities[1]?.name).toBe('Chicago')
  })

  it('add is a no-op when city already exists (dedupe via hasByCoords)', () => {
    useCitiesStore.getState().add(chicago)
    useCitiesStore.getState().add({ ...chicago, name: 'Chi Town' })
    expect(useCitiesStore.getState().cities).toHaveLength(1)
    expect(useCitiesStore.getState().cities[0]?.name).toBe('Chicago')
  })

  it('hasByCoords matches when coords round to same 3dp key', () => {
    useCitiesStore.getState().add(chicago)
    expect(useCitiesStore.getState().hasByCoords(41.878, -87.630)).toBe(true)
    expect(useCitiesStore.getState().hasByCoords(40.0, -87.0)).toBe(false)
  })

  it('add hitting cap 15 evicts the oldest non-pinned', () => {
    useCitiesStore.getState().add(chicago, { pinned: true })
    for (let i = 0; i < 14; i++) {
      useCitiesStore.getState().add({
        name: `City${i}`, country: 'X',
        lat: i * 0.5, lng: i * 0.5, timezone: 'UTC',
      })
    }
    expect(useCitiesStore.getState().cities).toHaveLength(15)

    useCitiesStore.getState().add({
      name: 'NewCity', country: 'Y',
      lat: 99, lng: 99, timezone: 'UTC',
    })

    const cities = useCitiesStore.getState().cities
    expect(cities).toHaveLength(15)
    expect(cities[0]?.name).toBe('Chicago')
    expect(cities.some((c) => c.name === 'City0')).toBe(false)
    expect(cities.some((c) => c.name === 'NewCity')).toBe(true)
  })

  it('remove returns the removed entry and drops it from the list', () => {
    useCitiesStore.getState().add(chicago)
    useCitiesStore.getState().add(tokyo)
    const id = useCitiesStore.getState().cities[0]!.id
    const removed = useCitiesStore.getState().remove(id)
    expect(removed?.name).toBe('Chicago')
    expect(useCitiesStore.getState().cities.map((c) => c.name)).toEqual(['Tokyo'])
  })

  it('remove on pinned entry returns null and keeps the entry', () => {
    useCitiesStore.getState().add(chicago, { pinned: true })
    const id = useCitiesStore.getState().cities[0]!.id
    const removed = useCitiesStore.getState().remove(id)
    expect(removed).toBeNull()
    expect(useCitiesStore.getState().cities).toHaveLength(1)
  })

  it('restore re-inserts at the specified index', () => {
    useCitiesStore.getState().add(chicago)
    useCitiesStore.getState().add(tokyo)
    useCitiesStore.getState().add(bangkok)
    const id = useCitiesStore.getState().cities[1]!.id
    const removed = useCitiesStore.getState().remove(id)!
    useCitiesStore.getState().restore(removed, 1)
    expect(useCitiesStore.getState().cities.map((c) => c.name))
      .toEqual(['Chicago', 'Tokyo', 'Bangkok'])
  })

  it('setSort updates sortMode', () => {
    useCitiesStore.getState().setSort('alpha')
    expect(useCitiesStore.getState().sortMode).toBe('alpha')
  })

  it('persists cities + sortMode to weather-app:cities', () => {
    useCitiesStore.getState().add(chicago)
    useCitiesStore.getState().setSort('alpha')
    const raw = localStorage.getItem('weather-app:cities')
    expect(raw).not.toBeNull()
    expect(raw).toContain('Chicago')
    expect(raw).toContain('alpha')
  })
})
