import { expect, type Page, test } from '@playwright/test'

import { STORYBOOK_URL } from '../constants.ts'
import { expectNoHorizontalScroll } from '../support/layout.ts'

// The design system (#14, ADR 0019), through its built Storybook: every story is usable
// at a phone width and at a desktop width, the toolbar switches the theme and the
// density without reloading, and what has the keyboard focus can be seen. Chore, so no
// requirement to reference.

/** Opens one story alone, as the iframe of Storybook shows it. */
async function openStory(page: Page, id: string): Promise<void> {
  await gotoStory(page, id)
  await expect(page.getByRole('main')).toBeVisible()
}

async function gotoStory(page: Page, id: string): Promise<void> {
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=${id}&viewMode=story`)
}

/** The relative luminance of a computed colour, `rgb(r, g, b)`. */
function luminance(colour: string): number {
  const [red = 0, green = 0, blue = 0] = (colour.match(/[\d.]+/g) ?? []).map((value) => {
    const channel = Number(value) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/** The WCAG contrast ratio of two computed colours. */
function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].toSorted((a, b) => b - a)
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
}

test('every story fits the width of the window', async ({ page }) => {
  const index = await (await page.request.get(`${STORYBOOK_URL}/index.json`)).json()
  const stories = Object.values(index.entries as Record<string, { id: string; type: string }>)
    .filter((entry) => entry.type === 'story')
    .map((entry) => entry.id)
  expect(stories.length).toBeGreaterThan(0)

  for (const id of stories) {
    await gotoStory(page, id)
    await expect(page.locator('#storybook-root')).not.toBeEmpty()
    await expectNoHorizontalScroll(page)
  }
})

test('the option that has the focus in a select can be seen', async ({ page }) => {
  await gotoStory(page, 'atoms-select--with-label')
  await page.getByRole('combobox', { name: 'Berth' }).focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowDown')

  const focused = page.locator('[role=option][data-highlighted]')
  await expect(focused).toHaveText('South quay')
  const [option, list] = await focused.evaluate((element) => [
    getComputedStyle(element).backgroundColor,
    getComputedStyle(element.closest('[data-slot=select-content]') ?? element).backgroundColor,
  ])
  expect(contrast(option ?? '', list ?? '')).toBeGreaterThanOrEqual(3)
})

test('a tab panel that has the focus shows it', async ({ page }) => {
  await gotoStory(page, 'atoms-tabs--default')
  await page.getByRole('tab', { name: 'Holds' }).focus()
  await page.keyboard.press('Tab')

  const panel = page.getByRole('tabpanel', { name: 'Holds' })
  await expect(panel).toBeFocused()
  const style = await panel.evaluate((element) => {
    const computed = getComputedStyle(element)
    return { shadow: computed.boxShadow, outline: computed.outlineStyle }
  })
  expect(style.shadow !== 'none' || style.outline !== 'none').toBe(true)
})

test('the action of a toast takes the height of a control', async ({ page }) => {
  await page.goto(
    `${STORYBOOK_URL}/iframe.html?id=molecules-undo-toast--default&viewMode=story&globals=density:field`,
  )
  await page.getByRole('button', { name: 'Delete the weighing' }).click()
  await expect(page.getByRole('button', { name: 'Undo' })).toHaveCSS('height', '44px')
})

// A document that chose no density takes the one of its pointer: the web app sets none.
test('a page with no density takes the one of the pointer', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.locator('html')).not.toHaveAttribute('data-density')
  const height = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--control-height').trim(),
  )
  expect(height).toBe(testInfo.project.name === 'phone' ? '2.75rem' : '2.25rem')
})

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
