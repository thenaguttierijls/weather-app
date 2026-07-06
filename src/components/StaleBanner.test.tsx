import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StaleBanner } from './StaleBanner'

describe('StaleBanner', () => {
  it('renders a live-polite region so screen readers announce the stale state', () => {
    render(
      <StaleBanner
        staleSince="2026-07-06T11:55:00Z"
        now={new Date('2026-07-06T12:00:00Z')}
      />
    )
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
  })

  it('shows a human-readable relative time', () => {
    render(
      <StaleBanner
        staleSince="2026-07-06T11:55:00Z"
        now={new Date('2026-07-06T12:00:00Z')}
      />
    )
    expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument()
  })

  it('includes a plain-language reassurance about refreshing', () => {
    render(
      <StaleBanner
        staleSince="2026-07-06T11:00:00Z"
        now={new Date('2026-07-06T12:00:00Z')}
      />
    )
    expect(screen.getByText(/refresh when your connection is back/i)).toBeInTheDocument()
  })
})
