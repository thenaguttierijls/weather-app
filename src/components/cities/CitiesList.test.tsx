import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { CitiesList } from './CitiesList'
import { useCitiesStore } from '@/stores/useCitiesStore'

function seedCache() {
  const now = new Date().toISOString()
  const mk = (name: string, lat: number, lng: number, tempC: number, weatherCode: number) => ({
    key: `${lat.toFixed(3)},${lng.toFixed(3)}`,
    fetchedAt: now,
    forecast: {
      location: { name, country: 'X', timezone: 'UTC', lat, lng },
      current: { tempC, apparentC: tempC, humidity: 50, windKph: 0, windDir: 0, weatherCode, isDay: true, precip: 0, uv: 3 },
      hourly: [],
      daily: [{ date: '2026-07-06', weatherCode, tempMaxC: tempC + 3, tempMinC: tempC - 3, sunrise: '', sunset: '', uvMax: 5, precipProbability: 0 }],
    },
  })
  window.localStorage.setItem('weather-app:last-forecast', JSON.stringify({
    entries: [mk('Chicago', 41.88, -87.63, 22, 0), mk('Tokyo', 35.68, 139.65, 30, 0), mk('Bangkok', 13.76, 100.5, 33, 0)],
  }))
}

describe('CitiesList', () => {
  beforeEach(() => {
    localStorage.clear()
    useCitiesStore.setState({ cities: [], sortMode: 'recent' })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders the empty state when no cities exist', () => {
    render(<CitiesList />)
    expect(screen.getByText(/no cities yet/i)).toBeInTheDocument()
  })

  it('renders one card per saved city', () => {
    seedCache()
    useCitiesStore.setState({
      cities: [
        { id: 'a', name: 'Chicago', country: 'US', lat: 41.88, lng: -87.63, timezone: 'UTC', addedAt: '2026-07-01T00:00:00Z', isPinned: false },
        { id: 'b', name: 'Tokyo', country: 'JP', lat: 35.68, lng: 139.65, timezone: 'UTC', addedAt: '2026-07-02T00:00:00Z', isPinned: false },
      ],
      sortMode: 'recent',
    })
    render(<CitiesList />)
    expect(screen.getByText('Chicago')).toBeInTheDocument()
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
  })

  it('renders the pinned card first regardless of sort', () => {
    seedCache()
    useCitiesStore.setState({
      cities: [
        { id: 'a', name: 'Chicago', country: 'US', lat: 41.88, lng: -87.63, timezone: 'UTC', addedAt: '2026-07-01T00:00:00Z', isPinned: false },
        { id: 'b', name: 'Tokyo', country: 'JP', lat: 35.68, lng: 139.65, timezone: 'UTC', addedAt: '2026-07-02T00:00:00Z', isPinned: true },
      ],
      sortMode: 'alpha',
    })
    render(<CitiesList />)
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings[0]?.textContent).toBe('Tokyo')
  })

  it('respects alphabetical sort for non-pinned entries', () => {
    seedCache()
    useCitiesStore.setState({
      cities: [
        { id: 'a', name: 'Chicago', country: 'US', lat: 41.88, lng: -87.63, timezone: 'UTC', addedAt: '2026-07-01T00:00:00Z', isPinned: false },
        { id: 'b', name: 'Tokyo', country: 'JP', lat: 35.68, lng: 139.65, timezone: 'UTC', addedAt: '2026-07-02T00:00:00Z', isPinned: false },
        { id: 'c', name: 'Bangkok', country: 'TH', lat: 13.76, lng: 100.5, timezone: 'UTC', addedAt: '2026-07-03T00:00:00Z', isPinned: false },
      ],
      sortMode: 'alpha',
    })
    render(<CitiesList />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Bangkok', 'Chicago', 'Tokyo'])
  })
})
