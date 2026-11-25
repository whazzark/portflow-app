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
    api/          <context>-query-keys.ts, queryOptions, mutations
    hooks/        screen logic worth sharing or testing
    model/        screen types, mappers from API types, form schemas
    components/   organisms: sections with domain vocabulary; data comes through props
    constants.ts  the fixed values the files of the feature share
    <context>-page.tsx   page: connects a template and organisms to data
  shared/
    api/          HTTP client bound to the types of @portflow/contracts; ApiError
    styles/       tokens: the CSS variables of the Tailwind theme, themes and densities
    atoms/        shadcn primitives; changed only by a design-system issue
    molecules/    generic composites of atoms, with no domain vocabulary
    templates/    page layouts with slots; no domain vocabulary, no data
    lib/          utilities
  test/         MSW server, setup, renderApp
```

The component layers follow atomic design (ADR 0012). The contract and its generated
types are the workspace `@portflow/contracts` (ADR 0016).

There is no `index.ts` that re-exports a folder: barrel files hide cycles. Import the
file that declares what you need.

## Dependency rules

- `routes` imports `features`, `features` import `shared`. Never the other way.
- A route imports the page of a feature (`<context>-page.tsx`) and its queries (`api/`),
  nothing else of it.
- A feature never imports another feature. Inside a feature, import relatively; across
  folders of `src`, through the alias `@/`, never with `../../`.
- Feature names match the back-end contexts.
- Generated API types stay inside `api/` and `model/`. Components, pages and routes use
  screen types and never import `@portflow/contracts` or `shared/api`.
- Inside `shared`: atoms import tokens only, molecules import atoms, templates import
  molecules and atoms. Never the other way.

These rules are checked by Oxlint (`no-restricted-imports` per folder, in
`apps/web/.oxlintrc.json`), with `import/no-cycle`. Oxfmt sorts the imports: external
packages, then `@portflow/*`, then `@/`, then relative.

## Types

- Declare object types with `type`, never `interface`: props, screen types, contexts
  (`type HealthTableProps = { status: HealthStatus }`).
- The one exception is a module augmentation (`declare module` ... `interface Register`),
  which only an interface can merge: disable the rule on that line and say why.

Checked by Oxlint (`typescript/consistent-type-definitions`).

## Constants

- A fixed value that several files share goes in a `constants.ts`, as an
  `UPPER_SNAKE_CASE` export: `HEALTH_LABELS`, `PROBLEM_LABELS`. One file per scope:
  `features/<context>/constants.ts` for a feature, `shared/<folder>/constants.ts` for
  what `shared` exposes.
- A value used in one file stays in that file.
- Cache keys are not constants: they come from the key factory of their domain.

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
- A read calls `apiClient` (openapi-fetch) in its `queryFn`, through `unwrap`, which
  throws an `ApiError`: its `label` is what the error state shows. No
  `openapi-react-query` (ADR 0017).
- Every cache key comes from the key factory of its domain,
  `features/<context>/api/<context>-query-keys.ts` (ADR 0017):

  ```ts
  export const healthQueryKeys = {
    all: () => ['health'] as const,
    get: () => [...healthQueryKeys.all(), 'get'] as const,
  }
  ```

  `all()` is the prefix of the domain; the other keys take their parameters (an
  identifier, filters). The loader prefetches with the `queryOptions`
  (`void context.queryClient.prefetchQuery(...)`, without waiting, so the page shows its
  loading state); a loading indicator of a domain reads
  `useIsFetching({ queryKey: <context>QueryKeys.all() })`; a mutation invalidates with `all()`.
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
  Never mock the API client module. `renderApp(path)` (`src/test/render-app.tsx`)
  renders the whole app with fresh clients; each test declares the answers it needs
  with `server.use(...)` (`src/test/server.ts`), and a request without a handler fails.
- Query by role and accessible name. Reference the requirement in the test name: `[12/FR-001] ...`.

## Commands

From the root of the repository, with Node from `.nvmrc` and pnpm from `packageManager`.
The repository-wide commands are in `.claude/rules/workspace.md`. The web app is
`@portflow/web`; the contract and its types are `@portflow/contracts`.

```
pnpm build --filter @portflow/web          # type check (tsc -b), then vite build
pnpm lint --filter @portflow/web           # oxlint, import boundaries included
pnpm format:check --filter @portflow/web   # oxfmt --check; imports sorted
pnpm --filter @portflow/web format         # oxfmt: format and sort in place
pnpm test --filter @portflow/web           # vitest: Testing Library and MSW
pnpm test --filter @portflow/contracts     # the committed types match openapi.json
pnpm --filter @portflow/contracts generate # write the types from openapi.json
pnpm --filter @portflow/web dev            # http://localhost:5173, /api forwarded to API_URL
pnpm --filter @portflow/web preview        # the built app, same forwarding
```

The web app calls `/api` on its own origin (ADR 0004); `vite` and `vite preview` forward
it to `API_URL` (`.env.example`). Start the API first: `pnpm db:up`, then
`pnpm --filter @portflow/api migrate` and `pnpm --filter @portflow/api start`.

`src/routeTree.gen.ts` is written by the router plugin of Vite (`dev`, `build`, `test`)
and committed: commit it with the route that changed it.

## Before handing over

Lint, format check, typecheck and tests pass; the generated API types and
`routeTree.gen.ts` are up to date and committed.
