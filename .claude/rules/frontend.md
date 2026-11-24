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
    components/   presentation; data comes through props
    <context>-page.tsx
    index.ts      the only public entry point of the feature
  shared/
    api/          HTTP client and types generated from contracts/openapi.json
    ui/           shadcn primitives (do not hand-edit)
    components/   generic composites with no domain vocabulary
    lib/          utilities
```

## Dependency rules

- `routes` imports `features`, `features` import `shared`. Never the other way.
- A feature never imports another feature. Import a feature only through its `index.ts`.
- Feature names match the back-end contexts.
- Generated API types stay inside `api/` and `model/`. Components use screen types.

## Components

- Composition over configuration: children and sub-components, not boolean props.
- Small does not mean generic. A feature component moves to `shared/` only when a
  third screen needs it.
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

## Before handing over

Lint, format check, typecheck and tests pass; generated API types are up to date.
