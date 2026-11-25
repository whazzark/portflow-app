# 0011. Protected frame and sources of truth

Status: accepted (2026-11-24)

Completed by ADR 0016: the API is in `packages/contracts/openapi.json`. The text below
is kept as it was decided.

Completes ADR 0008 (human gates) and ADR 0010 (delivery stages and board).
Supersedes nothing.

## Context

ADR 0008 makes each gate a merged pull request. Reviewing the frame showed three ways
around a gate that no rule closed:

- a code pull request could edit the spec or the mock-up it was supposed to follow;
- a spec, design or docs pull request could carry code;
- a pull request could weaken the check that judges it, because CI ran the checks of
  the branch.

It also showed that several documents state business rules. `CONTEXT.md` mentions
many, inherited from an earlier version of the product; ADR 0006 states some about
sessions. An agent cannot tell which of them was approved for this product.

Finally, ADR 0010 leaves two situations of the board undefined: a review that sends
the work back, and the back end developed while the mock-up waits for the human.

## Decision

- **One source for each kind of truth.**

  | What | Where it is decided |
  |---|---|
  | Behaviour of the product | An approved spec, as functional requirements |
  | Names of the domain and what they designate | `CONTEXT.md` |
  | Labels shown to the user, in French | The approved mock-ups |
  | Structure and technical choices | The ADRs, summarised in `docs/architecture.md` |
  | The API | `contracts/openapi.json`, generated from the code |
  | Formats and naming | `docs/conventions.md`, enforced by `scripts/conventions.py` |

- **A business rule written anywhere else is a note.** The rules that `CONTEXT.md`
  mentions inside its definitions, and a rule of behaviour that an ADR states in
  passing, are defaults to propose to the human. They apply once an approved spec
  states them. Nothing is implemented or tested on their strength alone.

- **What was approved changes only through its own gate.** Each type of branch may
  change only some paths, checked by `scripts/conventions.py paths`:

  | Branch | May change |
  |---|---|
  | `spec/` | `specs/` and `CONTEXT.md` |
  | `design/` | The spec folder of its issue |
  | `docs/` | `docs/`, `README.md`, `CONTEXT.md` |
  | `feat/` | Everything except `specs/`, where it adds `plan.md` and `test-report.md` to the folder of its issue |
  | `fix/` | Everything except `specs/` |
  | `chore/` | Everything |

- **The frame is protected.** The guards (`.claude/hooks/`, `.claude/settings.json`,
  `.githooks/`), the checks (`scripts/`), the conventions workflow, `CODEOWNERS`, the
  pull request template, the issue forms and `specs/_TEMPLATE/` change only on a
  `chore/` branch.

- **A pull request is judged by the checks of `main`.** CI runs the convention checks
  as they are on `main`. A `chore/` branch, the only one allowed to change them, runs
  its own.

- **The local guards catch mistakes; they are not a security boundary.** The git
  guard, the edit guard and the git hooks stop an agent that goes wrong. Branch
  protection on GitHub, and the human who merges, are the lock.

- **Two additions to the board of ADR 0010.**
  - A second backward move exists: `review` to `active`, made by `/review` when it
    finds a blocker, with the blockers in its summary comment.
  - When the back end is developed before the design pull request is merged, the
    card stays in `design`: that is the stage waiting for the human. The handover
    comment of `/develop` says the back end is done.

## Consequences

- A spec found wrong during development costs a round trip through a spec pull
  request. That is the price of a spec that means what was approved.
- The first specs ask many questions: almost every rule met in `CONTEXT.md` has to be
  confirmed. A spec pull request may then shorten the entry to its definition.
- The first approved mock-up fixes the French labels in practice: no list exists to
  compare it with.
- A `chore/` pull request deserves the closest review: it can change the frame and it
  is judged by its own checks.
- The workflow file itself is run as the pull request has it, which is how GitHub
  works for this trigger. The path rule refuses the change, but only if the step runs:
  the human review of a `chore/` branch remains the last line.
- Session rules stated in ADR 0006 (which sessions a password change revokes) are
  defaults in this sense: the spec of authentication confirms or changes them.
