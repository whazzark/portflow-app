---
paths:
  - "apps/api/**"
---

# Back-end rules (Rust)

Stack: Rust, Axum, sqlx, PostgreSQL, utoipa. See `docs/architecture.md`.

## Crates and dependency direction

The diagram of `docs/architecture.md` is the reference:

```
api  ->  application  ->  domain
infrastructure  ->  application, domain
```

- `domain`: entities, value objects, domain errors, ports (traits). No dependency on
  axum, sqlx, tokio or any I/O crate. If you need one, the code belongs elsewhere.
- `application`: one file per use case. Loads aggregates through ports, checks the
  policy, calls the domain, saves, records the activity log, schedules side effects.
  Owns the transaction.
- `infrastructure`: implementations of the ports (PostgreSQL repositories, hashing,
  mail, storage, job queue, event broadcaster).
- `api`: routes, DTOs, OpenAPI annotations, error mapping, composition root. No business rule.

## Contexts

Each bounded context has the same module name in every crate: `auth`, `users`,
`references`, `discharges`, `reporting`. Contexts reference each other by identifier
only. Shared identifiers and tiny value objects live in `domain::shared`; nothing else does.

## Modelling

- Exclusive states are enums that carry their data. Illegal states must not compile.
- Value objects are built only through a validating constructor returning `Result`.
- State changes are methods on the aggregate that return `Result<_, DomainError>`.
- A rule spanning several aggregates lives in the use case, inside the same transaction.
- Every use case takes the `CurrentUser` as a parameter. Authorization is checked in
  the application layer, never only in a middleware.
- Reads without business rules are queries: the trait and its read model live in
  `application/<context>/queries/`, the SQL that fills the read model directly lives
  in `infrastructure`. `application` never depends on sqlx.

## Keep it readable (the reviewer is learning Rust)

- No `unsafe`. No `unwrap`/`expect` outside tests. No custom macros.
- No advanced generics, lifetimes gymnastics or trait objects without a written reason
  in the PR's "Rust notes".
- Prefer explicit code over clever code. Name types with the words of `CONTEXT.md`.
- Errors: `thiserror` enums per context; map them to HTTP in `api/<context>/error_mapping.rs`.

## Contract

- The OpenAPI document is generated from the code into `contracts/openapi.json` and
  committed. Never edit it by hand.
- A change is backward compatible: a browser tab opened before a deployment still
  runs the previous front end against the new API. Removing or renaming a field takes
  two issues.

## Tests

- Domain and use cases: plain unit tests with in-memory fakes of the ports. No database.
- Repositories: tests against real PostgreSQL.
- HTTP: integration tests of the whole router in `apps/api/tests/`.
- Reference the covered requirement: `// covers 12/FR-001` above the test.

## Migrations

- A migration that is on `main` is never edited: add a new one.

## Commands

From the root of the repository. The toolchain is pinned in `rust-toolchain.toml`.
Each script runs `apps/api/scripts/cargo.sh`, which skips cargo while the workspace has
no crate.

```
pnpm format:check --filter @portflow/api   # cargo fmt --all --check
pnpm lint --filter @portflow/api           # cargo clippy --all-targets -- -D warnings
pnpm build --filter @portflow/api          # cargo build --all-targets
pnpm test --filter @portflow/api           # cargo test
pnpm db:up                                 # local PostgreSQL for the repository tests
```

Plain `cargo` commands work too, from `apps/api/`. The tests that need PostgreSQL read
`DATABASE_URL` from the environment (see `.env.example`).

## Before handing over

Format check, lint and tests pass, and the OpenAPI export produces no diff.
