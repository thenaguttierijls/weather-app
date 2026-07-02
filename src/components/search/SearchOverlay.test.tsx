import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { GeoResult } from '@/api/types'
import type { WeatherCity } from '@/hooks/useWeather'
import { useRecentCitiesStore } from '@/stores/useRecentCitiesStore'
import { useSelectedCityStore } from '@/stores/useSelectedCityStore'
import { SearchOverlay } from './SearchOverlay'

vi.mock('@/api/geocoding', () => ({
  searchCities: vi.fn(),
}))

import { searchCities } from '@/api/geocoding'

const mockedSearchCities = vi.mocked(searchCities)

function paris(): GeoResult {
  return {
    id: 1,
    name: 'Paris',
    country: 'France',
    latitude: 48.85,
    longitude: 2.35,
    timezone: 'Europe/Paris',
  }
}

function makeCity(name: string, country = 'France'): WeatherCity {
  return {
    name,
    country,
    lat: 1,
    lng: 2,
    timezone: 'UTC',
  }
}

describe('SearchOverlay', () => {
  beforeEach(() => {
    localStorage.clear()
    useRecentCitiesStore.setState({ cities: [] })
    useSelectedCityStore.setState({ city: null })
    mockedSearchCities.mockReset()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not render dialog content when open is false', () => {
    render(<SearchOverlay open={false} onOpenChange={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders title and description when open', () => {
    render(<SearchOverlay open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Change city')).toBeInTheDocument()
    expect(
      screen.getByText('Type to search worldwide, or pick a recent one below.')
    ).toBeInTheDocument()
  })

  it('closes when ESC is pressed', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<SearchOverlay open={true} onOpenChange={onOpenChange} />)

    await user.keyboard('{Escape}')

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('picking a search result sets selected city + adds to recents + closes', async () => {
    const user = userEvent.setup()
    mockedSearchCities.mockResolvedValueOnce([paris()])
    const onOpenChange = vi.fn()

    render(<SearchOverlay open={true} onOpenChange={onOpenChange} />)
    const input = screen.getByLabelText('Search cities')
    await user.type(input, 'Paris')

    await waitFor(() => {
      expect(screen.getByText('Paris')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Paris'))

    expect(useSelectedCityStore.getState().city?.name).toBe('Paris')
    expect(useSelectedCityStore.getState().city?.country).toBe('France')
    expect(useRecentCitiesStore.getState().cities[0]?.name).toBe('Paris')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('picking a recent chip sets selected city + bumps to front + closes', async () => {
    const user = userEvent.setup()
    useRecentCitiesStore.setState({
      cities: [makeCity('Berlin', 'Germany'), makeCity('Paris')],
    })
    const onOpenChange = vi.fn()

    render(<SearchOverlay open={true} onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'Paris' }))

    expect(useSelectedCityStore.getState().city?.name).toBe('Paris')
    expect(useRecentCitiesStore.getState().cities[0]?.name).toBe('Paris')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
