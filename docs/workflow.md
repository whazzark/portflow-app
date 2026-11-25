# Delivery workflow

One issue goes through up to three pull requests. A human merges each of them.
The human also starts each stage, one skill per session; inside a stage, the agents
work without waiting, and stop only on a question that is the human's to answer.

```
issue
  |  spec, security review of the spec
  v
spec PR        spec/<NNN>-<slug>        -- gate 1: human merges -->  spec approved
  |  /design (only if ui_impact: yes): brief and first mock-up by the designer agent
  v
design PR      design/<NNN>-<slug>      -- gate 2: human merges -->  design approved
  |  development, tests, documentation, review
  v
code PR        feat/<NNN>-<slug>        -- gate 3: human reviews and merges
  |
  v
production deployment: started by a human
```

## Stages

| Stage | Skill | Agents | Deliverable | Ends with |
|---|---|---|---|---|
| Spec | `/spec <issue>` | `product-owner`, `security-reviewer` | `spec.md` | Spec PR, merged by the human |
| Design | `/design <issue>` | `designer` | `brief.md`, a first mock-up in Claude Design, `design/` | Design PR, merged by the human |
| Development | `/develop <issue>` | `fullstack-developer`, `devops-engineer` | `plan.md`, code, unit and integration tests | Branch pushed |
| Test | `/test <issue>` | `qa-engineer` | End-to-end and regression tests, `test-report.md` | Branch pushed, or back to development |
| Documentation | `/doc <issue>` | `technical-writer` | `packages/user-docs/` | Code PR opened |
| Review | `/review <pr>` | `code-reviewer`, `security-reviewer` | Reports as PR comments | Code PR, merged by the human |

Each skill ends with a handover comment on the issue, whose first line is
`## Handover: <stage>`: what was done, what was not verified, what the next stage must
know. Run each stage in a fresh session.

The skills that open a pull request turn Auto-fix on when the session offers it: the
session is then woken on a CI failure, a merge conflict or a review comment. It lifts
no rule.

A work branch never rebases: each stage merges `origin/main` into it when `main` has
moved, for example after the design pull request.

## Going back

| When | What happens |
|---|---|
| `/test` finds a gap | No report is written. `/develop` fixes the application, never the test, then `/test` runs again |
| `/review` finds a blocker | `/develop` fixes it and deletes the outdated `test-report.md`, then `/test`, then `/doc` updates the pull request, then `/review` again |
| The spec is ambiguous or wrong | The human answers; the change goes through a spec pull request, and the work branch merges it. A code pull request cannot edit `spec.md` or `design/`: CI refuses it |
| The design is merged after the back end | `/develop` runs again for the front end |

## Bugs

A bug (issue form "Bug", label `fix`) has no spec of its own. Its branch is `fix/<NNN>-<slug>`.

1. `/test <issue>` creates the branch and commits the regression test that reproduces
   the bug. It must fail.
2. `/develop <issue>` writes a failing unit test at the level of the fault, then the fix.
3. `/test <issue>` runs the regression test and the whole suite. No report is written.
4. `/doc <issue>` corrects the documentation if it described the wrong behaviour, and
   opens the pull request.
5. `/review <pr>`, then the human reviews and merges.

Chores have no skill: they are done on a `chore/` branch, by hand or on request. It is
the only kind of branch that may change the frame (listed in `docs/conventions.md`),
and the only one whose own checks run in CI: review it accordingly.

## Status

The stages are driven by Claude Code skills, run in an interactive session.

| Skill | State |
|---|---|
| `/discover`, `/spec`, `/design`, `/develop`, `/test`, `/doc`, `/review` | Written, never run |

A GitHub Project board with one column per stage is decided in ADR 0010 and 0011. It is not
set up, and the skills do not read or move cards yet.

## Gates

| Gate | What the human validates | How it is recorded | How it is enforced |
|---|---|---|---|
| Product | What to build and in which order | Discovery PR merged | Issues are created only after the merge |
| 1. Spec | User stories, requirements and acceptance scenarios | Spec on `main` | `conventions.py spec-approved`, run by the skills and in CI; `conventions.py paths` keeps a code pull request from editing the spec |
| 2. Design | Screens and states | Mock-up export in `design/` on `main` (`brief.md` alone is not enough) | `conventions.py design-approved`, run by the skills and in CI |
| 3. Review | The code | PR merged | Branch protection; agents cannot merge |
| Deploy | Going to production | Manual trigger | No agent has production access |

## Where the state lives

The gates live in git: a feature is "spec approved" because its spec is on `main`.
Between two gates, the progress of an issue is in its handover comments and on its
work branch (`plan.md`, `test-report.md`). No session keeps state the next one needs.

## Roles

| Agent | When | Access |
|---|---|---|
| `product-owner` | Discovery and spec | Read-only |
| `security-reviewer` | Spec review, then review of the code pull request | Read-only |
| `designer` | Design stage, and design-system issues | Writes `packages/design-system/`, the brief and the mock-up export in `specs/<NNN>-<slug>/design/`, and syncs the design system in Claude Design |
| `fullstack-developer` | Development, unit and integration tests first | Writes code and the tests under `apps/`; uses the design system, never edits it |
| `devops-engineer` | Development, when `infra_impact` is yes | Writes CI and infrastructure files |
| `qa-engineer` | End-to-end and regression tests, from the spec and the mock-up | Writes under `packages/e2e/` only, does not read the implementation first |
| `technical-writer` | Documentation, once the tests are green | Writes documentation |
| `code-reviewer` | Review of the code pull request | Read-only |

The `designer` agent draws a first mock-up in Claude Design, from the Portflow design
system, which is generated from `packages/design-system` (ADR 0019). The human reviews
it, changes or replaces it, and merges the design pull request: gate 2 is theirs.

## Pull requests of an issue

Up to three: spec, design, code. The code is one branch and one pull request, back
end and front end together, never split: the skills find the work branch from the
issue number. What each pull request must contain is in `docs/conventions.md`.

## Limits

- Keep at most two features waiting for human review.
- Two Claude Code guards and the git hooks catch mistakes; none is a security boundary:
  - `.claude/hooks/guard_git.py` blocks, in Claude Code sessions, the git and gh
    commands that cross a gate: merging, approving, pushing to or rewriting `main`,
    force pushing, skipping or disabling hooks, starting a workflow, changing
    repository settings. It looks for git and gh behind wrappers and in subshells,
    and blocks a git or gh command it cannot parse.
  - `.claude/hooks/guard_edit.py` asks the human before an agent edits the frame:
    the guards, `.claude/settings.json`, `.githooks/`, the convention checks, the CI
    workflows. It does not see a file written through a shell command.
  - `.githooks/` (`pre-commit`, `commit-msg`, `pre-push`) applies to every git
    command of the clone, once `core.hooksPath` is set. The skills set and check it,
    in a worktree too, with `conventions.py setup --fix`.
- Branch protection is the real lock. Because agents push with the owner's account, a
  required approval cannot be used; switching to a bot account later would allow it.
