# Delivery workflow

One issue goes through up to three pull requests. A human merges each of them.
The human also starts each stage, one skill per session; inside a stage, the agents
work without waiting, and stop only on a question that is the human's to answer.

```
issue
  |  spec, security review of the spec
  v
spec PR        spec/<NNN>-<slug>        -- gate 1: human merges -->  spec approved
  |  /design (only if ui_impact: yes), run by the human
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
| Design | `/design <issue>` | none: the human designs | `design/` | Design PR, merged by the human |
| Development | `/develop <issue>` | `fullstack-developer`, `devops-engineer` | `plan.md`, code, unit and integration tests | Branch pushed |
| Test | `/test <issue>` | `qa-engineer` | End-to-end and regression tests, `test-report.md` | Branch pushed, or back to development |
| Documentation | `/doc <issue>` | `technical-writer` | `docs/user/` | Code PR opened |
| Review | `/review <pr>` | `code-reviewer`, `security-reviewer` | Reports as PR comments | Code PR, merged by the human |

Each skill ends with a handover comment on the issue, whose first line is
`## Handover: <stage>`: what was done, what was not verified, what the next stage must
know. Run each stage in a fresh session.

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
the only kind of branch that may change the frame (guards, checks, conventions
workflow), and the only one whose own checks run in CI: review it accordingly.

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
| `fullstack-developer` | Development, unit and integration tests first | Writes code and the tests under `apps/` |
| `devops-engineer` | Development, when `infra_impact` is yes | Writes CI and infrastructure files |
| `qa-engineer` | End-to-end and regression tests, from the spec and the mock-up | Writes under `e2e/` only, does not read the implementation first |
| `technical-writer` | Documentation, once the tests are green | Writes documentation |
| `code-reviewer` | Review of the code pull request | Read-only |

Mock-ups are made by the human in Claude Design; `/design` prepares the brief and
packages the export.

## Pull requests of an issue

- Spec and design pull requests use `Refs #12`. The code pull request uses `Closes #12`.
- The code is one branch and one pull request, `feat/<NNN>-<slug>`, back end and front
  end together. It is not split: the skills find the work branch from the issue number.
- The code pull request of a feature contains `test-report.md` and covers every
  functional requirement. CI checks both.

## Limits

- Keep at most two features waiting for human review.
- Three local guards catch mistakes; none is a security boundary:
  - `.claude/hooks/guard_git.py` blocks, in Claude Code sessions, the git and gh
    commands that cross a gate: merging, approving, pushing to or rewriting `main`,
    force pushing, skipping or disabling hooks, starting a workflow, changing
    repository settings. It looks for git and gh behind wrappers and in subshells,
    and blocks a git or gh command it cannot parse.
  - `.claude/hooks/guard_edit.py` asks the human before an agent edits the frame:
    the guards, `.claude/settings.json`, `.githooks/`, the convention checks, the CI
    workflows. It does not see a file written through a shell command.
  - `.githooks/` (`pre-commit`, `commit-msg`, `pre-push`) applies to every git
    command of the clone, once `core.hooksPath` is set. The skills check it with
    `conventions.py setup`.
- Branch protection is the real lock. Because agents push with the owner's account, a
  required approval cannot be used; switching to a bot account later would allow it.
