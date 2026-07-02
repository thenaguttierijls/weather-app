import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HeaderSearchButton } from './HeaderSearchButton'

describe('HeaderSearchButton', () => {
  it('renders a button with the search aria-label', () => {
    render(<HeaderSearchButton onClick={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Search for a city' })
    expect(button).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<HeaderSearchButton onClick={onClick} />)

    await user.click(screen.getByRole('button', { name: 'Search for a city' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
