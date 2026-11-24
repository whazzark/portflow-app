# Conventions

The rules on this page are checked by `scripts/conventions.py`: by the git hooks and
the Claude Code guard for branches and commits, by the skills, and in CI. The few that
no script checks are marked "(not checked)": they are verified by `/review` and by the
human. Do not add a rule here without saying how it is checked.

## Issues

Created only through the forms in `.github/ISSUE_TEMPLATE/`: user story, epic, bug,
chore. Blank issues are disabled in GitHub. A user story is one user action and becomes one spec.

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
| `feat` | Code for a user story: `feat/012-record-weighing`. One branch and one pull request per issue |
| `fix` | Bug fix |
| `chore` | Tooling, CI, refactoring, dependencies |
| `docs` | Documentation and product discovery |

Slug: lowercase kebab-case. `main` is protected: no direct commit, no direct push.

## What a branch may change

| Branch | May change |
|---|---|
| `spec/` | `specs/` and `CONTEXT.md` |
| `design/` | The spec folder of its issue, spec included |
| `docs/` | `docs/`, `README.md`, `CONTEXT.md` |
| `feat/` | Everything except `specs/`, where it adds only `plan.md` and `test-report.md` to the folder of its issue |
| `fix/` | Everything except `specs/` |
| `chore/` | Everything |

On every branch but `chore/`, the frame is read-only: `.claude/hooks/`,
`.claude/settings.json`, `.githooks/`, `scripts/`, `.github/workflows/conventions.yml`,
`.github/CODEOWNERS`, the pull request template and the issue forms.

So an approved spec or design changes only through a spec or design pull request,
and a pull request cannot weaken the checks that judge it.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

- Types: `feat`, `fix`, `spec`, `design`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`.
- Scope: optional, lowercase kebab-case, usually the context (`discharges`, `auth`, `web`, `api`).
- Description: starts lowercase, no trailing period, header of 72 characters at most.
- Second line blank.
- Merge and revert commits written by git (`Merge branch ...`, `Revert "..."`) are exempt.
- Tests are committed before the implementation they cover: `test(...)`, then
  `feat(...)` or `fix(...)` (not checked).

## Pull requests

- Title: `<type>(<scope>): <description> (#<issue>)`. The type must match the branch type
  (`chore/` branches accept `chore`, `ci`, `build`, `refactor`, `test`, `perf`).
- Body: the sections of `.github/pull_request_template.md`, all present, in order,
  none empty (`N/A` when a section does not apply).
- `Issue` contains `Refs #<issue>` for spec and design PRs, `Closes #<issue>` for `feat/`
  and `fix/` PRs. Other branches use either.
- `Spec` links `specs/<NNN>-<slug>/` for spec, design and feat PRs.
- `Requirements covered` lists the functional requirements on a `feat/` PR.
- Every checklist item of the template is present and ticked; none is removed or reworded.
- Merged by squash; the PR title becomes the commit on `main` (a repository setting).

## Specs

The templates are in `specs/_TEMPLATE/`: `spec.md`, `plan.md`, `test-report.md`.

```
specs/<NNN>-<slug>/
  spec.md
  design/        brief.md and the mock-up export, only when ui_impact is yes
  plan.md        written by /develop on the work branch (not checked)
  test-report.md written by /test on the work branch of a user story
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

Only test files count: everything under `e2e/`, any `tests/` folder, `*.test.ts(x)` and
`*.spec.ts(x)` files, and Rust files that contain test code (`#[test]`,
`#[cfg(test)]`). A reference in application code is ignored.

The code pull request of a user story must cover every functional requirement of its
spec (`fr-coverage`) and contain the test report (`test-report`).

## Commands

```bash
python3 scripts/conventions.py branch
python3 scripts/conventions.py commit-msg <file>
python3 scripts/conventions.py commits origin/main..HEAD
python3 scripts/conventions.py pr --branch <b> --title "<t>" --body-file <f>
python3 scripts/conventions.py specs
python3 scripts/conventions.py spec-approved --issue <n>
python3 scripts/conventions.py design-approved --issue <n>
python3 scripts/conventions.py fr-coverage --issue <n>
python3 scripts/conventions.py test-report --issue <n>
python3 scripts/conventions.py paths
python3 scripts/conventions.py setup
```

In CI, the checks that run are the ones of `main`, except on a `chore/` branch, which
runs its own.
