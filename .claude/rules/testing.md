---
paths:
  - "packages/e2e/**"
  - "apps/**"
---

# Testing rules

## Who writes what

- **Unit and integration tests**, under `apps/`, are the developer's.
- **End-to-end and regression tests**, Playwright in `packages/e2e/`, are the QA
  agent's, written from the spec and the approved mock-up without reading the
  implementation. They assert what the user sees, through roles and accessible names.
  A regression test reproduces a bug or a gap and stays in the suite.
- Never change a test you do not own. If a test is wrong, say so in your report.

## Rules

- **Tests come from the spec.** Each functional requirement becomes a test at the
  lowest level able to verify it. Most land in domain and use-case tests.
- **Red first.** Commit the failing tests before the implementation they cover: the
  history shows the `test(...)` commit before the code commit.
- **Every requirement has a test under `apps/`**, unit or integration, including the
  ones that cannot be tested end to end; the end-to-end tests come on top. Each test
  names the requirement it covers as `N/FR-kkk`, in the format of `docs/conventions.md`
  (Traceability).
- **Weakening a test needs a reason.** Removing an assertion, loosening a matcher or
  skipping a test you own is written down, with its reason, in the "Tests" section of
  the pull request (in your report, when you do not open it).
- **Every screen is tested at two widths.** The end-to-end tests of a screen run at a
  phone width (below the `sm` breakpoint of Tailwind) and at a desktop width (`lg` or
  above), and assert at both that the actions of the scenario are reachable and that
  the page does not scroll horizontally.
- **No test for trivial glue**: layer-to-layer conversions, wiring, generated code.
- **Deterministic.** Unit tests use no real clock, no network and no database.
  Integration and end-to-end tests do, so each one creates the data it needs and
  depends on no other test and on no order.

## Commands

`pnpm test` runs every unit and integration test; the tests that need PostgreSQL need
`pnpm db:up` first (see `.claude/rules/workspace.md`).

## End-to-end tests

The suite is the workspace `@portflow/e2e` (Playwright, in `packages/e2e/`).

```
pnpm db:up                                              # PostgreSQL, from .env
pnpm --filter @portflow/e2e exec playwright install chromium   # once per machine
pnpm test:e2e                                           # build, start, run every test
pnpm test:e2e -- --project phone                        # one width only
pnpm test:e2e -- tests/health.spec.ts                   # one file only
```

**Starting the application.** `pnpm test:e2e` builds the API and the web app
(Turborepo), then Playwright starts them itself (`webServer` in
`packages/e2e/playwright.config.ts`): it applies the migrations, starts the API on
`API_ADDRESS`, waits for `API_URL` + `/api/health`, then serves the built web app with
`vite preview` on `http://127.0.0.1:4173`, which forwards `/api` to `API_URL`: the
browser sees one origin, as in production. It never reuses a server already listening:
stop your own API first, or give the suite other ports through the environment
(`API_ADDRESS=127.0.0.1:38080 API_URL=http://127.0.0.1:38080 pnpm test:e2e`). The
variables come from the environment, or from `.env`, which the environment overrides.

**Creating data.** A test creates the data it needs through the HTTP API, the way the
application does, and never writes to the database:

- call `/api/...` with `page.request` (it shares the cookies of the page, so the
  session of a signed-in user) or the `request` fixture, on the origin of the web app;
- use values unique to the test (a suffix from `crypto.randomUUID()`), so that tests
  run in parallel, in any order, on a database that already holds data;
- assume nothing about the rest of the database: it is the local one of `pnpm db:up`,
  or a fresh one in CI, and it is not emptied between tests.

A helper that several tests use goes in `packages/e2e/support/`; fixed values shared
by several files, in `packages/e2e/constants.ts` (`UPPER_SNAKE_CASE`).

**Two widths.** Each test runs in the projects `phone` (390px wide, below `sm`) and
`desktop` (1280px, above `lg`); `expectNoHorizontalScroll(page)`
(`support/layout.ts`) checks that the page does not scroll sideways.
