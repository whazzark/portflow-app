# Architecture decision records

One file per structural decision: `NNNN-short-title.md`, with Status, Context,
Decision and Consequences. An accepted ADR is not edited to change the decision; a
new ADR supersedes it. A short note under the status line says what a later ADR
superseded or completed; the text below it stays as it was decided.

An ADR is accepted when the human merges the pull request that adds it; not merging
it is the refusal. So the author of that pull request, agent or human, writes the
status line `Status: accepted (YYYY-MM-DD)` in it, with the date it is written. No one
changes that line afterwards: a later ADR that supersedes or completes it adds the
note under it. There is no "proposed" status: an ADR under discussion lives only on
its branch. `conventions.py adrs` refuses any other status line in `docs/adr/`.

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
| 0012 | Design system and atomic design |
| 0013 | A packages folder for the end-to-end tests and the user documentation |
| 0014 | The user documentation in packages/user-docs |
| 0015 | Problem details for errors, and every response documented |

Domain decisions taken in the previous repository (immutable report snapshots,
activity log scope, rotation corrections, capacity compliance, and others) are not
copied here. Re-decide each one in the spec or ADR of the feature that needs it.
`CONTEXT.md` still mentions many of them inside its definitions: there they are notes
that a spec may confirm, change or drop, not decisions.
