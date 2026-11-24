# 0002. Rust back end with hexagonal architecture and DDD

Status: accepted (2026-11-24)

## Context

The domain is rule-heavy: discharge lifecycle, shifts, rotations, weighings,
validation, immutable reports. Code is written by agents and reviewed by a human who
is learning Rust, so as many rules as possible should be checked by the compiler, and
every piece of code should have one obvious place.

## Decision

- Rust, Axum (HTTP), sqlx (PostgreSQL, SQL checked at compile time), utoipa (OpenAPI).
  Axum is unopinionated on purpose: the architecture provides the opinions.
- Hexagonal architecture in four crates: `domain`, `application`, `infrastructure`, `api`.
- Tactical DDD: aggregates, value objects, enums for exclusive states, one file per
  use case, repositories as ports. Reads without rules use direct SQL in `queries/`.
- Strict lints: `unsafe` forbidden, `unwrap`/`expect` denied outside tests, Clippy
  warnings are errors.
- Code stays simple for a learning reviewer; non-trivial constructs are explained in
  each pull request.

## Consequences

- Illegal states are unrepresentable, and the dependency rule is enforced by the build.
- More files and more conversion code between layers; acceptable because agents write it.
- Slower compilation than a scripting stack; early reviews will be slow.
- No dependency-injection container, no generators, no standard for factories or
  seeders: wiring is explicit in one composition root, test builders are hand-written.
- PDF generation is a known weak spot of the ecosystem and needs its own ADR.
