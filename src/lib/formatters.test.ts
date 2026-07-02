import { describe, expect, it } from 'vitest'

import {
  celsiusToFahrenheit,
  formatHumidity,
  formatPercent,
  formatTemp,
  formatTime,
  formatWeekday,
  formatWind,
  windDirectionLabel,
} from './formatters'

describe('celsiusToFahrenheit', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [37, 98.6],
  ])('converts %d°C to %d°F', (c, f) => {
    expect(celsiusToFahrenheit(c)).toBeCloseTo(f, 1)
  })
})

describe('formatTemp', () => {
  it.each<[number, 'C' | 'F', string]>([
    [21.4, 'C', '21°C'],
    [21.6, 'C', '22°C'],
    [0, 'C', '0°C'],
    [-5.5, 'C', '-5°C'],
    [21.4, 'F', '71°F'],
    [0, 'F', '32°F'],
    [-40, 'F', '-40°F'],
  ])('formats %d°C in %s as %s', (c, unit, expected) => {
    expect(formatTemp(c, unit)).toBe(expected)
  })
})

describe('formatWind', () => {
  it.each<[number, 'metric' | 'imperial', string]>([
    [0, 'metric', '0 kph'],
    [10.2, 'metric', '10 kph'],
    [100, 'metric', '100 kph'],
    [0, 'imperial', '0 mph'],
    [16.0934, 'imperial', '10 mph'],
    [100, 'imperial', '62 mph'],
  ])('formats %d kph in %s as %s', (kph, unit, expected) => {
    expect(formatWind(kph, unit)).toBe(expected)
  })
})

describe('formatHumidity', () => {
  it.each([
    [0, '0%'],
    [62.5, '63%'],
    [100, '100%'],
  ])('formats %d as %s', (pct, expected) => {
    expect(formatHumidity(pct)).toBe(expected)
  })
})

describe('formatPercent', () => {
  it('rounds and appends %', () => {
    expect(formatPercent(33.4)).toBe('33%')
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(100)).toBe('100%')
  })
})

describe('formatTime', () => {
  it('formats an ISO time in a given timezone', () => {
    const out = formatTime('2026-07-02T15:00:00Z', 'America/Chicago')
    expect(out).toMatch(/AM|PM/)
  })

  it('returns input when the date is unparseable', () => {
    expect(formatTime('not-a-date', 'America/Chicago')).toBe('not-a-date')
  })
})

describe('formatWeekday', () => {
  it('formats a date as a short weekday', () => {
    const out = formatWeekday('2026-07-02T00:00:00Z', 'UTC')
    expect(out).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/)
  })

  it('returns input when the date is unparseable', () => {
    expect(formatWeekday('nope', 'UTC')).toBe('nope')
  })
})

describe('windDirectionLabel', () => {
  it.each([
    [0, 'N'],
    [22.5, 'NNE'],
    [45, 'NE'],
    [90, 'E'],
    [180, 'S'],
    [270, 'W'],
    [360, 'N'],
    [-45, 'NW'],
    [720, 'N'],
  ])('maps %d° to %s', (deg, label) => {
    expect(windDirectionLabel(deg)).toBe(label)
  })
})
