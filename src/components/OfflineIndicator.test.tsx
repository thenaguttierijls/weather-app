import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OfflineIndicator } from './OfflineIndicator'

describe('OfflineIndicator', () => {
  it('exposes an accessible "You are offline" label', () => {
    render(<OfflineIndicator />)
    const status = screen.getByRole('status', { name: 'You are offline' })
    expect(status).toBeInTheDocument()
  })
})
