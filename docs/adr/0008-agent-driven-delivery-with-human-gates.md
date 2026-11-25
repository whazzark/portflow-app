# 0008. Agent-driven delivery with human gates

Status: accepted (2026-11-24)

Superseded in part by ADR 0009: the pull requests of an issue are spec, design and one
code pull request; traceability is by functional requirement, not acceptance
criterion; Spec Kit is not used, and `docs/spec-kit.md` no longer exists. Completed by
ADR 0010, which names the delivery stages. A few conventions have no automatic check;
`docs/conventions.md` marks them. Changed by ADR 0019: the `designer` agent draws a
first mock-up at the design stage; the human still approves it. The text below is kept
as it was decided.

## Context

The human's value is in product decisions, specs and review. Code is written by
agents. For that to be safe and predictable, the frame around the agents must be
explicit and checked by machines rather than remembered.

## Decision

- Human gates: product (discovery), spec, design (UI features), code review. Production
  deployment is started by a human. Each gate is a merged pull request.
- Specs live in the repository; issues carry the need and the tracking.
- Several pull requests per issue: spec, design, back end, front end.
- Role agents with separate contexts: product owner, security reviewer, full-stack
  developer, QA engineer, code reviewer, technical writer, DevOps engineer.
- Tests first; every acceptance criterion is traced to a test.
- Every convention has an automatic check (`scripts/conventions.py`, hooks, CI).
- State lives in GitHub. Orchestration is thin: Claude Code skills calling
  deterministic scripts. Spec Kit may replace the orchestration later (`docs/spec-kit.md`).
- Agents push with the owner's GitHub account and are forbidden from merging.

## Consequences

- The human becomes the bottleneck; work in review is limited to two features.
- A required approval cannot be enforced with a single account; the lock is that
  only the owner merges. A bot account would allow required approvals later.
- The process is predictable; generated code is not. Deviations are caught by tests,
  independent QA and review.
- Rules are added when an agent makes a mistake, not in anticipation.
