import { expect, test } from '@playwright/test'

test('app loads with header and under-construction copy', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Weather App', level: 1 })).toBeVisible()
  await expect(page.getByText(/under construction/i)).toBeVisible()
})

test('theme toggle button flips the dark class on <html>', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByRole('button', { name: /^Switch to/ })
  await expect(toggle).toBeVisible()

  const htmlHadDarkBefore = await page.evaluate(() =>
    document.documentElement.classList.contains('dark')
  )

  await toggle.click()

  // Wait for the state to actually flip.
  await expect
    .poll(async () =>
      page.evaluate(() => document.documentElement.classList.contains('dark'))
    )
    .toBe(!htmlHadDarkBefore)
})
