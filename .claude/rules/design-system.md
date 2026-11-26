---
paths:
  - "packages/design-system/**"
---

# Design-system rules

The design system is the workspace `@portflow/design-system`, in
`packages/design-system/` (ADR 0012, ADR 0019). The `designer` agent changes it, for
an issue about the design system; a feature uses it and never edits it.

An issue about the visual layer (tokens, themes, densities, the look of an atom, a
molecule or a template) is a style issue: label `style`, branch `style/<NNN>-<slug>`,
worked by `/style <issue>` (`docs/workflow.md`, "Style"). Storybook shows
it, and the Portflow design system in Claude Design is generated from it.

## Structure

```
src/
  styles/     tokens.css (values), theme.css (Tailwind theme), constants.ts, storybook.css,
              tokens.stories.tsx (every semantic token in each theme and density)
  atoms/      the shadcn/ui primitives, and every component built on one primitive or none
  molecules/  generic composites of several atoms, with no domain vocabulary
  templates/  page layouts with slots, no data
  lib/        cn
scripts/claude-design/   what the sync with Claude Design builds and publishes
```

- The package imports its own files by their public name, `@portflow/design-system/...`,
  never with `../../`. A component made of many parts may be a folder, one file per
  part (`molecules/form/`): its files import each other with `./`, and the others import
  the file that assembles them (`molecules/form/use-app-form`).
- Atoms import the tokens, `lib` and other atoms, molecules import atoms, templates
  import molecules and atoms; the package imports nothing of `apps/`. Checked by Oxlint
  (`packages/design-system/.oxlintrc.json`).
- An atom or a molecule (ADR 0021): a component built on one shadcn/ui primitive, or on
  plain elements, is an atom (`pending-button` on `button`, `toasts` on `sonner`,
  `error-state`); a component that assembles several primitives is a molecule (`form/`).
- A file the shadcn CLI writes holds the primitive only: what we build on it goes in a
  file of its own next to it (`atoms/pending-button.tsx` next to `atoms/button.tsx`), so
  that generating the primitive again never erases it.
- No barrel: the `exports` of `package.json` map each file, by a pattern for the `.tsx`
  files of a level. A `.ts` file (a hook, functions with no JSX) gets its own entry,
  written before the pattern (`./atoms/toasts`). A folder exports only the file that
  assembles it; its other files are hidden by a `null` entry
  (`"./molecules/form/*": null`).
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
| `--info`, `--info-text` | `bg-info`, `text-info-foreground`, `text-info` | Neutral information: an informative toast or status. A cyan, never read as an action |
| `--overlay` | `bg-overlay` | Behind a dialog |
| `--control-height` | `h-control`, `size-control` | 36px office, 44px field |
| `--control-padding-x` | `px-control-x` | Inner padding of a control |
| `--cell-padding-y` | `py-cell` | Padding of a table cell |
| (computed) | `-inset-hit` | Hit area of a control smaller than the control height (the checkbox) |

The names shadcn/ui uses (`foreground`, `muted`, `accent`, `destructive`, `input`,
`card`, `popover`) are bound to these in `theme.css`.

**Type, radius and shadow by role.** A component names the role of its text, its corners
and its shadow, never a step of a scale. Each type utility carries its size, line height
and weight: no `font-medium` or `font-semibold` beside it. The sizes of `text-body`,
`text-control` and `text-label` follow `data-density` (`--type-<role>-size` and
`--type-<role>-line-height` in `tokens.css`); the others are the same in both densities.

| Utility | Office | Field | Weight | Use |
|---|---|---|---|---|
| `text-page-title` | 24/32px | same | 600 | The title of a page (`PageLayoutTitle`) |
| `text-task-title` | 20/28px | same | 600 | The task of a field screen (`FieldLayoutTitle`) |
| `text-section-title` | 18/28px | same | 600 | The title of a section, a dialog, an empty state |
| `text-body` | 14/20px | 16/24px | 400 | Descriptions, table cells, the message of a state, a field error |
| `text-control` | 14/20px | 16/24px | 400 | The value of an input or a select (16px in the field density: no zoom on iOS) |
| `text-label` | 14/20px | 16/24px | 500 | Labels, buttons, tabs, table headers |
| `text-caption` | 12/16px | same | 400 | Tooltips, the group label of a select |
| `text-badge` | 12/16px | same | 500 | Badges |

