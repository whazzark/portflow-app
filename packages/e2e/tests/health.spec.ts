import { expect, test } from '@playwright/test'

import { expectNoHorizontalScroll } from '../support/layout.ts'

// The walking skeleton (#11): the browser reaches the API and its database through the
// web app, under one origin. Chore, so no requirement to reference.
test('shows that the service and its database are up', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Service health' })).toBeVisible()
  const components = page.getByRole('table', { name: 'Components' })
  await expect(components.getByRole('row', { name: 'Service Up' })).toBeVisible()
  await expect(components.getByRole('row', { name: 'Database Up' })).toBeVisible()
  await expectNoHorizontalScroll(page)
})
