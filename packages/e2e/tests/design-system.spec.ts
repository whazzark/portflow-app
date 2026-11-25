import { expect, type Page, test } from '@playwright/test'

import { STORYBOOK_URL } from '../constants.ts'
import { expectNoHorizontalScroll } from '../support/layout.ts'

// The design system (#14, ADR 0019), through its built Storybook: the showcase and the
// templates are usable at a phone width and at a desktop width. Chore, so no requirement
// to reference.

/** Opens one story alone, as the iframe of Storybook shows it. */
async function openStory(page: Page, id: string): Promise<void> {
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=${id}&viewMode=story`)
  await expect(page.getByRole('main')).toBeVisible()
}

test('the showcase shows every part and switches theme and density without reloading', async ({
  page,
}) => {
  await openStory(page, 'showcase-overview--overview')

  for (const section of [
    'Buttons and badges',
    'Form controls',
    'Overlays',
    'Tabs',
    'States',
    'Responsive table',
  ]) {
    await expect(page.getByRole('region', { name: section })).toBeVisible()
  }
  await expectNoHorizontalScroll(page)

  // A mark on the window survives only if the page is not loaded again.
  await page.evaluate(() => Object.assign(window, { notReloaded: true }))
  const html = page.locator('html')

  await page.getByRole('combobox', { name: 'Theme' }).click()
  await page.getByRole('option', { name: 'contrast' }).click()
  await expect(html).toHaveAttribute('data-theme', 'contrast')

  await page.getByRole('combobox', { name: 'Density' }).click()
  await page.getByRole('option', { name: 'field' }).click()
  await expect(html).toHaveAttribute('data-density', 'field')
  await expect(page.getByRole('button', { name: 'Primary' })).toHaveCSS('height', '44px')

  expect(await page.evaluate(() => 'notReloaded' in window)).toBe(true)
  await expectNoHorizontalScroll(page)
})

test('the office layout keeps its navigation and its content reachable', async ({ page }) => {
  await openStory(page, 'templates-office-layout--default')

  const navigation = page.getByRole('navigation', { name: 'Sections' })
  const lastSection = navigation.getByRole('link', { name: 'Settings' })
  await lastSection.scrollIntoViewIfNeeded()
  await expect(lastSection).toBeInViewport()
  await expect(page.getByRole('table', { name: 'Vessels of the week' })).toBeVisible()
  await expectNoHorizontalScroll(page)
})

test('the field layout keeps its actions in reach, as touch targets', async ({ page }) => {
  await openStory(page, 'templates-field-layout--default')

  await expect(page.getByRole('heading', { level: 1, name: 'Record a weighing' })).toBeVisible()
  const record = page.getByRole('button', { name: 'Record' })
  await expect(record).toBeInViewport()
  const box = await record.boundingBox()
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  await expectNoHorizontalScroll(page)
})

test('the page layout shows its title', async ({ page }) => {
  await openStory(page, 'templates-page-layout--default')

  await expect(page.getByRole('heading', { level: 1, name: 'Service health' })).toBeVisible()
  await expectNoHorizontalScroll(page)
})
