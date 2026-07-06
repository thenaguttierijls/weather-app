import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as geocodingModule from '@/api/geocoding'
import { useCitiesStore } from '@/stores/useCitiesStore'
import { useSelectedCityStore } from '@/stores/useSelectedCityStore'

import { SearchOverlay } from './SearchOverlay'

describe('SearchOverlay', () => {
  beforeEach(() => {
    localStorage.clear()
    useCitiesStore.setState({ cities: [], sortMode: 'recent' })
    useSelectedCityStore.setState({ city: null })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders dialog when open', () => {
    render(<SearchOverlay open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render dialog content when open is false', () => {
    render(<SearchOverlay open={false} onOpenChange={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not render a recents chip row', () => {
    useCitiesStore.setState({
      cities: [
        {
          id: 'a',
          name: 'Chicago',
          country: 'US',
          lat: 41.88,
          lng: -87.63,
          timezone: 'UTC',
          addedAt: '2026-07-01T00:00:00Z',
          isPinned: false,
        },
      ],
      sortMode: 'recent',
    })
    render(<SearchOverlay open={true} onOpenChange={vi.fn()} />)
    expect(
      screen.queryByRole('button', { name: /^Chicago$/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Load weather for Chicago/ })
    ).not.toBeInTheDocument()
  })

  it('closes when ESC is pressed', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<SearchOverlay open={true} onOpenChange={onOpenChange} />)

    await user.keyboard('{Escape}')

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('picking a result adds to cities store, sets selected city, and closes overlay', async () => {
    vi.spyOn(geocodingModule, 'searchCities').mockResolvedValue([
      {
        id: 1,
        name: 'Tokyo',
        country: 'Japan',
        latitude: 35.68,
        longitude: 139.65,
        timezone: 'Asia/Tokyo',
      },
    ])
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<SearchOverlay open={true} onOpenChange={onOpenChange} />)

    const input = screen.getByLabelText('Search cities')
    await user.type(input, 'Tokyo')
    const row = await screen.findByRole('button', { name: /Tokyo/ })
    await user.click(row)

    expect(
      useCitiesStore.getState().cities.some((c) => c.name === 'Tokyo')
    ).toBe(true)
    expect(useSelectedCityStore.getState().city?.name).toBe('Tokyo')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
