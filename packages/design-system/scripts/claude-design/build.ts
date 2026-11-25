/**
 * Writes the design system of Claude Design from the package (ADR 0019), into
 * `claude-design/project/`: tokens.json, the brand book, a guideline and a live preview
 * per component, the bundle, its stylesheet and types, the cover, and the index.
 *
 * Run `pnpm --filter @portflow/design-system build:claude-design`, then publish the folder
 * to the Portflow design system (`.claude/rules/design-system.md`). With
 * `--index <published design-system.json>`, the index keeps every key of the published
 * one (its `createdOnFiles` marker included) and changes only what the code decides.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { COMPONENTS, COVER, README } from './content.ts'

const PACKAGE = fileURLToPath(new URL('../../', import.meta.url))
const OUT = join(PACKAGE, 'claude-design')
const PROJECT = join(OUT, 'project')
const NAMESPACE = 'Portflow'
const REACT_VERSION = '18.3.1'

const { values: args } = parseArgs({ options: { index: { type: 'string' } } })

function read(path: string): string {
  return readFileSync(join(PACKAGE, path), 'utf8')
}

function write(path: string, content: string): void {
  const file = join(PROJECT, path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}

function git(...gitArgs: string[]): string {
  return execFileSync('git', gitArgs, { cwd: PACKAGE, encoding: 'utf8' }).trim()
}

// --- Tokens -------------------------------------------------------------------------

/** The `--name: value` declarations of each block of a stylesheet, by selector. */
function declarations(css: string): { selector: string; values: Map<string, string> }[] {
  const withoutComments = css.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector = '', body = '']) => ({
    selector: selector.trim(),
    values: new Map(
      [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name = '', value = '']) => [
        name,
        value.replaceAll(/\s+/g, ' ').trim(),
      ]),
    ),
  }))
}

const COLOUR_USAGE: Record<string, string> = {
  background: 'The page behind everything.',
  surface: 'Cards, dialogs, menus, toasts, table rows: what sits on the page.',
  'surface-muted': 'A quiet area: the navigation of the office layout, hovered rows, skeletons.',
  text: 'Body text and headings, on background, surface and surface-muted.',
  'text-muted': 'Secondary text: captions, descriptions, placeholders, column names of a card.',
  border: 'Hairlines between rows and around cards: decoration, never the only boundary of a control.',
  'border-strong': 'The border of a control (input, select, checkbox): 3:1 on its ground.',
  ring: 'The focus ring of every control: 3:1 on the page.',
  primary: 'The main action of an area and links; text in primary reaches 4.5:1 on the page.',
  'primary-text': 'Text and icons on primary.',
  secondary: 'A secondary action, the current item of a navigation.',
  'secondary-text': 'Text on secondary.',
  danger: 'Deleting actions, refusals, the border of an error state.',
  'danger-text': 'Text on danger.',
  success: 'A success toast or status.',
  'success-text': 'Text on success.',
  warning: 'A warning toast or status.',
  'warning-text': 'Text on warning.',
  overlay: 'The veil behind a dialog.',
}

function colourTokens() {
  const blocks = declarations(read('src/styles/tokens.css'))
  const themes = ['light', 'dark', 'contrast'] as const
  const byTheme = Object.fromEntries(
    themes.map((theme) => [
      theme,
      blocks.find((block) => block.selector.includes(`[data-theme='${theme}']`))?.values ??
        new Map<string, string>(),
    ]),
  )
  return {
    themes: [
      { id: 'light', name: 'Light' },
      { id: 'dark', name: 'Dark' },
      { id: 'contrast', name: 'Contrast (sunlight)' },
    ],
    tokens: Object.keys(COLOUR_USAGE).map((name) => ({
      name,
      value: Object.fromEntries(themes.map((theme) => [theme, byTheme[theme]?.get(name)])),
      usage: COLOUR_USAGE[name],
    })),
  }
}

