import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { UnitToggle } from './UnitToggle'
import { useUnitStore } from '@/stores/useUnitStore'

describe('UnitToggle', () => {
  beforeEach(() => {
    useUnitStore.setState({ unit: 'metric' })
  })

  it('renders "°C" when unit is metric', () => {
    useUnitStore.setState({ unit: 'metric' })
    render(<UnitToggle />)
    expect(screen.getByRole('button', { name: 'Switch to Fahrenheit' })).toHaveTextContent('°C')
  })

  it('renders "°F" when unit is imperial', () => {
    useUnitStore.setState({ unit: 'imperial' })
    render(<UnitToggle />)
    expect(screen.getByRole('button', { name: 'Switch to Celsius' })).toHaveTextContent('°F')
  })

  it('sets aria-label to "Switch to Fahrenheit" when metric', () => {
    useUnitStore.setState({ unit: 'metric' })
    render(<UnitToggle />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to Fahrenheit')
  })

  it('sets aria-label to "Switch to Celsius" when imperial', () => {
    useUnitStore.setState({ unit: 'imperial' })
    render(<UnitToggle />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to Celsius')
  })

  it('flips the unit in the store when clicked', async () => {
    const user = userEvent.setup()
    useUnitStore.setState({ unit: 'metric' })
    render(<UnitToggle />)

    expect(useUnitStore.getState().unit).toBe('metric')
    await user.click(screen.getByRole('button'))
    expect(useUnitStore.getState().unit).toBe('imperial')

    await user.click(screen.getByRole('button'))
    expect(useUnitStore.getState().unit).toBe('metric')
  })
})
