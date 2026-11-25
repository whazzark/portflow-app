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

- The OpenAPI document is generated from the code into `packages/contracts/openapi.json`
  (ADR 0016) and committed. Never edit it by hand. After writing it, regenerate the
  TypeScript types with `pnpm --filter @portflow/contracts generate` and commit them too.
- A change is backward compatible: a browser tab opened before a deployment still
  runs the previous front end against the new API. Removing or renaming a field takes
  two issues.
- Every error is a problem (RFC 9457, ADR 0015), built with `api::problem::Problem`
  and never with another body. A new error gets a new value of `ProblemCode`; a value
  is never renamed or removed in one issue.
- Each operation declares, in its `#[utoipa::path]`: its success response with its
  schema (204 is the only success without one), every error it can answer with
  `body = Problem, content_type = PROBLEM_CONTENT_TYPE`, and always the 500. Each
  error carries the problem it really answers as its example, built from the code and
  never typed by hand: `example = json!(Problem::database_unavailable())`.
- The errors of a context are mapped to `Problem` in `api/<context>/error_mapping.rs`.
  An unexpected error becomes `Problem::internal()`, which carries no cause.
- A handler takes its body and its parameters through `api::extract` (`JsonBody`,
  `PathParams`, `QueryParams`), never through the extractors of Axum, whose rejection
  is plain text.

## Tests

- Domain and use cases: plain unit tests with in-memory fakes of the ports. No database.
- Repositories: tests against real PostgreSQL.
- HTTP: integration tests of the whole router in `apps/api/tests/`. Each one calls the
  API through `support::call`, never the router directly: it fails when the status
  code is not declared by the operation, or when an error is not a problem.
- Reference the covered requirement: `// covers 12/FR-001` above the test.

## Logging

The API logs with `tracing`, on its standard output; whoever hosts it stores the lines.
The request line is the log of a feature: **a feature adds no log as long as everything
goes as expected.**

What an event is made of, in both formats:

| Field | Comes from | Content |
|---|---|---|
| `timestamp`, `level`, `target` | `tracing` | UTC date, level, Rust module that logs |
| `message` | the event | A fixed sentence in English, lowercase, with no value in it: `"database ping failed"` |
| `method`, `path`, `request_id` | the span `request` of `api::logging` | Inherited by every event logged while a request is handled; never repeated by hand. In JSON they are under `span` |
| `status`, `duration_ms` | the request line only | |
| `error` | an error event | The `Display` of the error: `tracing::error!(%error, "...")` |
| anything else | the event | `snake_case`, an identifier named with the words of `CONTEXT.md` (`discharge_id`), never a whole object |

A value goes in a field, never in the message, so that the lines can be filtered and
counted.

Who writes at each level:

| Level | Means | Written by |
|---|---|---|
| `error` | Someone must look: an unexpected technical error | The place where the error stops, once (see below) |
| `warn` | Abnormal, but absorbed: the user got an answer | The edges only: an adapter of `infrastructure` (a retry, a call slower than a threshold, a fallback), an extractor or a middleware of `api` |
| `info` | What happened, one line per unit of work | The frame only: the request line (`api::logging`) and the life of the binary (`main.rs`). Never a feature |
| `debug` | Diagnosis, off by default | Anyone in `api` and `infrastructure` |

Rules:

- A feature never logs a request, or the start or the end of a use case: the request
  line says it.
- An expected refusal (validation, policy, illegal state: a 4xx) is not logged: the
  status code of the request line is enough.
- An unexpected technical error is logged once, where it stops travelling: in
  `api/<context>/error_mapping.rs` when it becomes a 5xx, or in the adapter that
  absorbs it instead of returning it (`database::ping`). The layers it goes through
  log nothing.
- What a user did belongs to the activity log of `reporting`, not to these logs.
- `domain` and `application` do not log and do not depend on `tracing`: they return errors.
- Never log a credential, a cookie, a header, a query string, a body of a request or
  of a response, or personal data.

Checked by clippy: `println!`, `eprintln!` and `dbg!` are refused outside tests. Checked
by `apps/api/tests/http/logging.rs`: the request line, its identifier, and that no
header, query string or body reaches the logs. The rest is checked by `/review` and by
the human.

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
pnpm --filter @portflow/api openapi        # write packages/contracts/openapi.json from the code
pnpm --filter @portflow/api start          # serve the API on API_ADDRESS
```

Plain `cargo` commands work too, from `apps/api/`. `DATABASE_URL` and `API_ADDRESS` come
from the environment or from `.env` (copy `.env.example`). The API does not apply the
migrations when it starts: run `migrate` first. `GET /api/health` answers whether the
API and its database are up: 200, or a 503 problem when the database is down.

To browse and try the API from a browser, start it and open `/api/docs` on
`API_ADDRESS` (`http://127.0.0.1:8080/api/docs` with `.env.example`). The page is
Swagger UI, served by the API from the same document as
`packages/contracts/openapi.json`. It is exposed in production too, without
authentication: the contract is public, the endpoints are protected by their own
authentication (decided in #22). The routes of the page are not operations of the
document; their errors are problems all the same, and `support::call` accepts their
answers.

The logs go to the standard output. `LOG_FORMAT` chooses how they are written:
`pretty`, one readable line per event, which `.env.example` sets for local development;
`json`, one object per line, which is also the format when the variable is not set. Any
other value stops the API when it starts. `RUST_LOG` sets the level (`error`, `warn`,
`info`, `debug`) and takes the filters of `tracing`: `RUST_LOG=info,sqlx=debug` shows
each SQL statement with the identifier of its request. It is `info` when not set. Each
response carries the identifier of its request in `x-request-id`: search the logs for it.

The migrations are in `apps/api/migrations/`, named `<timestamp>_<description>.sql`,
and embedded in the binary. Each test marked `#[sqlx::test]` gets a fresh, migrated
database. A test of `api` fails when `packages/contracts/openapi.json` differs from the
code: run `openapi` and commit the file. A test of `@portflow/contracts` then fails until
the types are generated again. Another one fails when an operation of the document
breaks the rules of the contract above.

## Before handing over

Format check, lint and tests pass, and neither the OpenAPI export nor the generation
of the types produces a diff.
