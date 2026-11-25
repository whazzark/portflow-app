---
paths:
  - "apps/web/**"
---

# Front-end rules (React)

Stack: React, TypeScript strict, Vite, TanStack Router, TanStack Query, shadcn/ui,
Oxlint, Oxfmt, Vitest, Testing Library, MSW. See `docs/architecture.md`.

## Structure

```
src/
  app/        bootstrap: providers, router, query client
  routes/     file-based routes; thin
  features/<context>/
    api/          queryOptions, mutations, cache keys
    hooks/        screen logic worth sharing or testing
    model/        screen types, mappers from API types, form schemas
    components/   organisms: sections with domain vocabulary; data comes through props
    <context>-page.tsx   page: connects a template and organisms to data
    index.ts      the only public entry point of the feature
  shared/
    api/          HTTP client and types generated from contracts/openapi.json
    styles/       tokens: the CSS variables of the Tailwind theme, themes and densities
    atoms/        shadcn primitives; changed only by a design-system issue
    molecules/    generic composites of atoms, with no domain vocabulary
    templates/    page layouts with slots; no domain vocabulary, no data
    lib/          utilities
```

The component layers follow atomic design (ADR 0012).

## Dependency rules

- `routes` imports `features`, `features` import `shared`. Never the other way.
- A feature never imports another feature. Import a feature only through its `index.ts`.
- Feature names match the back-end contexts.
- Generated API types stay inside `api/` and `model/`. Components use screen types.
- Inside `shared`: atoms import tokens only, molecules import atoms, templates import
  molecules and atoms. Never the other way.

## Design system

- Styling is Tailwind utilities bound to the tokens. No raw colour, spacing or font
  size in a component; if a token is missing, report it.
- Never edit an atom to fit one screen. A new variant or size is a design-system issue.
- Themes (light, dark, high contrast) and densities (office, field) are token values,
  not per-component variants.

## Components

- Composition over configuration: children and sub-components, not boolean props.
- Small does not mean generic. An organism becomes a molecule only when a third
  screen needs it and its domain vocabulary can be removed.
- Pages and large sections connect to data. Leaf components are pure.
- Do not wrap every `useQuery` in a custom hook. Create a hook when there is logic.

## State

- Server data: TanStack Query, one `queryOptions` per read, shared by the route loader
  and the component. After a mutation, invalidate; do not patch the cache by hand.
- Navigable state (filters, sort, tabs, pagination): the URL.
- Everything else: local state. No global store. Never copy server data into `useState`.
- `useEffect` is for synchronising with something outside React, nothing else.

## Mock-up

- The approved mock-up in `specs/<NNN>-<slug>/design/` is the reference for screens,
  states and labels. Build what it shows; do not add a screen or a state it lacks.
- If the mock-up cannot be built as drawn, or contradicts the spec, stop and report:
  the answer goes through a design or spec pull request.

## Responsive

- Every screen is responsive (ADR 0004): usable at every width, from the base one of
  Tailwind (below `sm`) to `2xl` and above, in portrait and landscape, with no
  horizontal scroll of the page.
- The widths are the default breakpoints of Tailwind (`sm`, `md`, `lg`, `xl`, `2xl`),
  unchanged. No other minimum width, no custom breakpoint, no raw value in a media query.
- Mobile first: unprefixed utilities are the phone form, the prefixes widen it. No
  fixed pixel width on a layout container.
- The templates carry the page layout at each width. A screen does not rebuild it.
- A dense table has a narrow form (priority columns, or one card per row), shown by
  the mock-up. Do not hide an action or a datum the user needs at a narrow width.
- Same components at every width: adapt with CSS, not with a second component tree
  chosen from the window size.

## UX rules

- Handle loading, error and empty states for every read.
- A disabled action explains why and how to unblock it.
- Prefer a visible correction path over a confirmation dialog.
- Field screens: touch targets of at least 44px, one task per screen.
- Real `<button>`, `<a>`, `<label>` elements. UI copy is in French; code is in English.

## Tests

- Mappers and rules in `model/`: unit tests without rendering.
- Features: Testing Library through the real router, network mocked with MSW.
  Never mock the API client module.
- Query by role and accessible name. Reference the requirement in the test name: `[12/FR-001] ...`.

## Commands

From the root of the repository, with Node from `.nvmrc` and pnpm from `packageManager`.
The repository-wide commands are in `.claude/rules/workspace.md`; to run one workspace only, add
`--filter <package name>` (for example `pnpm lint --filter <web package>`). The web
app, its package name and its own commands arrive with the walking skeleton of the
front end (#11).

## Before handing over

Lint, format check, typecheck and tests pass; generated API types are up to date.
