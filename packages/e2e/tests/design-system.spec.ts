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

type Focus = { name: string; visible: boolean; reason: string }

/**
 * Measures the focus indicator of the element that has the focus, in the page: undefined
 * when nothing in the story has the focus or when it comes back to an element already
 * measured. The indicator is an outline or a ring (a box-shadow with a spread and no blur)
 * whose colour, once its transition is over, made opaque by the opacity of the element and
 * its ancestors, reaches 3:1 against the page, and that no scrolling ancestor cuts off.
 */
async function measureFocus(page: Page): Promise<Focus | undefined> {
  return page.evaluate(async () => {
    const element = document.activeElement as HTMLElement | null
    if (!element || element === document.body || element.dataset.focusMeasured) return undefined
    element.dataset.focusMeasured = 'true'
    await Promise.all(
      element
        .getAnimations()
        .filter((animation) => animation instanceof CSSTransition)
        .map((animation) => animation.finished.catch(() => undefined)),
    )

    // Any CSS colour (rgb, oklab, color-mix…) to RGBA through a canvas; an unreadable one
    // stays transparent, so it counts as not visible.
    const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    const rgba = (colour: string): number[] => {
      if (!context) return [0, 0, 0, 0]
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = 'transparent'
      context.fillStyle = colour
      context.fillRect(0, 0, 1, 1)
      return [...context.getImageData(0, 0, 1, 1).data]
    }
    // These run in the page, which cannot reach the helpers of this file.
    // oxlint-disable-next-line unicorn/consistent-function-scoping
    const relativeLuminance = ([red = 0, green = 0, blue = 0]: number[]) =>
      [red, green, blue]
        .map((value) => value / 255)
        .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0)
    const ratio = (first: number[], second: number[]) => {
      const [light, dark] = [relativeLuminance(first), relativeLuminance(second)].toSorted(
        (a, b) => b - a,
      )
      return (light! + 0.05) / (dark! + 0.05)
    }

    let opacity = 1
    for (let node: HTMLElement | null = element; node; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity)
    }
    const pageColour = rgba(getComputedStyle(document.body).backgroundColor)
    const style = getComputedStyle(element)

    const drawn: { colour: string; width: number }[] = []
    if (style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 1) {
      drawn.push({
        colour: style.outlineColor,
        width: Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset),
      })
    }
    for (const shadow of style.boxShadow.split(/,(?![^(]*\))/)) {
      const lengths = (shadow.match(/-?[\d.]+px/g) ?? []).map(Number.parseFloat)
      if ((lengths[3] ?? 0) >= 1 && (lengths[2] ?? 0) === 0 && !shadow.includes('inset')) {
        drawn.push({ colour: shadow.replace(/\s+-?[\d.]+px.*$/, '').trim(), width: lengths[3]! })
      }
    }

    // A scrolling ancestor cuts off what is drawn outside its box.
    const box = element.getBoundingClientRect()
    const cutOff = (width: number) => {
      for (let node = element.parentElement; node; node = node.parentElement) {
        const { overflowX, overflowY } = getComputedStyle(node)
        if (overflowX === 'visible' && overflowY === 'visible') continue
        const area = node.getBoundingClientRect()
        if (
          box.left - width < area.left - 0.5 ||
          box.right + width > area.right + 0.5 ||
          box.top - width < area.top - 0.5 ||
          box.bottom + width > area.bottom + 0.5
        ) {
          return true
        }
      }
      return false
    }

    const name = `${element.tagName.toLowerCase()} "${(element.textContent ?? element.getAttribute('aria-label') ?? '').trim().slice(0, 30)}"`
    const reasons = drawn.map(({ colour, width }) => {
      const [red = 0, green = 0, blue = 0, alpha = 0] = rgba(colour)
      if ((alpha / 255) * opacity < 1) return `${colour} is not opaque`
      if (ratio([red, green, blue], pageColour) < 3) return `${colour} is below 3:1`
      if (cutOff(width)) return `${colour} is cut off`
      return ''
    })
    const visible = reasons.includes('')
    return { name, visible, reason: visible ? '' : reasons.join('; ') || 'nothing drawn' }
  })
}

/** Tabs through what has the focus and returns each element whose focus cannot be seen. */
async function tabThrough(
  page: Page,
  where: string,
): Promise<{ measured: number; unseen: string[] }> {
  const unseen: string[] = []
  let measured = 0
  for (let step = 0; step < 40; step += 1) {
    await page.keyboard.press('Tab')
    const focus = await measureFocus(page)
    if (!focus) break
    measured += 1
    if (!focus.visible) unseen.push(`${where}: ${focus.name}: ${focus.reason}`)
  }
  return { measured, unseen }
}

for (const theme of ['light', 'dark', 'contrast'] as const) {
  test(`every element of every story shows the keyboard focus, ${theme} theme`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const index = await (await page.request.get(`${STORYBOOK_URL}/index.json`)).json()
    const stories = Object.values(index.entries as Record<string, { id: string; type: string }>)
      .filter((entry) => entry.type === 'story')
      .map((entry) => entry.id)

    let measured = 0
    const unseen: string[] = []
    for (const id of stories) {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
      await expect(page.locator('#storybook-root > *').first()).toBeAttached()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      const result = await tabThrough(page, id)
      measured += result.measured
      unseen.push(...result.unseen)
    }
    expect(measured).toBeGreaterThan(20)
    expect(unseen).toEqual([])
  })

  test(`the open dialog and the toasts show the keyboard focus, ${theme} theme`, async ({
    page,
  }) => {
    const unseen: string[] = []

    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=atoms-dialog--default&viewMode=story&globals=theme:${theme}`,
    )
    await page.getByRole('button', { name: 'Close the hold' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    const dialog = await tabThrough(page, 'dialog')
    expect(dialog.measured).toBeGreaterThanOrEqual(3)
    unseen.push(...dialog.unseen)

    await page.goto(
      `${STORYBOOK_URL}/iframe.html?id=atoms-toast--kinds&viewMode=story&globals=theme:${theme}`,
    )
    await page.getByRole('button', { name: 'Success' }).click()
    await expect(page.locator('[data-sonner-toast]')).toBeVisible()
    // Sonner's shortcut moves the focus to the list of toasts, then Tab to the toast.
    await page.keyboard.press('Alt+KeyT')
    const list = await measureFocus(page)
    expect(list?.name).toMatch(/^ol/)
    if (list && !list.visible) unseen.push(`toast list: ${list.reason}`)
    await page.keyboard.press('Tab')
    const toast = await measureFocus(page)
    expect(toast).toBeDefined()
    if (toast && !toast.visible) unseen.push(`toast: ${toast.reason}`)

    expect(unseen).toEqual([])
  })
}

test('every story fits the width of the window', async ({ page }) => {
  const index = await (await page.request.get(`${STORYBOOK_URL}/index.json`)).json()
  const stories = Object.values(index.entries as Record<string, { id: string; type: string }>)
    .filter((entry) => entry.type === 'story')
    .map((entry) => entry.id)
  expect(stories.length).toBeGreaterThan(0)

  for (const id of stories) {
    await gotoStory(page, id)
    // The story has rendered: its root holds an element (a skeleton holds no text).
    await expect(page.locator('#storybook-root > *').first()).toBeAttached()
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
