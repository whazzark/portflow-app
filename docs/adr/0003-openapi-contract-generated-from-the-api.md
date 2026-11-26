# 0003. OpenAPI contract generated from the API

Status: accepted (2026-11-24)

Superseded in part by ADR 0009: an issue has one code pull request, so there is no
back-end pull request to merge alone. Contract changes stay backward compatible for
another reason: a browser tab opened before a deployment runs the previous front end
against the new API. The text below is kept as it was decided.

Completed by ADR 0015: errors are problems (RFC 9457), and tests check that each
endpoint documents its responses.

Completed by #28: CI has no separate step that regenerates the contract and the types.
The check is a test of each app, run by CI with the other tests: in the API, a test
compares `contracts/openapi.json` with the code; in the web app, a test regenerates the
types from the contract and compares them with the committed ones (#11).

Completed by ADR 0016: the contract and the generated types live in the workspace
`packages/contracts`, and the test of the types belongs to it.

Completed by ADR 0017: the web app uses `openapi-fetch` without `openapi-react-query`,
with one query key factory per domain.

Completed by ADR 0020: the web app parses each answer with a Zod schema written by
hand, whose input is bound to the generated type of the answer.

## Context

The web app must never drift from the API. With two languages there is no shared
type system, so the guarantee has to come from a generated contract.

## Decision

- The API generates `contracts/openapi.json` from its code (utoipa). The file is committed.
- The web app generates its TypeScript types from that file (`openapi-typescript`) and
  calls the API through `openapi-fetch`, bound to TanStack Query with `openapi-react-query`.
- CI regenerates the contract and the types and fails on any difference with what is committed.
- Within a multi-PR issue, contract changes are backward compatible so the back-end PR
  can be merged alone.

## Consequences

- An API change that the web app does not handle breaks its compilation.
- One generation step is needed after an API change; a watch script covers local development.
- Response codes and descriptions are declared by hand in annotations and deserve
  attention in review.
- Generated types stay at the edge of each front-end feature.
