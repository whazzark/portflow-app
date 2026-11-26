---
paths:
  - "packages/design-system/**"
---

# Design-system rules

The design system is the workspace `@portflow/design-system`, in
`packages/design-system/` (ADR 0012, ADR 0019). The `designer` agent changes it, for
an issue about the design system; a feature uses it and never edits it. Storybook shows
it, and the Portflow design system in Claude Design is generated from it.

## Structure

```
src/
  styles/     tokens.css (values), theme.css (Tailwind theme), constants.ts, storybook.css
  atoms/      the shadcn/ui primitives
  molecules/  generic composites of atoms, with no domain vocabulary
  templates/  page layouts with slots, no data
  lib/        cn
scripts/claude-design/   what the sync with Claude Design builds and publishes
```

- The package imports its own files by their public name, `@portflow/design-system/...`,
  never with `../../`.
- Atoms import the tokens and `lib` only, molecules import atoms, templates import
  molecules and atoms; the package imports nothing of `apps/`. Checked by Oxlint
  (`packages/design-system/.oxlintrc.json`).
- No barrel: the `exports` of `package.json` map each file.
- Each component is a family of small parts composed like shadcn/ui
  (`.claude/rules/frontend.md`, Components). Visual variants (`variant`, `size`) belong
  to atoms only.
- Each component has its stories; one with behaviour (keyboard, open and close, focus)
  has its tests by role and accessible name.

## Tokens

Semantic names only. Three themes, chosen by `data-theme`: `light` (the default),
`dark`, and `contrast` for sunlight. Two densities, chosen by `data-density`: `office`
(the default with a fine pointer) and `field` (the default with a coarse pointer when the
document chose none, and always while a `FieldLayout` is shown: it sets it on the
document, for the overlays too).

| Token (CSS variable) | Tailwind utility | Use |
|---|---|---|
| `--background` | `bg-background` | The page |
| `--surface`, `--surface-muted` | `bg-surface`, `bg-surface-muted` | What sits on the page; a quiet area |
| `--text`, `--text-muted` | `text-text`, `text-text-muted` | Text; secondary text |
| `--border`, `--border-strong` | `border-border`, `border-border-strong` | Hairlines; the border of a control |
| `--ring` | `ring-ring` | Focus ring |
| `--primary`, `--primary-text` | `bg-primary`, `text-primary-foreground` | Main action, links |
| `--secondary`, `--secondary-text` | `bg-secondary`, `text-secondary-foreground` | Secondary action |
| `--danger`, `--success`, `--warning` (+ `-text`) | `bg-danger`, `text-danger-foreground`... | States |
| `--overlay` | `bg-overlay` | Behind a dialog |
| `--control-height` | `h-control`, `size-control` | 36px office, 44px field |
| `--control-padding-x` | `px-control-x` | Inner padding of a control |
| `--cell-padding-y` | `py-cell` | Padding of a table cell |
| (computed) | `-inset-hit` | Hit area of a control smaller than the control height (the checkbox) |

The names shadcn/ui uses (`foreground`, `muted`, `accent`, `destructive`, `input`,
`card`, `popover`) are bound to these in `theme.css`. The type scale (`text-xs` to
`text-2xl`), radii (`rounded-sm` to `rounded-xl`) and shadows (`shadow-xs` to
`shadow-lg`) are theme variables of `theme.css`; spacing and breakpoints are those of
Tailwind, unchanged.

**Contrast.** In each theme, every text pair reaches 4.5:1, and every control border,
focus ring and error border 3:1. `src/styles/contrast.test.ts` measures each pair the
components draw (a new colour adds its pairs there) and refuses a ring drawn with an
alpha, which would blend below 3:1.

## Components

| Level | Files |
|---|---|
| Atoms | `button`, `input`, `label`, `select`, `checkbox`, `dialog`, `sonner` (the `Toaster`), `skeleton`, `badge`, `table`, `tabs`, `tooltip` |
| Molecules | `loading-state`, `empty-state`, `error-state`, `undo-toast`, `responsive-table` |
| Templates | `page-layout`, `office-layout`, `field-layout` |

## Adding or changing an atom

1. Only an atom a screen needs now.
2. Generate it with the pinned CLI, from `packages/design-system/`:
   `pnpm dlx shadcn@4.23.0 add <name>` (`components.json` writes into `src/atoms/`).
3. Check what the CLI changed: pin each dependency it added to an exact version, remove
   any it added by mistake (it has added a package named `cn` and `next-themes`), and
   leave `src/styles/` as it was.
4. Adapt it once: heights on the density tokens (`h-control`), semantic colours, no
   arbitrary value where a token or a step of the scale exists, `type` and function
   declarations (Oxlint), no `"use client"`.
5. Its tests, its stories, and its entry for Claude Design (below).

## Claude Design

The Portflow design system: <https://claude.ai/artifact/YCFSzihTejH5S2cz8raK65>. It
is read-only there (`"editing": "code"`): a change is made in the package. It is
private to its owner until shared from its page.

**What it holds.** `scripts/claude-design/` builds it from the package: `tokens.json`
from the CSS of `src/styles/`, the brand book and one guideline and live preview per
component (`content.ts`), the cover, an IIFE bundle that carries React 19 and assigns
`window.Portflow` (`entry.ts`), its stylesheet and types, and the index. A component added or
renamed gets its entry in `content.ts` and `entry.ts`.

**When it is synced.** It follows `main`: `/design` syncs it before drawing a mock-up,
when `meta.packageRef` of its `project/tokens.json` is not the last commit of `main`
that changed the package. Sync it from a checkout whose package is the one of `main`,
never from a branch that changes the package.

**How.**

1. `read` the published `project/design-system.json` of the system: the sync keeps
   every key of it.
2. Build, with the path where the read saved it:
   `pnpm --filter @portflow/design-system run build:claude-design --index <path>`.
   It checks before it builds: `origin/main` up to date with GitHub (fetch first), and
   the whole checkout the same as `origin/main` outside `specs/`, with nothing
   uncommitted or untracked; then it installs from main's lockfile with no lifecycle
   script, since the bundle inlines the dependencies.
   Then it empties `packages/design-system/claude-design/` and writes `project/` there
   (not committed). Without `--index` it builds the same files as a check, with no
   index: that folder is not published.
3. Publish that folder to the system's url in one Artifact call: `root` the
   `claude-design` folder, `file_path` its `project/design-system.json`, `files` every
   other file under `project/`, with `contentType` `text/plain` for
   `project/components/index.d.ts` (a `.ts` file is not served otherwise).

## Commands

From the root of the repository:

```
pnpm build --filter @portflow/design-system          # type check, then the static Storybook
pnpm lint --filter @portflow/design-system
pnpm format:check --filter @portflow/design-system
pnpm test --filter @portflow/design-system           # Vitest: components and contrast
pnpm --filter @portflow/design-system storybook      # http://127.0.0.1:6006
pnpm --filter @portflow/design-system run build:claude-design [--index <path>]
```

Storybook is the showcase: its sidebar lists every component, its toolbar switches
the theme and the density without reloading. The end-to-end test of that toolbar and of
the templates is `packages/e2e/tests/design-system.spec.ts`: Playwright serves the
built Storybook.
