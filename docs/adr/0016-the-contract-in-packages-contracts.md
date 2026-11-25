# 0016. The contract in packages/contracts

Status: accepted (2026-11-25)

Completes ADR 0003, which puts the contract in `contracts/openapi.json` and the
generated types inside the web app, and ADR 0013, which lists the workspaces of
`packages/`.

## Context

The API writes the OpenAPI document; the web app generates its TypeScript types from
it. With the file at the root and the types inside `apps/web`, Turborepo does not know
that the web app depends on the contract, and the check that the types match the
contract belongs to the web app although it is about the contract alone. The question
was raised in #9 and left to the maintainer in #11.

## Decision

- The contract is a workspace of its own, `packages/contracts`, named
  `@portflow/contracts`. It is not deployed, so it sits under `packages/` (ADR 0013).
- It holds `openapi.json`, written by the API (`pnpm --filter @portflow/api openapi`),
  and the TypeScript types generated from it with `openapi-typescript`
  (`pnpm --filter @portflow/contracts generate`). Both files are committed.
- It holds types only. The HTTP client is created by the web app in
  `src/shared/api/`, which imports the types from `@portflow/contracts`: the base URL
  and the handling of errors belong to the application.
- A test of the package regenerates the types from `openapi.json` and fails when they
  differ from the committed ones. The test of the API that compares the document with
  the code reads the same file.

## Consequences

- The web app declares `@portflow/contracts` as a dependency, so Turborepo builds and
  tests the contract before the web app, and the CI filters of the API and of the web
  app both watch `packages/contracts/**`.
- One more workspace for two files. In exchange, the check of the types runs whenever
  the contract changes, whichever app the change comes from.
- The rules, agents and skills that named `contracts/openapi.json` name
  `packages/contracts/openapi.json`.
