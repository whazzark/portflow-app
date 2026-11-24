# Architecture decision records

One file per structural decision: `NNNN-short-title.md`, with Status, Context,
Decision and Consequences. An accepted ADR is not edited to change the decision; a
new ADR supersedes it. A short note under the status line says what a later ADR
superseded or completed; the text below it stays as it was decided.

Agents must not contradict an accepted ADR. When a change needs a different
decision, they draft a new ADR and stop for the human.

| ADR | Decision |
|---|---|
| 0001 | Modular monolith in a monorepo |
| 0002 | Rust back end with hexagonal architecture and DDD |
| 0003 | OpenAPI contract generated from the API |
| 0004 | React single-page application |
| 0005 | PostgreSQL for jobs and sessions; no Redis, no Kafka |
| 0006 | Session cookie authentication |
| 0007 | Server-sent events for real-time updates |
| 0008 | Agent-driven delivery with human gates |
| 0009 | Spec format and numbering |
| 0010 | Delivery stages and project board |
| 0011 | Protected frame and sources of truth |
| 0012 | Design system and atomic design (proposed) |

Domain decisions taken in the previous repository (immutable report snapshots,
activity log scope, rotation corrections, capacity compliance, and others) are not
copied here. Re-decide each one in the spec or ADR of the feature that needs it.
`CONTEXT.md` still mentions many of them inside its definitions: there they are notes
that a spec may confirm, change or drop, not decisions.
