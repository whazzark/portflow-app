import { expect, type Page, test } from '@playwright/test'

import { STORYBOOK_URL } from '../constants.ts'
import { expectNoHorizontalScroll } from '../support/layout.ts'

// The design system (#14, ADR 0019), through its built Storybook: the toolbar switches
// the theme and the density of a story without reloading it, and the templates are
// usable at a phone width and at a desktop width. Chore, so no requirement to reference.

/** Opens one story alone, as the iframe of Storybook shows it. */
async function openStory(page: Page, id: string): Promise<void> {
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=${id}&viewMode=story`)
  await expect(page.getByRole('main')).toBeVisible()
}

test('the toolbar switches theme and density without reloading the story', async ({
  page,
}, testInfo) => {
  // The toolbar is the one of Storybook, not a screen of Portflow: at a phone width
  // Storybook folds it away. The stories themselves are checked at both widths below.
  test.skip(testInfo.project.name === 'phone', 'the toolbar of Storybook is a desktop tool')

  await page.goto(`${STORYBOOK_URL}/?path=/story/atoms-button--default`)
  const story = page.frameLocator('#storybook-preview-iframe')
  const button = story.getByRole('button', { name: 'Save' })
  await expect(button).toBeVisible()

  // A mark on the window of the story survives only if the story is not loaded again.
  const frame = page.frame({ url: /iframe\.html/ })
  await frame?.evaluate(() => Object.assign(window, { notReloaded: true }))
  const html = story.locator('html')

  await page.getByRole('button', { name: /^Theme of the tokens/ }).click()
  await page
    .getByRole('listbox', { name: 'Theme of the tokens' })
    .getByRole('option', { name: 'contrast' })
    .click()
  await expect(html).toHaveAttribute('data-theme', 'contrast')

  await page.getByRole('button', { name: /^Density of the controls/ }).click()
  await page
    .getByRole('listbox', { name: 'Density of the controls' })
    .getByRole('option', { name: 'field' })
    .click()
  await expect(html).toHaveAttribute('data-density', 'field')
  await expect(button).toHaveCSS('height', '44px')

  expect(await frame?.evaluate(() => 'notReloaded' in window)).toBe(true)
})

// On a touch screen the field density is the default, but a density chosen by the
// document wins: the office density stays reachable on a tablet.
for (const [density, height] of [
  ['office', '36px'],
  ['field', '44px'],
] as const) {
  test(`the ${density} density gives controls ${height} high`, async ({ page }) => {
    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=atoms-button--default&viewMode=story&globals=density:${density}`,
    )
    await expect(page.locator('html')).toHaveAttribute('data-density', density)
    await expect(page.getByRole('button', { name: 'Save' })).toHaveCSS('height', height)
  })
}

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
