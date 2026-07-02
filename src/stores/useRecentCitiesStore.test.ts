import { beforeEach, describe, expect, it } from 'vitest'

import type { WeatherCity } from '@/hooks/useWeather'
import { useRecentCitiesStore } from './useRecentCitiesStore'

function makeCity(name: string, country = 'Country'): WeatherCity {
  return {
    name,
    country,
    lat: 0,
    lng: 0,
    timezone: 'UTC',
  }
}

describe('useRecentCitiesStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useRecentCitiesStore.setState({ cities: [] })
  })

  it('starts empty', () => {
    expect(useRecentCitiesStore.getState().cities).toEqual([])
  })

  it('add prepends new cities', () => {
    useRecentCitiesStore.getState().add(makeCity('Paris'))
    useRecentCitiesStore.getState().add(makeCity('Berlin'))
    const names = useRecentCitiesStore.getState().cities.map((c) => c.name)
    expect(names).toEqual(['Berlin', 'Paris'])
  })

  it('add dedupes by name+country and bumps to front', () => {
    useRecentCitiesStore.getState().add(makeCity('Paris'))
    useRecentCitiesStore.getState().add(makeCity('Berlin'))
    useRecentCitiesStore.getState().add(makeCity('Tokyo'))
    useRecentCitiesStore.getState().add(makeCity('Paris'))

    const names = useRecentCitiesStore.getState().cities.map((c) => c.name)
    expect(names).toEqual(['Paris', 'Tokyo', 'Berlin'])
  })

  it('distinguishes cities with same name but different country', () => {
    useRecentCitiesStore.getState().add(makeCity('Portland', 'United States'))
    useRecentCitiesStore.getState().add(makeCity('Portland', 'Australia'))
    expect(useRecentCitiesStore.getState().cities).toHaveLength(2)
  })

  it('caps at 5 — 6th push evicts the oldest', () => {
    useRecentCitiesStore.getState().add(makeCity('A'))
    useRecentCitiesStore.getState().add(makeCity('B'))
    useRecentCitiesStore.getState().add(makeCity('C'))
    useRecentCitiesStore.getState().add(makeCity('D'))
    useRecentCitiesStore.getState().add(makeCity('E'))
    useRecentCitiesStore.getState().add(makeCity('F'))

    const names = useRecentCitiesStore.getState().cities.map((c) => c.name)
    expect(names).toEqual(['F', 'E', 'D', 'C', 'B'])
    expect(names).not.toContain('A')
  })

  it('remove drops a city by name+country', () => {
    useRecentCitiesStore.getState().add(makeCity('Paris'))
    useRecentCitiesStore.getState().add(makeCity('Berlin'))
    useRecentCitiesStore.getState().remove('Paris', 'Country')

    const names = useRecentCitiesStore.getState().cities.map((c) => c.name)
    expect(names).toEqual(['Berlin'])
  })

  it('remove leaves other cities untouched when name matches but country differs', () => {
    useRecentCitiesStore.getState().add(makeCity('Portland', 'United States'))
    useRecentCitiesStore.getState().add(makeCity('Portland', 'Australia'))
    useRecentCitiesStore.getState().remove('Portland', 'United States')
    const remaining = useRecentCitiesStore.getState().cities
    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.country).toBe('Australia')
  })

  it('persists to localStorage under weather-app:recents', () => {
    useRecentCitiesStore.getState().add(makeCity('Paris'))
    const raw = localStorage.getItem('weather-app:recents')
    expect(raw).not.toBeNull()
    expect(raw).toContain('Paris')
  })

  it('clear empties the list', () => {
    useRecentCitiesStore.getState().add(makeCity('Paris'))
    useRecentCitiesStore.getState().add(makeCity('Berlin'))
    useRecentCitiesStore.getState().clear()
    expect(useRecentCitiesStore.getState().cities).toEqual([])
  })
})
