import { describe, expect, it } from 'vitest'

import { buildEmail, shouldAlert } from './send-rain-alerts.mjs'

const THRESHOLDS = { precipMmMin: 5, thunderstormCodes: [95, 96, 99] }

describe('shouldAlert', () => {
  it('fires when precipitation meets the threshold', () => {
    const decision = shouldAlert({ precipitation_sum: 8, weather_code: 61 }, THRESHOLDS)
    expect(decision.fire).toBe(true)
    expect(decision.meetsPrecip).toBe(true)
  })

  it('fires when a thunderstorm code is present regardless of precipitation', () => {
    const decision = shouldAlert({ precipitation_sum: 1, weather_code: 95 }, THRESHOLDS)
    expect(decision.fire).toBe(true)
    expect(decision.meetsStorm).toBe(true)
  })

  it('does not fire when neither threshold is met', () => {
    const decision = shouldAlert({ precipitation_sum: 2, weather_code: 3 }, THRESHOLDS)
    expect(decision.fire).toBe(false)
  })

  it('handles missing fields as zeros', () => {
    const decision = shouldAlert({}, THRESHOLDS)
    expect(decision.fire).toBe(false)
    expect(decision.precipMm).toBe(0)
  })
})

describe('buildEmail', () => {
  const city = { name: 'Bangkok', country: 'Thailand', lat: 13.76, lng: 100.5, timezone: 'Asia/Bangkok' }
  const daily = {
    weather_code: 63,
    temperature_2m_max: 32,
    temperature_2m_min: 26,
    precipitation_sum: 12,
    precipitation_probability_max: 80,
  }

  it('mentions the city name in the subject when raining', () => {
    const decision = shouldAlert(daily, THRESHOLDS)
    const email = buildEmail(city, daily, decision)
    expect(email.subject).toContain('Bangkok')
    expect(email.subject.toLowerCase()).toContain('rain')
  })

  it('uses a storm subject when a thunderstorm code is detected', () => {
    const stormy = { ...daily, weather_code: 95 }
    const decision = shouldAlert(stormy, THRESHOLDS)
    const email = buildEmail(city, stormy, decision)
    expect(email.subject.toLowerCase()).toContain('storm')
  })

  it('includes weather label, precip total, and temp range in the body', () => {
    const decision = shouldAlert(daily, THRESHOLDS)
    const email = buildEmail(city, daily, decision)
    expect(email.text).toContain('Rain')
    expect(email.text).toContain('12.0 mm')
    expect(email.text).toContain('26° / 32°')
  })
})
