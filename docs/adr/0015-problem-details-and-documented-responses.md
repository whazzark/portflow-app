# 0015. Problem details for errors, and every response documented

Status: proposed (2026-11-25)

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
- `code` is the stable identifier of the error. It is an enumeration in the OpenAPI
  document, so the web app maps each value to a French label and its compilation
  breaks when a value has no label. A value is never renamed or removed without the
  two issues a contract change takes.
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
- `GET /api/health` is no exception: it answers a problem when the database is down.
- The rule is checked three ways: it is written in `.claude/rules/backend.md`; a test
  of the generated document and a helper of the HTTP tests check it; the
  `code-reviewer` agent has it in its checklist.

## Consequences

- The test of the document fails when an operation declares no success response with
  a schema, an error response without the problem schema, or no internal error.
- The helper of the HTTP tests fails when a route answers a status code that its
  operation does not declare. It only sees the cases a test exercises: an error that
  no test triggers can still be undocumented, which is why review checks it too.
- A handler takes its body and its parameters through the extractors of `api`, not
  through those of Axum, so that a rejection is a problem.
- Unknown routes and wrong methods belong to no operation: their 404 and 405 are
  problems, but they are documented nowhere in the OpenAPI document.
- Adding an error to an endpoint is a change of the annotation, of the contract and of
  the labels of the web app, in the same pull request.
