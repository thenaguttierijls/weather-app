import { describe, expect, it } from 'vitest'

import { defaultCityForTimezone } from './useTimezoneCity'

describe('defaultCityForTimezone', () => {
  it('returns Chicago for America/Chicago', () => {
    const city = defaultCityForTimezone('America/Chicago')
    expect(city.name).toBe('Chicago')
    expect(city.timezone).toBe('America/Chicago')
    expect(city.lat).toBeCloseTo(41.8781, 3)
    expect(city.lng).toBeCloseTo(-87.6298, 3)
  })

  it('returns Tokyo for Asia/Tokyo', () => {
    const city = defaultCityForTimezone('Asia/Tokyo')
    expect(city.name).toBe('Tokyo')
    expect(city.country).toBe('Japan')
  })

  it('returns Sydney for Australia/Sydney', () => {
    const city = defaultCityForTimezone('Australia/Sydney')
    expect(city.name).toBe('Sydney')
  })

  it('returns Auckland for Pacific/Auckland', () => {
    expect(defaultCityForTimezone('Pacific/Auckland').name).toBe('Auckland')
  })

  it('returns Lagos for Africa/Lagos', () => {
    expect(defaultCityForTimezone('Africa/Lagos').country).toBe('Nigeria')
  })

  it('falls back to Chicago for an unknown timezone', () => {
    const city = defaultCityForTimezone('Mars/Olympus_Mons')
    expect(city.name).toBe('Chicago')
    expect(city.timezone).toBe('America/Chicago')
  })

  it('falls back for an empty string', () => {
    expect(defaultCityForTimezone('').name).toBe('Chicago')
  })

  it.each([
    'America/Los_Angeles',
    'America/New_York',
    'America/Denver',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Amsterdam',
    'Europe/Warsaw',
    'Europe/Moscow',
    'Europe/Istanbul',
    'Europe/Athens',
    'Europe/Dublin',
    'Europe/Stockholm',
    'Europe/Helsinki',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Seoul',
    'Asia/Bangkok',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Jakarta',
    'Asia/Manila',
    'Asia/Kuala_Lumpur',
    'Asia/Ho_Chi_Minh',
    'Australia/Melbourne',
    'Australia/Perth',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Africa/Nairobi',
  ])('has a mapping for %s', (tz) => {
    const city = defaultCityForTimezone(tz)
    expect(city.timezone).toBe(tz)
    expect(city.name.length).toBeGreaterThan(0)
  })
})
