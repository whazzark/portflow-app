# 0014. The user documentation in packages/user-docs

Status: accepted (2026-11-25)

Completed by ADR 0018: the user documentation is in English. The text below is kept as
it was decided.

Changes one detail of ADR 0010: the documentation stage writes the user documentation
in `packages/user-docs/`, not `docs/user/`. Completes ADR 0013, which planned the move
without naming the folder.

## Context

ADR 0013 puts the workspaces that are not deployed under `packages/` and announces
that the user documentation will join them (issue #15), so that it can become a site
of its own later. Until then it was planned in `docs/user/`, next to the technical
documentation, and a `docs/` branch could change it. No page had been written yet.

## Decision

- The user documentation lives in `packages/user-docs/`, in French.
- The branches that may change it are the same as before: `feat/` and `fix/` through
  `/doc`, `chore/`, and `docs/` for a correction outside a feature. The paths check
  allows `packages/user-docs/` on a `docs/` branch.
- It is not a workspace yet: it gets a `package.json` only when it becomes a site.

## Consequences

- `CLAUDE.md`, `docs/workflow.md`, `docs/conventions.md`, the `/doc` skill and the
  `technical-writer` agent name `packages/user-docs/`.
- `fr-coverage` still reads `apps/` and `packages/e2e/` only: a page of the user
  documentation never counts as a test.
- `docs/` holds only the technical documentation.
