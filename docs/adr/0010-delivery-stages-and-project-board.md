# 0010. Delivery stages and project board

Status: accepted (2026-11-24)

Completed by ADR 0011: a second backward move of a card, `review` to `active`, and
the card that stays in `design` while the back end is developed early. Changed by
ADR 0013: the end-to-end tests are under `packages/e2e/`, not `e2e/`. The text below
is kept as it was decided.

Completes ADR 0008, which states that orchestration is "Claude Code skills calling
deterministic scripts" without naming the stages. Supersedes nothing.

## Context

Spec Kit was tried as the orchestrator and removed (ADR 0009): its agent steps are
non-interactive and its gates are not merged pull requests. The orchestration is
therefore written in this repository.

Two questions remained open: how the delivery of an issue is cut into steps, and how
anyone, human or agent, knows where an issue stands. Deriving the position from git
alone works for the gates (a spec on `main` is an approved spec) but says nothing
between two gates, and nothing about whose turn it is.

## Decision

- **One stage, one skill, one deliverable.** Delivery is cut into stages. Each stage
  is one skill run in an interactive session, led by the agents of one role, and ends
  with a deliverable the next stage can read without having followed the session.

  | Stage | Skill | Agents | Deliverable |
  |---|---|---|---|
  | Spec | `/spec` | `product-owner`, `security-reviewer` | `spec.md`, spec pull request |
  | Design | `/design` | none: the human designs | `design/`, design pull request |
  | Development | `/develop` | `fullstack-developer`, `devops-engineer` | `plan.md`, code, unit and integration tests |
  | Test | `/test` | `qa-engineer` | End-to-end and regression tests, `test-report.md` |
  | Documentation | `/doc` | `technical-writer` | `docs/user/`, code pull request |
  | Review | `/review` | `code-reviewer`, `security-reviewer` | Reports on the pull request |

- **Two authors of tests, two territories.** The developer writes the unit and
  integration tests, under `apps/`, and commits them failing before the code. The QA
  agent writes the end-to-end and regression tests, under `e2e/`, after development,
  because they need a running application, and from the spec alone, without the plan
  or the implementation. Neither changes the tests of the other.

- **A handover comment ends every stage.** It is posted on the issue: what was done,
  what was not verified, what the next stage must know.

- **A GitHub Project board shows the stage of each issue**, one column per stage:

  | Column | Meaning | Whose turn |
  |---|---|---|
  | `new` | Issue created, not specified | Human: triage |
  | `spec` | Being specified, or spec pull request open | Spec agents, then the human |
  | `ready` | Spec approved, not started | Nobody: the queue |
  | `design` | Mock-up in progress, or design pull request open | Human |
  | `active` | Development | Development agents |
  | `test` | End-to-end and regression tests | QA agent |
  | `doc` | Documentation | Technical writer |
  | `review` | Code pull request open | Review agents, then the human |
  | `close` | Merged | Nobody |

  `design` is skipped when the spec has `ui_impact: no`.

- **A bug takes a shorter path.** It has no spec of its own: its card goes from `new`
  to `test`, where the QA agent writes the failing regression test, then `active` for
  the fix, back to `test`, then `doc`, `review` and `close`. It never enters `spec`,
  `ready` or `design`. Its branch is `fix/<NNN>-<slug>`.

- **The board says whose turn it is; git proves the gates.** A column is never the
  evidence that a gate is passed. Before working, a skill checks that the column
  agrees with git through `scripts/conventions.py` (`spec-approved`,
  `design-approved`, the test report, the requirement coverage) and refuses to start
  otherwise.

- **Who moves a card.**
  - An agent moves a card one column forward, at the end of its own stage, and never
    across a human gate.
  - The only backward move an agent makes is `test` to `active`: when a requirement
    fails, with the gaps described in the handover comment, or when the regression
    test of a bug is written.
  - Leaving `spec`, `design` and `review` is the consequence of a pull request merged
    by the human.

- **A card with an open pull request stays in its column.** It is waiting for the
  human. At most two cards wait at the same time.

## Consequences

- An issue may be worked on by different sessions, days apart: the board and the
  handover comments carry the state, not the memory of a session.
- The board duplicates part of what git knows. When they disagree, git wins and the
  card is corrected.
- The skills need the `project` scope on the GitHub token to read and move cards.
  Granting it is a human decision.
- The moves caused by a merge need an automation, either the built-in workflows of
  the project or a GitHub Action with a dedicated token. Neither has been tried.
- A stage with nothing to do still happens: the technical writer answers "not visible
  to the user" rather than the card skipping `doc`.

## Not decided here

- How the project, field and option identifiers are stored and read.
- Whether one skill reads the column and launches the right stage (`/next`).
- The automation of the moves caused by a merge.

Until these are settled, the skills do not read or move cards: the human runs each
stage by hand, in the order of the table.