function densityTokens() {
  const blocks = declarations(read('src/styles/tokens.css'))
  const office = blocks.find((block) => block.selector.includes(`[data-density='office']`))
  const field = blocks.find((block) => block.selector.includes(`[data-density='field']`))
  const usage: Record<string, string> = {
    'control-height': 'The height of buttons, inputs, selects, tabs and table header rows.',
    'control-padding-x': 'The inner horizontal padding of buttons and inputs.',
    'cell-padding-y': 'The vertical padding of a table cell.',
  }
  return {
    note: 'Two densities, set by data-density: office (the default with a mouse) and field (the default with a touch screen, and always in the field layout).',
    tokens: Object.keys(usage).flatMap((name) => [
      { name: `${name}-office`, value: office?.values.get(name), usage: `Office: ${usage[name]}` },
      { name: `${name}-field`, value: field?.values.get(name), usage: `Field: ${usage[name]}` },
    ]),
  }
}

function themeValues(): Map<string, string> {
  const theme = read('src/styles/theme.css')
  const block = /@theme \{([\s\S]*?)\n\}/.exec(theme)?.[1] ?? ''
  return declarations(`x{${block}}`)[0]?.values ?? new Map()
}

function typeTokens(values: Map<string, string>) {
  const style = (name: string, fontWeight: number, usage: string) => ({
    name,
    fontSize: values.get(`text-${name}`),
    lineHeight: values.get(`text-${name}--line-height`),
    fontWeight,
    usage,
  })
  return {
    fonts: [],
    families: { sans: values.get('font-sans'), mono: values.get('font-mono') },
    groups: [
      {
        name: 'Headings',
        family: 'sans',
        styles: [
          style('2xl', 600, 'The title of a page (h1).'),
          style('xl', 600, 'The task of a field screen (h1 of the field layout).'),
          style('lg', 600, 'The title of a section, an empty state or a dialog.'),
        ],
      },
      {
        name: 'Text',
        family: 'sans',
        styles: [
          style('base', 400, 'Body text and inputs on a phone.'),
          style('sm', 400, 'Controls, tables and labels of office screens.'),
          style('xs', 400, 'Badges.'),
        ],
      },
    ],
  }
}

function listOf(values: Map<string, string>, prefix: string, usage: Record<string, string>) {
  return {
    tokens: Object.keys(usage).map((name) => ({
      name: `${prefix}-${name}`,
      value: values.get(`${prefix}-${name}`),
      usage: usage[name],
    })),
  }
}

function tokens(ref: string, repo: string) {
  const values = themeValues()
  return {
    name: 'Portflow',
    version: 1,
    color: colourTokens(),
    type: typeTokens(values),
    spacing: {
      note: 'The scale of Tailwind: one step is 0.25rem (4px).',
      tokens: [1, 2, 3, 4, 6, 8].map((step) => ({
        name: `space-${step}`,
        value: `${step * 4}px`,
        usage:
          step <= 2
            ? 'Gaps inside a control or between badges.'
            : step <= 4
              ? 'Gaps between fields, padding of cards and pages.'
              : 'Gaps between sections.',
      })),
    },
    radius: listOf(values, 'radius', {
      sm: 'Checkboxes, select items, small tiles.',
      md: 'Buttons, inputs, selects, toasts.',
      lg: 'Cards, dialogs, empty and error states.',
      xl: 'Large panels.',
    }),
    shadow: listOf(values, 'shadow', {
      xs: 'Buttons and inputs that are outlined.',
      sm: 'The active tab.',
      md: 'Menus and selects.',
      lg: 'Dialogs.',
    }),
    density: densityTokens(),
    meta: {
      source: 'github',
      repo,
      ref,
      package: 'packages/design-system',
      paths: {
        tokens: ['src/styles/tokens.css', 'src/styles/theme.css'],
        docs: ['.claude/rules/design-system.md', '.claude/rules/frontend.md'],
      },
      components: Object.fromEntries(
        COMPONENTS.map((component) => [component.name, 'src/']),
      ),
      synced: new Date().toISOString().slice(0, 10),
    },
  }
}

