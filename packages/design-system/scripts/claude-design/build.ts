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
const REPOSITORY = join(PACKAGE, '..', '..')
const NAMESPACE = 'Portflow'

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
  return execFileSync('git', gitArgs, { cwd: PACKAGE, encoding: 'utf8', stdio: 'pipe' }).trim()
}

/** A git value that may be missing (no user name, no remote): the fallback then. */
function gitOr(fallback: string, ...gitArgs: string[]): string {
  try {
    return git(...gitArgs) || fallback
  } catch {
    return fallback
  }
}

// --- Tokens -------------------------------------------------------------------------

/** The `--name: value` declarations of each block of a stylesheet, by selector. */
function declarations(css: string): { selector: string; values: Map<string, string> }[] {
  const withoutComments = css.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(
    ([, selector = '', body = '']) => ({
      selector: selector.trim(),
      values: new Map(
        [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name = '', value = '']) => [
          name,
          value.replaceAll(/\s+/g, ' ').trim(),
        ]),
      ),
    }),
  )
}

const COLOUR_USAGE: Record<string, string> = {
  background: 'The page behind everything.',
  surface: 'Cards, dialogs, menus, toasts, table rows: what sits on the page.',
  'surface-muted': 'A quiet area: the navigation of the office layout, hovered rows, skeletons.',
  text: 'Body text and headings, on background, surface and surface-muted.',
  'text-muted': 'Secondary text: captions, descriptions, placeholders, column names of a card.',
  border:
    'Hairlines between rows and around cards: decoration, never the only boundary of a control.',
  'border-strong': 'The border of a control (input, select, checkbox): 3:1 on its ground.',
  ring: 'The focus ring of every control: 3:1 on the page.',
  primary: 'The main action of an area and links; text in primary reaches 4.5:1 on the page.',
  'primary-text': 'Text and icons on primary.',
  secondary: 'A secondary action, the current item of a navigation.',
  'secondary-text': 'Text on secondary.',
  danger:
    'Deleting actions, refusals, the border of an error state or of an invalid control, the error under a field; text in danger reaches 4.5:1 on the page.',
  'danger-text':
    'Text and icons on danger; the fill of the action of an error toast, its label in danger.',
  success: 'A success toast or status.',
  'success-text':
    'Text and icons on success; the fill of the action of a success toast, its label in success.',
  warning: 'A warning toast or status.',
  'warning-text':
    'Text and icons on warning; the fill of the action of a warning toast, its label in warning.',
  info: 'Neutral information: an informative toast or status. A cyan, never read as an action.',
  'info-text':
    'Text and icons on info; the fill of the action of an info toast, its label in info.',
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
  const densities = declarations(read('src/styles/tokens.css'))
  const office = densities.find((block) => block.selector.includes(`[data-density='office']`))
  const field = densities.find((block) => block.selector.includes(`[data-density='field']`))
  // A semantic style: its size, line height and weight are theme variables of `theme.css`.
  const role = (name: string, usage: string) => ({
    name,
    fontSize: values.get(`text-${name}`),
    lineHeight: values.get(`text-${name}--line-height`),
    fontWeight: Number(values.get(`text-${name}--font-weight`)),
    usage,
  })
  // A semantic style whose size follows the density: one style per density.
  const dense = (name: string, fontWeight: number, usage: string) =>
    [
      { density: 'office', label: 'Office', block: office },
      { density: 'field', label: 'Field', block: field },
    ].map(({ density, label, block }) => ({
      name: `${name}-${density}`,
      fontSize: block?.values.get(`type-${name}-size`),
      lineHeight: block?.values.get(`type-${name}-line-height`),
      fontWeight,
      usage: `${label}: ${usage}`,
    }))
  const raw = (name: string, fontWeight: number, usage: string) => ({
    name,
    fontSize: values.get(`text-${name}`),
    lineHeight: values.get(`text-${name}--line-height`),
    fontWeight,
    usage: `Raw step, kept until the atoms have moved: ${usage}`,
  })
  return {
    fonts: [],
    families: { sans: values.get('font-sans'), mono: values.get('font-mono') },
    groups: [
      {
        name: 'Headings',
        family: 'sans',
        styles: [
          role('page-title', 'text-page-title: the title of a page (h1).'),
          role(
            'task-title',
            'text-task-title: the task of a field screen (h1 of the field layout).',
          ),
          role(
            'section-title',
            'text-section-title: the title of a section, an empty state or a dialog.',
          ),
        ],
      },
      {
        name: 'Text',
        family: 'sans',
        styles: [
          ...dense('body', 400, 'text-body: descriptions, table cells, messages of a state.'),
          ...dense('control', 400, 'text-control: the value of an input or a select.'),
          ...dense('label', 500, 'text-label: labels, buttons, tabs, table headers.'),
          role('caption', 'text-caption: tooltips, the group label of a select.'),
          role('badge', 'text-badge: badges.'),
        ],
      },
      {
        name: 'Raw scale',
        family: 'sans',
        styles: [
          raw('2xl', 600, 'use text-page-title.'),
          raw('xl', 600, 'use text-task-title.'),
          raw('lg', 600, 'use text-section-title.'),
          raw('base', 400, 'use text-body or text-control.'),
          raw('sm', 400, 'use text-body, text-control or text-label.'),
          raw('xs', 400, 'use text-caption or text-badge.'),
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

function tokens(ref: string, packageRef: string, repo: string) {
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
      control:
        'rounded-control: buttons, inputs, the trigger of a select, skeletons, the active tab.',
      item: 'rounded-item: checkboxes, the items of a select, the close button of a dialog.',
      overlay: 'rounded-overlay: what floats: the content of a select, tooltips, toasts.',
      card: 'rounded-card: dialogs, empty and error states, cards, the list of tabs.',
      pill: 'rounded-pill: badges.',
      sm: 'Raw step, kept until the atoms have moved: use rounded-item.',
      md: 'Raw step, kept until the atoms have moved: use rounded-control or rounded-overlay.',
      lg: 'Raw step, kept until the atoms have moved: use rounded-card.',
      xl: 'Raw step, kept until the atoms have moved: no semantic radius uses it.',
    }),
    shadow: listOf(values, 'shadow', {
      control: 'shadow-control: outlined buttons, inputs, checkboxes, the trigger of a select.',
      raised: 'shadow-raised: the active tab.',
      overlay: 'shadow-overlay: the content of a select, menus.',
      dialog: 'shadow-dialog: dialogs.',
      xs: 'Raw step, kept until the atoms have moved: use shadow-control.',
      sm: 'Raw step, kept until the atoms have moved: use shadow-raised.',
      md: 'Raw step, kept until the atoms have moved: use shadow-overlay.',
      lg: 'Raw step, kept until the atoms have moved: use shadow-dialog.',
    }),
    density: densityTokens(),
    meta: {
      source: 'github',
      repo,
      ref,
      // The last commit that changed the package: `/design` compares it with `main`.
      packageRef,
      package: 'packages/design-system',
      paths: {
        tokens: ['src/styles/tokens.css', 'src/styles/theme.css'],
        docs: ['.claude/rules/design-system.md', '.claude/rules/frontend.md'],
      },
      components: Object.fromEntries(COMPONENTS.map((component) => [component.name, 'src/'])),
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
    // The bundle carries its own React 19: the previews load nothing else.
    libraries: [],
    // Synced from code: read-only in Claude Design, changed through the package.
    editing: 'code',
    lastChange: {
      by: gitOr('Claude', 'config', 'user.name'),
      at: new Date().toISOString(),
      via,
      note,
    },
  }
}

// --- Checks, then build -------------------------------------------------------------

// The path of the repository on its host, never the user or the token a remote URL can
// carry: `https://user:token@host/owner/name.git` and `git@host:owner/name.git` give
// `owner/name`.
const remotePath = gitOr('portflow', 'remote', 'get-url', 'origin')
  .replace(/^[a-z+]+:\/\/(?:[^@/]+@)?[^/]+\//i, '')
  .replace(/^[^@/]+@[^:]+:/, '')
  .replace(/\.git$/, '')
// A local path (`/Users/…`, `../repo`, `file://…`) or a URL with no path is not published.
const repo = /^\w[\w.-]*\/\w[\w.-]*$/.test(remotePath) ? remotePath : 'portflow'

// The system says which commit of the package it shows: a change not committed would
// make that a lie.
if (git('status', '--porcelain', '--', '.') !== '') {
  throw new Error('packages/design-system has changes not committed: commit them, then sync')
}

// The published system follows main: with --index (the publishing path), the package must
// be the one of origin/main, and origin/main the one of GitHub. Without --index, the
// build only checks that the files can be made, and writes no index: nothing to publish.
if (args.index) {
  const remoteMain = gitOr('', 'ls-remote', 'origin', 'refs/heads/main').split(/\s/)[0]
  if (!remoteMain || remoteMain !== gitOr('', 'rev-parse', 'origin/main')) {
    throw new Error('origin/main is not the main of GitHub: git fetch origin, then sync')
  }
  // The bundle inlines the dependencies, and an install reads every manifest and the pnpm
  // config of the repository: the whole checkout must be main's, specs aside (the design
  // branch adds its spec folder), with nothing uncommitted or untracked.
  if (git('status', '--porcelain', '--untracked-files=all', '--', ':/') !== '') {
    throw new Error('the checkout has changes or untracked files: sync from a clean main')
  }
  try {
    git('diff', '--quiet', 'origin/main', '--', ':/', ':(exclude,top)specs')
  } catch {
    throw new Error('the checkout differs from origin/main outside specs/: sync from main')
  }
  // Installed from main's lockfile, with no lifecycle script: no project needs one.
  execFileSync('pnpm', ['install', '--frozen-lockfile', '--ignore-scripts'], {
    cwd: REPOSITORY,
    stdio: 'inherit',
  })
}

// Nothing of an earlier build may reach this one: the bundle, the types and the files
// are made again from an empty folder.
rmSync(OUT, { recursive: true, force: true })
execFileSync('pnpm', ['exec', 'vite', 'build', '-c', 'scripts/claude-design/vite.config.ts'], {
  cwd: PACKAGE,
  stdio: 'inherit',
})
execFileSync(
  'pnpm',
  ['exec', 'tsc', '-p', '.', '--noEmit', 'false', '--declaration', '--emitDeclarationOnly'].concat([
    '--outDir',
    'claude-design/types',
  ]),
  { cwd: PACKAGE, stdio: 'inherit' },
)

// --- Write ----------------------------------------------------------------------------

const ref = `${git('rev-parse', '--abbrev-ref', 'HEAD')}@${git('rev-parse', '--short', 'HEAD')}`
const packageRef = git('log', '-1', '--format=%h', '--', '.')

write('README.md', README)
write('tokens.json', `${JSON.stringify(tokens(ref, packageRef, repo), null, 2)}\n`)
for (const component of COMPONENTS) {
  write(`components/${component.name}/README.md`, component.readme)
  write(`components/${component.name}/preview.html`, preview(component))
}
write('components/Cover/preview.html', COVER)
write('components/bundle.js', bundle())
write('components/bundle.css', readFileSync(join(OUT, 'build', 'bundle.css'), 'utf8'))
write('components/index.d.ts', declarationsFile())

if (args.index) {
  const note = `synced from ${ref}, package at ${packageRef}`
  const published = index(`Claude Code · ${repo}@${ref.split('@')[1]}`, note)
  write('design-system.json', `${JSON.stringify(published, null, 2)}\n`)
  console.info(`claude-design/project written from ${repo} ${ref}: ready to publish`)
} else {
  console.info(`claude-design/project built from ${ref} as a check: no index, not to publish`)
}
