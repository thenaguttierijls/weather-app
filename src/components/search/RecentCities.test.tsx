import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { WeatherCity } from '@/hooks/useWeather'
import { useRecentCitiesStore } from '@/stores/useRecentCitiesStore'
import { RecentCities } from './RecentCities'

function makeCity(name: string, country = 'France'): WeatherCity {
  return {
    name,
    country,
    lat: 0,
    lng: 0,
    timezone: 'UTC',
  }
}

describe('RecentCities', () => {
  beforeEach(() => {
    localStorage.clear()
    useRecentCitiesStore.setState({ cities: [] })
  })

  it('renders nothing when there are no recent cities', () => {
    const { container } = render(<RecentCities onSelect={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a Recent header and chips when there are cities', () => {
    useRecentCitiesStore.setState({
      cities: [makeCity('Paris'), makeCity('Berlin', 'Germany')],
    })

    render(<RecentCities onSelect={vi.fn()} />)

    expect(screen.getByText('Recent')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Paris' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Berlin' })).toBeInTheDocument()
  })

  it('calls onSelect with the city when a chip is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const paris = makeCity('Paris')
    useRecentCitiesStore.setState({ cities: [paris] })

    render(<RecentCities onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: 'Paris' }))

    expect(onSelect).toHaveBeenCalledWith(paris)
  })

  it('remove button removes the city from the store', async () => {
    const user = userEvent.setup()
    useRecentCitiesStore.setState({
      cities: [makeCity('Paris'), makeCity('Berlin', 'Germany')],
    })

    render(<RecentCities onSelect={vi.fn()} />)

    await user.click(
      screen.getByRole('button', { name: 'Remove Paris from recents' })
    )

    const remaining = useRecentCitiesStore.getState().cities
    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.name).toBe('Berlin')
  })
})
