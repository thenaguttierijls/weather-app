import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ThemeToggle } from './ThemeToggle'
import { useThemeStore } from '@/stores/useThemeStore'

describe('ThemeToggle', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' })
  })

  it('renders a button with an aria-label starting with "Switch to"', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    const label = button.getAttribute('aria-label') ?? ''
    expect(label.startsWith('Switch to')).toBe(true)
  })

  it('toggles the theme in the store when clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    expect(useThemeStore.getState().theme).toBe('light')

    const button = screen.getByRole('button')
    await user.click(button)

    expect(useThemeStore.getState().theme).toBe('dark')
  })
})