// --- Components ---------------------------------------------------------------------

function preview(component: (typeof COMPONENTS)[number]): string {
  return `<!-- @dsCard group="${component.group}" height=${component.height} -->
<!doctype html>
<html>
<head><meta charset="utf-8"><title>${component.name} — preview</title></head>
<body>
<div id="root" style="padding: 16px"></div>
<script>
  var P = window.${NAMESPACE}, h = React.createElement;
  ReactDOM.createRoot(document.getElementById('root')).render(
    ${component.render}
  );
</script>
</body>
</html>
`
}

/** The declarations of the package, one `declare module` per file, as documentation. */
function declarationsFile(): string {
  const types = join(OUT, 'types', 'src')
  const parts = ['atoms', 'molecules', 'templates'].flatMap((folder) =>
    readdirSync(join(types, folder))
      .filter((file) => file.endsWith('.d.ts') && !/\.(test|stories)\.d\.ts$/.test(file))
      .toSorted()
      .map((file) => {
        const name = `@portflow/design-system/${folder}/${file.replace(/\.d\.ts$/, '')}`
        const body = readFileSync(join(types, folder, file), 'utf8').trim()
        return `declare module '${name}' {\n${body.replaceAll(/^/gm, '  ')}\n}`
      }),
  )
  return `// The components of window.${NAMESPACE}, by the file of @portflow/design-system that declares them.\n\n${parts.join('\n\n')}\n`
}

function bundle(): string {
  const code = readFileSync(join(OUT, 'build', 'bundle.js'), 'utf8')
  if (/<\/script|<!--/i.test(code)) throw new Error('the bundle holds </script or <!--')
  const header = {
    format: 4,
    namespace: NAMESPACE,
    components: COMPONENTS.map(({ name }) => ({ name })),
  }
  return `/* @ds-bundle: ${JSON.stringify(header)} */\n${code}`
}

// --- Index --------------------------------------------------------------------------

function index(via: string, note: string) {
  const published = args.index ? JSON.parse(readFileSync(args.index, 'utf8')) : undefined
  const base = published ?? {
    v: 3,
    layout: 'files',
    createdOnFiles: { v: 1, at: new Date().toISOString() },
    title: 'Portflow',
    sections: {},
    groups: [],
    assetGroups: {},
    blobs: {},
    docs: { readme: 'project/README.md', sections: [] },
  }
  return {
    ...base,
    namespace: NAMESPACE,
    libraries: [
      { name: 'react', version: REACT_VERSION },
      { name: 'react-dom', version: REACT_VERSION },
    ],
    // Synced from code: read-only in Claude Design, changed through the package.
    editing: 'code',
    lastChange: { by: git('config', 'user.name') || 'Claude', at: new Date().toISOString(), via, note },
  }
}

// --- Write ----------------------------------------------------------------------------

const repo = git('remote', 'get-url', 'origin').replace(/^.*github\.com[:/]/, '').replace(/\.git$/, '')
const ref = `${git('rev-parse', '--abbrev-ref', 'HEAD')}@${git('rev-parse', '--short', 'HEAD')}`

rmSync(PROJECT, { recursive: true, force: true })
write('README.md', README)
write('tokens.json', `${JSON.stringify(tokens(ref, repo), null, 2)}\n`)
for (const component of COMPONENTS) {
  write(`components/${component.name}/README.md`, component.readme)
  write(`components/${component.name}/preview.html`, preview(component))
}
write('components/Cover/preview.html', COVER)
write('components/bundle.js', bundle())
write('components/bundle.css', readFileSync(join(OUT, 'build', 'bundle.css'), 'utf8'))
write('components/index.d.ts', declarationsFile())
write(
  'design-system.json',
  `${JSON.stringify(index(`Claude Code · ${repo}@${ref.split('@')[1]}`, `synced from ${ref}`), null, 2)}\n`,
)

console.info(`claude-design/project written from ${repo} ${ref}`)
