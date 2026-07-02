import { beforeEach, describe, expect, it } from 'vitest'

import type { WeatherCity } from '@/hooks/useWeather'
import { useSelectedCityStore } from './useSelectedCityStore'

const paris: WeatherCity = {
  name: 'Paris',
  country: 'France',
  lat: 48.8566,
  lng: 2.3522,
  timezone: 'Europe/Paris',
}

describe('useSelectedCityStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useSelectedCityStore.setState({ city: null })
  })

  it('starts with null', () => {
    expect(useSelectedCityStore.getState().city).toBeNull()
  })

  it('setCity stores the city', () => {
    useSelectedCityStore.getState().setCity(paris)
    expect(useSelectedCityStore.getState().city).toEqual(paris)
  })

  it('setCity(null) clears the city', () => {
    useSelectedCityStore.getState().setCity(paris)
    useSelectedCityStore.getState().setCity(null)
    expect(useSelectedCityStore.getState().city).toBeNull()
  })

  it('persists to localStorage under weather-app:selected-city', () => {
    useSelectedCityStore.getState().setCity(paris)
    const raw = localStorage.getItem('weather-app:selected-city')
    expect(raw).not.toBeNull()
    expect(raw).toContain('Paris')
    expect(raw).toContain('France')
  })
})
