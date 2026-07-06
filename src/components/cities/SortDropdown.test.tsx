import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SortDropdown } from './SortDropdown'
import { useCitiesStore } from '@/stores/useCitiesStore'

describe('SortDropdown', () => {
  beforeEach(() => {
    localStorage.clear()
    useCitiesStore.setState({ cities: [], sortMode: 'recent' })
  })

  it('renders all three sort options', () => {
    render(<SortDropdown />)
    const select = screen.getByLabelText(/sort cities/i) as HTMLSelectElement
    const values = Array.from(select.options).map((o) => o.value)
    expect(values).toEqual(['recent', 'alpha', 'temp'])
  })

  it('reflects the current sortMode', () => {
    useCitiesStore.setState({ cities: [], sortMode: 'alpha' })
    render(<SortDropdown />)
    const select = screen.getByLabelText(/sort cities/i) as HTMLSelectElement
    expect(select.value).toBe('alpha')
  })

  it('updates the store on change', async () => {
    const user = userEvent.setup()
    render(<SortDropdown />)
    const select = screen.getByLabelText(/sort cities/i)
    await user.selectOptions(select, 'temp')
    expect(useCitiesStore.getState().sortMode).toBe('temp')
  })
})
