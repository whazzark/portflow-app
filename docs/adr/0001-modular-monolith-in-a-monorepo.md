# 0001. Modular monolith in a monorepo

Status: accepted (2026-11-24)

## Context

One developer, one back end, one front end, one site and one operator to serve. A
feature has one spec that spans both sides, and the API contract is produced by one
side and consumed by the other.

## Decision

- One repository containing the API (`apps/api`), the web app (`apps/web`), end-to-end
  tests, the contract, specs and docs.
- One deployable API binary, split internally by bounded context.
- Cargo workspaces and pnpm workspaces, orchestrated by Turborepo through
  `package.json` scripts. moon and Bazel were considered and rejected as unnecessary
  at this size.

## Consequences

- A spec, its contract change and both implementations live together; stacked pull
  requests are possible; conventions and CI are defined once.
- CI must filter by path and cache Rust builds.
- Extracting a part later (for example the background worker) remains possible
  because contexts and crates are already separated.
