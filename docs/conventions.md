# Conventions

The rules on this page are checked by `scripts/conventions.py`: by the git hooks and
the Claude Code guard for branches and commits, by the skills, and in CI. The few that
no script checks are marked "(not checked)": they are verified by `/review` and by the
human. Do not add a rule here without saying how it is checked.

## Issues

Created only through the forms in `.github/ISSUE_TEMPLATE/`: feature, bug, chore,
documentation, style, epic. Blank issues are disabled in GitHub. A feature is one user action
and becomes one spec; the "user stories" of a spec are the slices of that action.

- Title: `<Area>: <result>`, in English, without a type prefix (not checked).

  | Type | Title | Example |
  |---|---|---|
  | Feature | `<Area>: <what the user does>` | `Weighings: record a loaded weighing` |
  | Bug | `<Area>: <what is wrong>` | `Weighings: net tonnage is wrong after a correction` |
  | Chore | `<Area>: <result>` | `CI: cache the Rust builds` |
  | Documentation | `<Area>: <result>` | `README: describe the setup of an existing repository` |
  | Style | `Design system: <result>` | `Design system: review the UI of the button` |
  | Epic | The user activity of the story map | `Rotations and weighings` |

- The area is a part of the product in the words of `CONTEXT.md`, or a part of the
  repository (`README`, `CI`, `Skills`).
- The type is carried by the label the form applies. A label is the type of the branch
  the issue is worked on, the same word as in commits and pull request titles:

  | Label | Issue | Work branch |
  |---|---|---|
  | `feat` | Feature | `feat/`, after its `spec/` and, with a user interface, its `design/` branch |
  | `fix` | Bug | `fix/` |
  | `chore` | Chore | `chore/` |
  | `docs` | Documentation, product discovery | `docs/` |
  | `style` | Style: the visual layer of the design system | `style/` |
  | `epic` | Epic | None: it groups features |

  The labels must exist in the repository. The skills read the label to name the
  branch, and `/spec` accepts only a `feat` issue.

## Branches

```
<type>/<NNN>-<slug>
```

`<NNN>` is the issue number padded to three digits:
issue 12 gives `spec/012-record-weighing`. Issues above 999 keep their digits.

| Type | Use |
|---|---|
| `spec` | The spec of an issue |
| `design` | The mock-up of an issue |
| `feat` | Code for a feature: `feat/012-record-weighing`. One branch and one pull request per issue |
| `fix` | Bug fix |
| `chore` | Tooling, CI, refactoring, dependencies |
| `docs` | Documentation and product discovery |
| `style` | The visual layer of the design system: its tokens, themes and densities, and the look of its atoms, molecules and templates |

Slug: lowercase kebab-case. `main` is protected: no direct commit, no direct push.

## What a branch may change

| Branch | May change |
|---|---|
| `spec/` | `specs/` and `CONTEXT.md` |
| `design/` | The spec folder of its issue, spec included |
| `docs/` | `docs/`, `packages/user-docs/`, `README.md`, `CONTEXT.md` |
| `feat/` | Everything except `specs/`, where it adds only `plan.md` and `test-report.md` to the folder of its issue |
| `fix/` | Everything except `specs/` |
| `style/` | `packages/design-system/`, `packages/e2e/tests/design-system.spec.ts`, `pnpm-lock.yaml` and `.claude/rules/design-system.md` (no other rule, no ADR) |
| `chore/` | Everything |

On every branch but `chore/`, the frame is read-only (`paths`, from the list in
`scripts/checks/paths.py`):

- `.claude/hooks/`, `.claude/settings.json`, `.claude/settings.local.json`
- `.githooks/`, `scripts/`
- `.github/workflows/conventions.yml`, `.github/CODEOWNERS`,
  `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/`
- `specs/_TEMPLATE/`

The edit guard (`.claude/hooks/guard_edit.py`) asks the human before an agent edits
part of it, and also every CI workflow: a change to `.github/workflows/code.yml` is
allowed on any branch, but not without the human.

So an approved spec or design changes only through a spec or design pull request,
and a pull request cannot weaken the checks that judge it.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

- Types: `feat`, `fix`, `spec`, `design`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`, `style`.
- `style` is the visual layer of the design system: its tokens, themes and densities,
  and the styles of its atoms, molecules and templates. It is not code formatting, as
  it is in plain Conventional Commits: a change of formatting is a `chore`.
- Scope: optional, lowercase kebab-case, usually the context (`discharges`, `auth`, `web`, `api`).
- Description: starts lowercase, no trailing period, header of 72 characters at most.
- Second line blank.
- Merge and revert commits written by git (`Merge branch ...`, `Revert "..."`) are exempt.
- Tests are committed before the implementation they cover: `test(...)`, then
  `feat(...)` or `fix(...)` (not checked).
- Many small commits, each one change that can be described in its header: a rename,
  a test, a step of the implementation. Do not gather a branch into one commit and do
  not rewrite its history to tidy it: the pull request is merged by squash, and small
  commits keep the review readable (not checked).
- Only the first commit of a branch ends with the trailer
  `Co-Authored-By: Claude <noreply@anthropic.com>` when Claude wrote it; the
  others carry none, so the squash commit names Claude once (not checked).

## Pull requests

- Title: `<type>(<scope>): <description>`, 64 characters at most, with no issue or pull
  request number: GitHub appends the pull request number at merge, and the issue is in
  the body. The type must match the branch type
  (`chore/` branches accept `chore`, `ci`, `build`, `refactor`, `test`, `perf`, `style`;
  `style/` branches accept `style` only).
- Body: the sections of `.github/pull_request_template.md`, all present, in order,
  none empty (`N/A` when a section does not apply).
- `Issue` contains `Refs #<issue>` for spec and design PRs, `Closes #<issue>` for `feat/`
  and `fix/` PRs. Other branches use either.
