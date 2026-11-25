---
paths:
  - "apps/api/**"
---

# Back-end rules (Rust)

Stack: Rust, Axum, sqlx, PostgreSQL, utoipa. See `docs/architecture.md`.

## Crates and contexts

The crates, their dependency direction and the bounded contexts are in
`docs/architecture.md` (Back end). When writing code:

- `domain` declares no axum, sqlx, tokio or other I/O crate. If you need one, the code
  belongs elsewhere.
- `application` has one file per use case: it loads aggregates through ports, checks
  the policy, calls the domain, saves, records the activity log, schedules side
  effects, and owns the transaction.
- `infrastructure` only implements ports and queries. `api` holds no business rule.
- `domain::shared` holds identifiers and tiny value objects, nothing else.

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
Each script runs `apps/api/scripts/cargo.sh`.

```
pnpm format:check --filter @portflow/api   # cargo fmt --all --check
pnpm lint --filter @portflow/api           # cargo clippy --all-targets -- -D warnings
pnpm build --filter @portflow/api          # cargo build --all-targets
pnpm test --filter @portflow/api           # cargo test; needs pnpm db:up
pnpm db:up                                 # local PostgreSQL
pnpm --filter @portflow/api migrate        # apply the pending migrations
pnpm --filter @portflow/api openapi        # write contracts/openapi.json from the code
pnpm --filter @portflow/api start          # serve the API on API_ADDRESS
```

Plain `cargo` commands work too, from `apps/api/`. `DATABASE_URL` and `API_ADDRESS` come
from the environment or from `.env` (copy `.env.example`). The API does not apply the
migrations when it starts: run `migrate` first. `GET /api/health` answers whether the
API and its database are up.

The migrations are in `apps/api/migrations/`, named `<timestamp>_<description>.sql`,
and embedded in the binary. Each test marked `#[sqlx::test]` gets a fresh, migrated
database. A test of `api` fails when `contracts/openapi.json` differs from the code: run
`openapi` and commit the file.

## Before handing over

Format check, lint and tests pass, and the OpenAPI export produces no diff.
