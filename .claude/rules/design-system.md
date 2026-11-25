---
paths:
  - "packages/design-system/**"
---

# Design-system rules

The design system is the workspace `@portflow/design-system`, in
`packages/design-system/` (ADR 0012, ADR 0019). It is owned by the `designer` agent and
changed only by an issue about the design system. Storybook shows it; the Portflow
design system in Claude Design is generated from it.

## Structure

```
src/
  styles/     tokens.css (values), theme.css (Tailwind theme), constants.ts, storybook.css
  atoms/      the shadcn/ui primitives
  molecules/  generic composites of atoms, with no domain vocabulary
  templates/  page layouts with slots, no data
  lib/        cn
  showcase.stories.tsx   every atom and molecule on one page, with the switches
scripts/claude-design/   the sync with Claude Design
```

The package imports its own files by their public name, `@portflow/design-system/...`,
never with `../../`. Atoms import the tokens and `lib` only, molecules import atoms,
templates import molecules and atoms; the package imports nothing of `apps/`. Checked
by Oxlint (`packages/design-system/.oxlintrc.json`). There is no barrel: the `exports`
of `package.json` map each file.

## Tokens

Semantic names only. Three themes, chosen by `data-theme` (`light`, the default;
`dark`; `contrast`, for sunlight), and two densities, chosen by `data-density`
(`office`, the default with a fine pointer; `field`, with a coarse pointer and always in
`FieldLayout`).

| Token (CSS variable) | Tailwind utility | Use |
|---|---|---|
| `--background` | `bg-background` | The page |
| `--surface`, `--surface-muted` | `bg-surface`, `bg-surface-muted` | What sits on the page; a quiet area |
| `--text`, `--text-muted` | `text-text`, `text-text-muted` | Text; secondary text |
| `--border`, `--border-strong` | `border-border`, `border-border-strong` | Hairlines; the border of a control (3:1) |
| `--ring` | `ring-ring` | Focus ring (3:1) |
| `--primary`, `--primary-text` | `bg-primary`, `text-primary-foreground` | Main action, links |
| `--secondary`, `--secondary-text` | `bg-secondary`, `text-secondary-foreground` | Secondary action |
| `--danger`, `--success`, `--warning` (+ `-text`) | `bg-danger`, `text-danger-foreground`... | States |
| `--overlay` | `bg-overlay` | Behind a dialog |
| `--control-height` | `h-control`, `size-control` | 36px office, 44px field |
| `--control-padding-x` | `px-control-x` | Inner padding of a control |
| `--cell-padding-y` | `py-cell` | Padding of a table cell |

The names shadcn/ui uses (`foreground`, `muted`, `accent`, `destructive`, `input`,
`card`, `popover`) are bound to these in `theme.css`. Type scale (`text-xs` to
`text-2xl`), radii (`rounded-sm` to `rounded-xl`) and shadows (`shadow-xs` to
`shadow-lg`) are theme variables of `theme.css`; spacing and breakpoints are the ones
of Tailwind, unchanged.

Every text pair reaches 4.5:1 and every control border and focus ring 3:1, in the
three themes: `src/styles/contrast.test.ts` measures them. A new colour adds its pairs.

## Components

| Level | Components |
|---|---|
| Atoms | `button`, `input`, `label`, `select`, `checkbox`, `dialog`, `sonner` (the `Toaster`), `skeleton`, `badge`, `table`, `tabs`, `tooltip` |
| Molecules | `loading-state`, `empty-state`, `error-state`, `undo-toast`, `responsive-table` |
| Templates | `page-layout`, `office-layout`, `field-layout` |

Each component is a family of small parts composed like shadcn/ui
(`.claude/rules/frontend.md`, Components): texts come as children, never as a prop that
switches a part on or off. Visual variants (`variant`, `size`) belong to atoms only.

## Adding or changing an atom

1. Only for a design-system issue, and only an atom a screen needs now.
2. Generate it with the pinned CLI, from `packages/design-system/`:
   `pnpm dlx shadcn@4.23.0 add <name>` (`components.json` writes into `src/atoms/`).
3. Check what the CLI changed: pin every dependency it added to an exact version,
   remove any it added by mistake, and leave `src/styles/` as it was.
4. Adapt it once: heights on the density tokens (`h-control`), semantic colours, no
   arbitrary value where a token or a step of the scale exists, `type` and function
   declarations (Oxlint), no `"use client"`.
5. Tests of its keyboard behaviour by role and name, its stories, its place in the
   overview, then sync Claude Design.

## Claude Design

The Portflow design system in Claude Design,
<https://claude.ai/artifact/YCFSzihTejH5S2cz8raK65>, is read-only there
(`"editing": "code"`). It is private to its owner until shared from its page.
After a change of the package is merged, sync it:

```
pnpm --filter @portflow/design-system build:claude-design -- --index <published design-system.json>
```

It writes `claude-design/project/` (not committed): `tokens.json`, the brand book, one
guideline and one live preview per component (`scripts/claude-design/content.ts`), the
cover, the bundle (`window.Portflow` over React 18), its stylesheet and types, and the
index, which keeps every key of the published one. Publish that folder to the system
with the Artifact tool: `root` the `claude-design` folder, the index in the call.
A component added to the package gets its entry in `content.ts` and in
`scripts/claude-design/entry.ts`.

## Commands

From the root of the repository:

```
pnpm build --filter @portflow/design-system          # type check, then the static Storybook
pnpm lint --filter @portflow/design-system
pnpm format:check --filter @portflow/design-system
pnpm test --filter @portflow/design-system           # Vitest: components and contrast
pnpm --filter @portflow/design-system storybook      # http://127.0.0.1:6006
pnpm --filter @portflow/design-system build:claude-design
```

The end-to-end tests of the showcase and the templates are in
`packages/e2e/tests/design-system.spec.ts`; Playwright serves the built Storybook.
