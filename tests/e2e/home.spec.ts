import { test, expect } from '@playwright/test'

test.describe('Connection Inspector home', () => {
  test('loads overview chrome and export actions', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Connection Inspector' })).toBeVisible()
    await expect(page.getByText('Client-side only')).toBeVisible()
    await expect(page.getByRole('button', { name: /Copy summary as JSON/i })).toBeVisible()
    await expect(page.getByText('Deep dive')).toBeVisible()
  })
})