| Utility | Value | Use |
|---|---|---|
| `rounded-control` | 6px | Buttons, inputs, the trigger of a select, skeletons, the active tab |
| `rounded-item` | 4px | Checkboxes, the items of a select, the close button of a dialog |
| `rounded-overlay` | 6px | What floats: the content of a select, tooltips, toasts |
| `rounded-card` | 8px | Dialogs, empty and error states, cards, the list of tabs |
| `rounded-pill` | full | Badges |
| `shadow-control` | the old `shadow-xs` | Outlined buttons, inputs, checkboxes, the trigger of a select |
| `shadow-raised` | the old `shadow-sm` | The active tab |
| `shadow-overlay` | the old `shadow-md` | The content of a select, menus |
| `shadow-dialog` | the old `shadow-lg` | Dialogs |

The roles are listed in `src/styles/constants.ts` (`TYPE_ROLES`, `RADIUS_ROLES`,
`SHADOW_ROLES`), which `cn` reads so that `text-label` is not merged away as a colour;
`src/styles/theme.test.ts` keeps that list in step with `theme.css`. A new role goes in
both.

The raw type scale (`text-xs` to `text-2xl`), radii (`rounded-sm` to `rounded-xl`) and
shadows (`shadow-xs` to `shadow-lg`) stay in `theme.css` only until every atom has moved
to the semantic utilities: new code uses the semantic ones. Spacing and breakpoints are
those of Tailwind, unchanged.

**Contrast.** In each theme, every text pair reaches 4.5:1, and every control border,
focus ring and error border 3:1. `src/styles/contrast.test.ts` measures each pair the
components draw (a new colour adds its pairs there) and refuses a ring drawn with an
alpha, which would blend below 3:1.

## Components

| Level | Files |
|---|---|
| Atoms | `button`, `pending-button`, `input`, `label`, `select`, `checkbox`, `dialog`, `sonner` (the `Toaster`), `toasts` (`showNeutralToast`, `showUndoToast`, `showSuccessToast`, `showInfoToast`, `showWarningToast`, `showErrorToast`), `skeleton`, `badge`, `table`, `responsive-table`, `tabs`, `tooltip`, `loading-state`, `empty-state`, `error-state` |
| Molecules | `form/` (`use-app-form`: `useAppForm` and its field family, ADR 0021) |
| Templates | `page-layout`, `office-layout`, `field-layout` |

**Toasts.** The `Toaster` turns on Sonner's rich colours and binds them to the tokens:
a success, an error, a warning and an information are filled with `success`, `danger`,
`warning` or `info`, their text and icon in its `-text` token, and their action swaps the
two; a neutral toast and the undo toast stay on `surface`, their action in `primary`.
Sonner names its own `--success-text`, `--warning-text` and `--info-text` on its list:
the `Toaster` reads our tokens on a wrapper under `--toaster-<state>-text` and gives them
back to the list. A button inside a toast draws its ring with a `background` halo
(`ring-offset-background`), so that the ring stands apart from a coloured fill.

## Adding or changing an atom

1. Only an atom a screen needs now.
2. Generate it with the pinned CLI, from `packages/design-system/`:
   `pnpm dlx shadcn@4.23.0 add <name>` (`components.json` writes into `src/atoms/`).
3. Check what the CLI changed: pin each dependency it added to an exact version, remove
   any it added by mistake (it has added a package named `cn` and `next-themes`), and
   leave `src/styles/` as it was.
4. Adapt it once: heights on the density tokens (`h-control`), semantic colours, the
   semantic type, radius and shadow utilities (`text-label`, `rounded-control`,
   `shadow-control`) in place of the raw scale, no arbitrary value where a token
   exists, `type` and function declarations (Oxlint), no `"use client"`.
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
pnpm test --filter @portflow/design-system           # Vitest: components, contrast, theme utilities
pnpm --filter @portflow/design-system storybook      # http://127.0.0.1:6006
pnpm --filter @portflow/design-system run build:claude-design [--index <path>]
```

Storybook is the showcase: its sidebar lists every component, its toolbar switches
the theme and the density without reloading. The end-to-end test of that toolbar and of
the templates is `packages/e2e/tests/design-system.spec.ts`: Playwright serves the
built Storybook.