- `Spec` links `specs/<NNN>-<slug>/` for spec, design and feat PRs.
- `Requirements covered` lists the functional requirements on a `feat/` PR.
- Every checklist item of the template is present and ticked; none is removed or reworded.
- Merged by squash; the commit on `main` is titled `<title> (#<pr>)` and its body lists
  the messages of the branch commits (a repository setting: default commit message
  "Pull request title and commit details").

## Specs

The templates are in `specs/_TEMPLATE/`: `spec.md`, `plan.md`, `test-report.md`.

```
specs/<NNN>-<slug>/
  spec.md
  design/        brief.md and the mock-up export, only when ui_impact is yes
  plan.md        written by /develop on the work branch (not checked)
  test-report.md written by /test on the work branch of a feature
```

- Front matter: `issue` (without leading zeros), `title`, `ui_impact` (yes/no),
  `infra_impact` (yes/no).
- Title line: `# Feature Specification: <title>`.
- Required sections, in this order: User Scenarios & Testing, Requirements, Success
  Criteria, Security Considerations. `UI` is required when `ui_impact` is yes,
  `Infrastructure` when `infra_impact` is yes. Other sections (Out of Scope,
  Assumptions, Clarifications) are allowed.
- User stories: `### User Story <k> - <title> (Priority: P<n>)`, numbered from 1 without
  gaps, each with at least one **Given** / **When** / **Then** acceptance scenario.
- Requirements: at least one `**FR-001**: ...`, ids unique, three digits. Each one cites at least one
  existing user story: `*(US1)*` or `*(US1, US2)*`. Success criteria: at least
  one `**SC-001**: ...`, ids unique.
- No `[NEEDS CLARIFICATION]` marker left before the spec can be merged.
- No `TODO`, `TBD` or `FIXME`, and no `[text in brackets]` left from the template.
  Links, checkboxes and code spans are not concerned.

`test-report.md`, when present, has the sections Results, Gaps and Not tested. Results
is a table with at least one line per functional requirement of the spec:
`| FR-001 | <test> | pass |`. A line for a requirement that is not in the spec is rejected. The result is `pass` or
`not testable: <reason>`; a report with a `fail` is rejected, because the feature goes back to development.
`not testable` means not testable end to end: the line names the lower-level test
that covers the requirement (not checked), and `fr-coverage` still requires one.

## ADRs

Every ADR in `docs/adr/` carries the status line `Status: accepted (YYYY-MM-DD)`
before its first section (`adrs`). When an ADR becomes accepted, and who writes that
line, is in `docs/adr/README.md`.

## Traceability

A test covering functional requirement `FR-kkk` of issue `n` contains `n/FR-kkk` in
its name or in a comment directly above it:

```rust
// covers 12/FR-002
#[test]
fn refuses_a_loaded_weighing_below_the_empty_weighing() { ... }
```

```ts
test('[12/FR-002] refuses a loaded weighing below the empty weighing', async ({ page }) => { ... })
```

Only test files count: everything under `packages/e2e/`, any `tests/` folder, `*.test.ts(x)` and
`*.spec.ts(x)` files, and Rust files that contain test code (`#[test]`,
`#[cfg(test)]`). A reference in application code is ignored.

`fr-coverage` checks that some test references each requirement, wherever it is. The
rule that one of them is under `apps/` is in `.claude/rules/testing.md` (not checked).

The code pull request of a feature must cover every functional requirement of its
spec (`fr-coverage`) and contain the test report (`test-report`).

## Commands

```bash
python3 scripts/conventions.py branch
python3 scripts/conventions.py commit-msg <file>
python3 scripts/conventions.py commits origin/main..HEAD
python3 scripts/conventions.py pr --branch <b> --title "<t>" --body-file <f>
python3 scripts/conventions.py specs
python3 scripts/conventions.py adrs
python3 scripts/conventions.py spec-approved --issue <n>
python3 scripts/conventions.py design-approved --issue <n>
python3 scripts/conventions.py fr-coverage --issue <n>
python3 scripts/conventions.py test-report --issue <n>
python3 scripts/conventions.py paths
python3 scripts/conventions.py setup [--fix]
```

`spec-approved`, `design-approved`, `fr-coverage` and `test-report` take either
`--issue <n>` or `--branch <b>` (the issue is read from the branch name); `paths`
takes `--branch <b>` to check another branch than the current one. `/review` uses
`--branch` with the head branch of the pull request.

`setup` checks that `core.hooksPath` is `.githooks`, so that git runs the hooks of the
checked-out branch; `--fix` sets it at the scope git reads, the worktree scope in a
worktree that has one.

In CI, the checks that run are the ones of `main`, except on a `chore/` branch, which
runs its own.
