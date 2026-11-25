# 0013. A packages folder for the end-to-end tests and the user documentation

Status: proposed (2026-11-25)

Completed by ADR 0014: the user documentation is in `packages/user-docs/`. The text
below is kept as it was decided.

Completes ADR 0001, which sets the monorepo and its workspaces without saying where
the parts that are not an application live, and changes one detail of ADR 0010: the
end-to-end tests are under `packages/e2e/`, not `e2e/`.

## Context

The monorepo holds two applications, the API and the web app, under `apps/`. Two
other parts have a build or a toolchain of their own: the Playwright end-to-end and
regression tests, and, later, the user documentation if it becomes a site. Left at the
root, each adds a top-level folder and a workspace entry of its own.

## Decision

- `apps/` holds what is deployed: `apps/api`, `apps/web`.
- `packages/` holds the other workspaces: the end-to-end tests in `packages/e2e/` now,
  the user documentation later (issue #15).
- The pnpm workspace lists `apps/*` and `packages/*`.

## Consequences

- The rules that name the end-to-end folder (ownership by the QA agent, the coverage
  check, the agents and skills) name `packages/e2e/`.
- `fr-coverage` reads `apps/` and `packages/e2e/` only: the user documentation will
  not count as a test when it moves to `packages/`.
- Until issue #15, the user documentation stays in `docs/user/`.
