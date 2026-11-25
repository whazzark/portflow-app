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

`pnpm test` runs every test; the tests that need PostgreSQL need `pnpm db:up` first
(see `.claude/rules/workspace.md`). How to start the whole application for the
end-to-end tests, and how a test creates its data, arrive with the walking skeleton of
the front end (#11).
