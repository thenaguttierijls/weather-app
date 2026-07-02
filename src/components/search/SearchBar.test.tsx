import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { GeoResult } from '@/api/types'
import { SearchBar } from './SearchBar'

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
    admin1: 'Île-de-France',
  }
}

describe('SearchBar', () => {
  beforeEach(() => {
    mockedSearchCities.mockReset()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the empty prompt when the input is empty', () => {
    render(<SearchBar onSelect={vi.fn()} />)
    expect(screen.getByText('Type a city name to search.')).toBeInTheDocument()
  })

  it('debounces typing and calls searchCities with trimmed query', async () => {
    const user = userEvent.setup()
    mockedSearchCities.mockResolvedValueOnce([paris()])

    render(<SearchBar onSelect={vi.fn()} />)
    const input = screen.getByLabelText('Search cities')

    await user.type(input, 'Par')
    expect(mockedSearchCities).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(mockedSearchCities).toHaveBeenCalledWith('Par')
    })
  })

  it('renders search results as clickable rows', async () => {
    const user = userEvent.setup()
    mockedSearchCities.mockResolvedValueOnce([paris()])
    const onSelect = vi.fn()

    render(<SearchBar onSelect={onSelect} />)
    const input = screen.getByLabelText('Search cities')
    await user.type(input, 'Paris')

    await waitFor(() => {
      expect(screen.getByText('Paris')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Paris'))
    expect(onSelect).toHaveBeenCalledWith(paris())
  })

  it('shows no-results message when the API returns an empty list', async () => {
    const user = userEvent.setup()
    mockedSearchCities.mockResolvedValueOnce([])

    render(<SearchBar onSelect={vi.fn()} />)
    const input = screen.getByLabelText('Search cities')
    await user.type(input, 'Zzzz')

    await waitFor(() => {
      expect(
        screen.getByText('No cities matched — try a different spelling.')
      ).toBeInTheDocument()
    })
  })

  it('clears results when input is cleared', async () => {
    const user = userEvent.setup()
    mockedSearchCities.mockResolvedValueOnce([paris()])

    render(<SearchBar onSelect={vi.fn()} />)
    const input = screen.getByLabelText('Search cities')

    await user.type(input, 'Paris')
    await waitFor(() => {
      expect(screen.getByText('Paris')).toBeInTheDocument()
    })

    await user.clear(input)
    await waitFor(() => {
      expect(screen.queryByText('Paris')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Type a city name to search.')).toBeInTheDocument()
  })

  it('recovers gracefully when searchCities rejects', async () => {
    const user = userEvent.setup()
    mockedSearchCities.mockRejectedValueOnce(new Error('network'))

    render(<SearchBar onSelect={vi.fn()} />)
    const input = screen.getByLabelText('Search cities')
    await user.type(input, 'BadQuery')

    await waitFor(() => {
      expect(
        screen.getByText('No cities matched — try a different spelling.')
      ).toBeInTheDocument()
    })
  })
})
