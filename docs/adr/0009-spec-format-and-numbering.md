# 0009. Spec format and numbering

Status: accepted (2026-11-24)

Supersedes two points of ADR 0008: the sentence that defers Spec Kit ("Spec Kit may
replace the orchestration later"), and the split of the code in a back-end and a
front-end pull request. The rest of ADR 0008 stands.

## Context

ADR 0008 kept Spec Kit for later and defined a repository-specific spec format
(`BR-k`, `AC-k`) and naming (`<type>/<issue>-<slug>`). Spec Kit 0.14.2 was installed
and tried in this repository, then removed: its skills number features sequentially
instead of by issue, its gates are terminal prompts instead of merged pull requests,
and its workflow runs each agent step as a non-interactive session that cannot ask
the human a question. What was worth keeping is its spec format, which no longer
depends on the tool. No spec had been written, so the change of format cost nothing.

## Decision

- Spec Kit is not used. The orchestration stays what ADR 0008 describes: Claude Code
  skills calling deterministic scripts.
- Specs use prioritised user stories with Given / When / Then scenarios, functional
  requirements `FR-kkk` and success criteria `SC-kkk`, with a front matter (`issue`,
  `title`, `ui_impact`, `infra_impact`) and the sections "Security Considerations" and
  "UI". The template is `specs/_TEMPLATE/spec.md`.
- Traceability moves from `N/AC-k` to `N/FR-kkk`.
- The issue number is padded to three digits in branch and folder names:
  `spec/012-<slug>`, `specs/012-<slug>/`. It is the issue number, never a sequential
  counter.
- One issue gives up to three pull requests: spec, design, code. The code is one
  branch and one pull request, `feat/<NNN>-<slug>`, back end and front end together.
- `scripts/conventions.py` remains the check for all of the above.

## Consequences

- Acceptance scenarios have no identifier of their own: a test is traced to a
  requirement, so each requirement must be precise enough to be tested.
- The skills for the spec and code stages are written and maintained in this
  repository (`docs/workflow.md`, ADR 0010).
- The format is ours to maintain: nothing upgrades it, and nothing overwrites it.
