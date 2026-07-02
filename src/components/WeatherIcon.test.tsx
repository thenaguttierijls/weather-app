import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { WeatherIcon } from './WeatherIcon'

describe('WeatherIcon', () => {
  it('renders with an aria-label matching the WMO label for a known code', () => {
    render(<WeatherIcon code={0} isDay={true} />)
    expect(screen.getByRole('img', { name: 'Clear sky' })).toBeInTheDocument()
  })

  it('honors a custom aria-label when provided', () => {
    render(<WeatherIcon code={0} isDay={true} aria-label="Sunshine now" />)
    expect(screen.getByRole('img', { name: 'Sunshine now' })).toBeInTheDocument()
  })

  it('renders the day variant when isDay is true', () => {
    render(<WeatherIcon code={2} isDay={true} />)
    const img = screen.getByRole('img', { name: 'Partly cloudy' })
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src') ?? '').toContain('partly-cloudy-day')
  })

  it('renders the night variant when isDay is false', () => {
    render(<WeatherIcon code={2} isDay={false} />)
    const img = screen.getByRole('img', { name: 'Partly cloudy' })
    expect(img.getAttribute('src') ?? '').toContain('partly-cloudy-night')
  })

  it('falls back gracefully for an unknown code', () => {
    render(<WeatherIcon code={999} isDay={true} />)
    expect(screen.getByRole('img', { name: 'Unknown conditions' })).toBeInTheDocument()
  })

  it('applies the size prop as width and height', () => {
    render(<WeatherIcon code={0} isDay={true} size={64} />)
    const img = screen.getByRole('img', { name: 'Clear sky' })
    expect(img.getAttribute('width')).toBe('64')
    expect(img.getAttribute('height')).toBe('64')
  })

  it('merges a custom className', () => {
    render(<WeatherIcon code={0} isDay={true} className="opacity-50" />)
    const img = screen.getByRole('img', { name: 'Clear sky' })
    expect(img.className).toContain('opacity-50')
  })
})
