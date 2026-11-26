// @vitest-environment node
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { compile } from 'tailwindcss'
import { beforeAll, describe, expect, test } from 'vitest'

import {
  RADIUS_ROLES,
  SHADOW_ROLES,
  SPACING_ROLES,
  TYPE_ROLES,
} from '@portflow/design-system/styles/constants'

/*
 * The utilities `theme.css` gives a consumer: the semantic ones, which name a role, and
 * the raw scale, kept until the atoms have moved to the semantic ones.
 */

const STYLES = fileURLToPath(new URL('./', import.meta.url))
const PACKAGE = join(STYLES, '..', '..')
const TOKENS = readFileSync(join(STYLES, 'tokens.css'), 'utf8')

/** Resolves `@import` as a consumer's bundler does: a package by its `style` export. */
async function loadStylesheet(id: string, base: string) {
  if (id.startsWith('.')) {
    const path = join(base, id)

    return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
  }
  const root = join(PACKAGE, 'node_modules', id)
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const path = join(root, manifest.style ?? manifest.exports['.'].style)

  return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
}

let build: (candidates: string[]) => string

beforeAll(async () => {
  const compiler = await compile(`@import 'tailwindcss';\n@import './theme.css';`, {
    base: STYLES,
    loadStylesheet,
  })
  build = (candidates) => compiler.build(candidates)
})

/** The declarations of the rule of one utility, as `property: value` lines. */
function rule(utility: string): string {
  const css = build([utility])
  const body = new RegExp(String.raw`\.${utility}\s*\{([^}]*)\}`).exec(css)?.[1] ?? ''

  return body.trim()
}

describe('the semantic utilities', () => {
  test.each(TYPE_ROLES)('text-%s sets the size, the line height and the weight', (role) => {
    const declarations = rule(`text-${role}`)
    expect(declarations).toMatch(/font-size:/)
    expect(declarations).toMatch(/line-height:/)
    expect(declarations).toMatch(/font-weight:/)
  })

  test.each(RADIUS_ROLES)('rounded-%s sets a radius', (role) => {
    expect(rule(`rounded-${role}`)).toMatch(/border-radius:/)
  })

  test.each(SHADOW_ROLES)('shadow-%s sets a shadow', (role) => {
    expect(rule(`shadow-${role}`)).toMatch(/box-shadow:/)
  })

  test.each([
    ['bg-info', /background-color: var\(--info\)/],
    ['text-info-foreground', /color: var\(--info-text\)/],
  ])('%s draws the info colour', (utility, declaration) => {
    expect(rule(utility)).toMatch(declaration)
  })
})

/** The `--name: value` declarations of the first block whose selector holds `selector`. */
function block(selector: string): Map<string, string> {
  const blocks = [...TOKENS.replaceAll(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  const body = blocks.find(([, head = '']) => head.includes(selector))?.[2] ?? ''

  return new Map(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name = '', value = '']) => [
      name,
      value.trim(),
    ]),
  )
}

describe('the type sizes that follow the density', () => {
  const office = block(`[data-density='office']`)
  const field = block(`[data-density='field']`)
  const coarse = block(`:root:not([data-density])`)

  test.each(['body', 'control', 'label'])('text-%s reads its size from the density', (role) => {
    expect(rule(`text-${role}`)).toMatch(
      new RegExp(String.raw`font-size: var\(--type-${role}-size\)`),
    )
    for (const density of [office, field, coarse]) {
      expect(density.get(`type-${role}-size`)).toBeDefined()
      expect(density.get(`type-${role}-line-height`)).toBeDefined()
    }
  })

  test('a touch screen with no density chosen gets the sizes of the field density', () => {
    expect(coarse).toEqual(field)
  })
})

describe('the raw scale, until the atoms have moved', () => {
  test.each([
    ['text-sm', /font-size:/],
    ['text-2xl', /font-size:/],
    ['rounded-md', /border-radius:/],
    ['shadow-xs', /box-shadow:/],
  ])('%s still works', (utility, declaration) => {
    expect(rule(utility)).toMatch(declaration)
  })
})

describe('the roles that cn knows', () => {
  const THEME = readFileSync(join(STYLES, 'theme.css'), 'utf8')
  const RAW = /^(xs|sm|md|lg|xl|2xl|base)$/

  /** The names `theme.css` declares under a namespace, the raw steps aside. */
  function names(namespace: string): string[] {
    const declared = [
      ...THEME.matchAll(new RegExp(String.raw`--${namespace}-([a-z0-9]+(?:-[a-z0-9]+)*):`, 'g')),
    ]

    return [
      ...new Set(declared.map(([, name = '']) => name).filter((name) => !RAW.test(name))),
    ].toSorted()
  }

  test.each([
    ['text', TYPE_ROLES],
    ['radius', RADIUS_ROLES],
    ['shadow', SHADOW_ROLES],
    ['spacing', SPACING_ROLES],
  ])('every semantic %s of theme.css is listed in constants.ts', (namespace, roles) => {
    expect(names(namespace)).toEqual([...roles].toSorted())
  })
})
