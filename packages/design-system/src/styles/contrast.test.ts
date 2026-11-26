// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'

import { describe, expect, test } from 'vitest'

import { THEMES, type Theme } from '@portflow/design-system/styles/constants'

/*
 * WCAG AA in every theme: 4.5:1 for text, 3:1 for what must be seen without being read
 * (the border of a control, the focus ring, a filled button against the page).
 * Run `pnpm --filter @portflow/design-system test contrast` to see the ratios.
 */

const TOKENS = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

const TEXT = 4.5
const NON_TEXT = 3

/** [foreground, background, minimum ratio]: the pairs the components draw. */
const PAIRS: [string, string, number][] = [
  ['text', 'background', TEXT],
  ['text', 'surface', TEXT],
  ['text', 'surface-muted', TEXT],
  ['text-muted', 'background', TEXT],
  ['text-muted', 'surface', TEXT],
  ['text-muted', 'surface-muted', TEXT],
  ['primary', 'background', TEXT],
  ['primary', 'surface', TEXT],
  ['primary-text', 'primary', TEXT],
  ['secondary-text', 'secondary', TEXT],
  ['danger-text', 'danger', TEXT],
  ['success-text', 'success', TEXT],
  ['warning-text', 'warning', TEXT],
  ['border-strong', 'background', NON_TEXT],
  ['border-strong', 'surface', NON_TEXT],
  ['ring', 'background', NON_TEXT],
  ['ring', 'surface', NON_TEXT],
  ['ring', 'surface-muted', NON_TEXT],
  // The border of an invalid control, and the error text under a field of a form.
  ['danger', 'background', TEXT],
  ['danger', 'surface', TEXT],
]

/** The colours a theme declares, the light ones under the dark and contrast ones. */
function colours(theme: Theme): Map<string, string> {
  const blocks = [...TOKENS.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  const values = new Map<string, string>()
  for (const [, selector, body] of blocks) {
    if (!selector || !body) continue
    const applies =
      selector.includes(`[data-theme='${theme}']`) ||
      (theme !== 'light' && selector.includes(`[data-theme='light']`))
    if (!applies) continue
    const own = selector.includes(`[data-theme='${theme}']`)
    for (const [, name, value] of body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
      if (name && value && (own || !values.has(name))) values.set(name, value)
    }
  }
  return values
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const [red = 0, green = 0, blue = 0] = channels
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].toSorted((a, b) => b - a)
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
}

describe.each(THEMES)('the %s theme', (theme) => {
  const values = colours(theme)

  test.each(PAIRS)('%s on %s reaches %s:1', (foreground, background, minimum) => {
    const fg = values.get(foreground)
    const bg = values.get(background)
    expect(fg, `--${foreground} in ${theme}`).toBeDefined()
    expect(bg, `--${background} in ${theme}`).toBeDefined()
    const ratio = contrast(fg ?? '', bg ?? '')
    console.info(`${theme}\t${foreground} on ${background}\t${ratio.toFixed(2)}:1`)
    expect(ratio).toBeGreaterThanOrEqual(minimum)
  })
})

/*
 * The ratios above hold only for the tokens they name, drawn opaque. Every focus
 * indicator of the components and of the web app is drawn with those tokens: a ring or
 * an outline in `ring` (or `destructive` on an invalid control), a focused option on
 * `primary`. Any other colour, or an alpha, could blend below 3:1.
 */
const SOURCES = [
  new URL('../', import.meta.url),
  new URL('../../../../apps/web/src/', import.meta.url),
]

const RING = /(?<![\w-])(?:[\w-]+:|\[[^\]]*\]:)*(ring|outline)-([^\s'"`;!]+)/g
const RING_ALLOWED =
  /^(\d+(\.\d+)?|inset|offset-\d+|offset-background|ring|destructive|none|hidden)$/
// A chain of variants holding a focus or highlight state, named groups and arbitrary
// variants included: `focus:`, `dark:focus:`, `group-focus/tabs:`, `focus-within:`,
// `data-[state=open]:focus:`, `has-[:focus-visible]:`, `data-highlighted:`, `[&:focus]:`.
// What it colours on focus (fill, border, shadow, inset ring) must be a tested token.
const VARIANTS = String.raw`(?:[\w-]+(?:\/[\w-]+)?:|[\w-]*\[[^\]]*\](?:\/[\w-]+)?:|\*:)*`
const FOCUS = String.raw`(?:[\w-]*focus[\w-]*(?:\/[\w-]+)?|has-\[[^\]]*focus[^\]]*\]|data-\[?highlighted\]?|\[&:focus[^\]]*\])`
const FOCUS_BACKGROUND = new RegExp(
  String.raw`(?:^|\s|['"\x60])${VARIANTS}${FOCUS}:${VARIANTS}!?(?:bg|border|shadow|inset-ring)-([^\s'"\x60;!]+)`,
  'g',
)
// A focused element may fill with primary, or draw its border in ring or destructive.
const FOCUS_BACKGROUND_ALLOWED = /^(primary|ring|destructive)$/

test('every focus indicator is drawn with a tested token, opaque', () => {
  const lines = SOURCES.flatMap((root) =>
    readdirSync(root, { recursive: true, encoding: 'utf8' })
      .filter((path) => /\.(tsx?|css)$/.test(path) && !/\.(test|stories)\.tsx?$/.test(path))
      .flatMap((path) =>
        readFileSync(new URL(path, root), 'utf8')
          .split('\n')
          .map((line, index) => ({ where: `${path}:${index + 1}`, line })),
      ),
  )
  const refused = lines.flatMap(({ where, line }) => [
    ...[...line.matchAll(RING)]
      .filter(([, , value = '']) => !RING_ALLOWED.test(value))
      .map(([match]) => `${where} ${match}`),
    ...[...line.matchAll(FOCUS_BACKGROUND)]
      .filter(([, value = '']) => !FOCUS_BACKGROUND_ALLOWED.test(value))
      .map(([match]) => `${where} ${match.trim()}`),
  ])
  expect(refused).toEqual([])
})
