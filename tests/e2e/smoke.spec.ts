import { expect, test } from '@playwright/test'

const forecastFixture = {
  latitude: 41.88,
  longitude: -87.63,
  timezone: 'America/Chicago',
  current: {
    time: '2026-07-02T15:00',
    temperature_2m: 21.4,
    apparent_temperature: 20.1,
    relative_humidity_2m: 62,
    wind_speed_10m: 12.3,
    wind_direction_10m: 180,
    weather_code: 1,
    is_day: 1,
    precipitation: 0,
  },
  hourly: {
    time: ['2026-07-02T15:00'],
    temperature_2m: [21.4],
    weather_code: [1],
    precipitation_probability: [10],
  },
  daily: {
    time: ['2026-07-02'],
    weather_code: [1],
    temperature_2m_max: [24],
    temperature_2m_min: [15],
    sunrise: ['2026-07-02T05:15'],
    sunset: ['2026-07-02T20:30'],
    uv_index_max: [6.5],
    precipitation_probability_max: [10],
  },
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecastFixture),
    })
  })
})

test('app loads with header and a working unit toggle', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Weather App', level: 1 })).toBeVisible()

  const unitToggle = page.getByRole('button', { name: /^Switch to (Celsius|Fahrenheit)$/ })
  await expect(unitToggle).toBeVisible()
})

test('hero renders once weather data loads', async ({ page }) => {
  await page.goto('/')

  // The mock returns "Mainly clear" (code 1). Hero should show it.
  await expect(page.getByText(/Mainly clear/i)).toBeVisible()
  // And a "Feels like" line.
  await expect(page.getByText(/Feels like/i)).toBeVisible()
})

test('theme toggle button flips the dark class on <html>', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByRole('button', { name: /^Switch to (light|dark) mode$/ })
  await expect(toggle).toBeVisible()

  const htmlHadDarkBefore = await page.evaluate(() =>
    document.documentElement.classList.contains('dark')
  )

  await toggle.click()

  await expect
    .poll(async () =>
      page.evaluate(() => document.documentElement.classList.contains('dark'))
    )
    .toBe(!htmlHadDarkBefore)
})
