# 0015. Problem details for errors, and every response documented

Status: accepted (2026-11-25)

Completed by ADR 0018: the labels of the problem codes are in English. The text below
is kept as it was decided.

Completes ADR 0003, whose consequences left the response codes of an endpoint to the
attention of the reviewer: they are now checked by tests too.

## Context

The web app generates its types from `contracts/openapi.json` (ADR 0003). An error
that an endpoint does not document is an error the web app cannot handle, and an
error body that changes from one endpoint to the next cannot be handled once for all.
Nothing checked that the annotations of a route match what the route really answers,
and the responses Axum produces by itself (unknown route, wrong method, rejected
body) were plain text.

## Decision

- Every error of the API is a problem (RFC 9457), sent as `application/problem+json`,
  with the members `type`, `title`, `status` and `detail`, and one extension, `code`.
- `code` is the stable identifier of the error, written in upper snake case
  (`NOT_FOUND`). It is an enumeration in the OpenAPI document, so the web app gets a
  union of its values and keeps the French labels in one constant record keyed by
  that union: its compilation breaks when a value has no label. A value is never
  renamed or removed without the two issues a contract change takes.
- `type` is `about:blank` and `title` is the reason phrase of the status code, as the
  RFC provides when no page describes the error: `code` tells the errors apart.
  `detail` is in English, for the developer; it is never shown to the user.
- One type in the `api` crate, `Problem`, produces every error response. The errors of
  a context are mapped to it in `api/<context>/error_mapping.rs`. The responses Axum
  produces by itself use it too: unknown route, wrong method, rejected body or
  parameters, internal error.
- An internal error (500) reveals no detail of its cause.
- Each endpoint documents, in its annotations, its success response with its schema
  and every error it can answer, each with the problem schema. Every endpoint declares
  the internal error. A success without a body (204) is the only response without a
  schema.
- Each documented error carries, as its example, the problem the endpoint really
  answers. The example is built from the code that produces the response, never typed
  by hand, so the two cannot differ. Without it, a tool that reads the document, like
  the page of `/api/docs`, invents values from the schema: a status of 0 and the first
  value of `code`.
- `GET /api/health` is no exception: it answers a problem when the database is down.
- The rule is checked three ways: it is written in `.claude/rules/backend.md`; a test
  of the generated document and a helper of the HTTP tests check it; the
  `code-reviewer` agent has it in its checklist.

## Consequences

- The test of the document fails when an operation declares no success response with
  a schema, an error response without the problem schema, or no internal error. It
  fails too when an error has no example, or an example with another status code. It
  does not check that the `code` of the example is the one the endpoint answers:
  building the example from the code is what guarantees it.
- The helper of the HTTP tests fails when a route answers a status code that its
  operation does not declare. It only sees the cases a test exercises: an error that
  no test triggers can still be undocumented, which is why review checks it too.
- A handler takes its body and its parameters through the extractors of `api`, not
  through those of Axum, so that a rejection is a problem.
- Unknown routes and wrong methods belong to no operation: their 404 and 405 are
  problems, but they are documented nowhere in the OpenAPI document.
- The routes of the page of `/api/docs`, which shows the document in a browser, belong
  to no operation either: the page and its files are not part of the contract. Their
  errors are problems all the same, and the helper of the HTTP tests accepts their
  other answers. No other route is served outside the document.
- Adding an error to an endpoint is a change of the annotation, of the contract and of
  the labels of the web app, in the same pull request.
