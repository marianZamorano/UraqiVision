import { expect, test } from '@playwright/test'

test('home page stays clear of Cesium and heavy globe assets before explore', async ({ page }) => {
  const heavyRequests: string[] = []

  page.on('request', (request) => {
    const url = request.url()
    if (/cesium|globe|manual-chunk|chunk/i.test(url)) {
      heavyRequests.push(url)
    }
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  expect(heavyRequests).toEqual([])
  await expect(page.getByRole('link', { name: /explorar bolivia|explore bolivia/i })).toBeVisible()

  await page.getByRole('link', { name: /explorar bolivia|explore bolivia/i }).click()

  await expect.poll(
    () => heavyRequests.some((url) => /cesium/i.test(url)),
    { message: 'Cesium should load only after entering the explorer' },
  ).toBe(true)
})
