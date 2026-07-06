import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { HeaderCitiesButton } from './HeaderCitiesButton'
import { useViewStore } from '@/stores/useViewStore'

describe('HeaderCitiesButton', () => {
  beforeEach(() => {
    useViewStore.setState({ view: 'detail' })
  })

  it('renders a button with an aria-label reflecting the current view', () => {
    render(<HeaderCitiesButton />)
    expect(screen.getByRole('button', { name: /show cities list/i })).toBeInTheDocument()
  })

  it('shows a different aria-label when view is cities', () => {
    useViewStore.setState({ view: 'cities' })
    render(<HeaderCitiesButton />)
    expect(screen.getByRole('button', { name: /show weather detail/i })).toBeInTheDocument()
  })

  it('toggles the view store when clicked', async () => {
    const user = userEvent.setup()
    render(<HeaderCitiesButton />)
    await user.click(screen.getByRole('button'))
    expect(useViewStore.getState().view).toBe('cities')
  })
})
