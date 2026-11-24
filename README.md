# Portflow

Bulk discharge management for the operating organization of a port site: prepare a
discharge, run shifts and truck rotations, record weighings, validate, close and report.

This repository is built with an agent-driven workflow: a human owns the product
decisions, the specs and the reviews; Claude Code agents write the code inside a
strict, checkable frame.

## Status

Bootstrap. The repository contains the frame only: conventions and their checks,
guards, GitHub templates, CI for conventions, agents, skills, rules, architecture
decisions. There is no application code yet. `apps/`, `e2e/` and `contracts/` arrive
with the walking-skeleton issue.

## Where things are

| Path | Content |
|---|---|
| `CLAUDE.md` | What every agent reads first: layout, commands, the rules that always apply |
| `CONTEXT.md` | The vocabulary of the domain. Its names are decided; the rules it mentions are notes |
| `docs/workflow.md` | How an issue goes from spec to merged code, the gates, going back, bugs |
| `docs/conventions.md` | Branches, commits, pull requests, specs, and how each rule is checked |
| `docs/architecture.md`, `docs/adr/` | Structure and decisions |
| `specs/` | One folder per issue; the templates are in `specs/_TEMPLATE/` |
| `.claude/` | Agents, skills, rules, the two guards and the settings |
| `.githooks/`, `scripts/`, `.github/` | Git hooks, convention checks and their tests, CI and templates |

## First-time setup

You need Python 3, git, and the GitHub CLI signed in (`gh auth status`).

The local repository is initialised, its hooks are active and `origin` points to
the GitHub repository. On a new clone, run `git config core.hooksPath .githooks` once.

The first commit and its push are yours to run, in your own terminal. An agent
cannot: the git guard refuses every commit on `main`, the first one included.

```bash
python3 -m unittest discover -s scripts/tests     # the checks test themselves
git add . && git commit -m "chore: bootstrap repository"
git push -u origin main
```

The first commit must contain `scripts/`: CI judges every pull request with the checks
of `main`.

Then, once:

1. Create the labels used by the issue forms:
   `gh label create story`, `gh label create epic`, `gh label create chore` (`bug` exists
   by default). A form whose label does not exist silently applies none, and `/spec`
   recognises a user story by its label.
2. Protect `main` (Settings, Branches or Rulesets):
   - require a pull request before merging;
   - require linear history, block force pushes and deletions;
   - do not allow bypassing these settings.
3. Settings, General: allow squash merging only, default commit message "Pull request
   title", and automatically delete head branches.
4. Check that the two guards are registered in `.claude/settings.json`, under
   `hooks.PreToolUse`: `guard_git.py` for `Bash`, and `guard_edit.py` for
   `Edit|Write|MultiEdit|NotebookEdit`. Editing a file of the frame (for example
   `.githooks/pre-push`) from a Claude Code session must then ask for your confirmation.
5. After the first pull request has run CI, go back to the protection of `main` and
   require the status check `conventions`. GitHub only offers a check that has run once.

Later, when you want it: the GitHub Project board with one column per stage
(ADR 0010 and 0011). Nothing reads or moves its cards yet.

`.claude/settings.json` allows the agents to read only (git, `gh`, the convention
checks). A skill therefore asks you to confirm each commit, push, pull request and
issue comment. Allowing more is your decision.

`CODEOWNERS` and a required approval are intentionally not enforced: agents push
with your account, and GitHub does not let you approve your own pull requests. The
gate is that only you click "Merge" (see `docs/workflow.md`).

## How work flows

A user story:

```
/discover          vision, story map, roadmap, issues     gate: product
/spec <issue>      spec pull request                      gate 1: spec
/design <issue>    mock-up pull request (UI features)     gate 2: design
/develop <issue>   plan, code, unit and integration tests on the work branch
/test <issue>      independent tests and the test report
/doc <issue>       user documentation, code pull request
/review <pr>       independent review                     gate 3: review
```

A bug has no spec and starts with its regression test:

```
/test <issue>      failing regression test on a fix/ branch
/develop <issue>   failing unit test, then the fix
/test <issue>      the regression test and the whole suite pass
/doc <issue>       documentation if it was wrong, code pull request
/review <pr>       independent review                     gate 3: review
```

One skill per session, started by you. You merge at each gate. Each stage ends with a
handover comment on the issue. Details and status in `docs/workflow.md`.

## Changing the frame

The guards, the settings, the git hooks, the convention checks, the conventions
workflow, the templates and the issue forms change only on a `chore/` branch. It is
the only kind of branch judged by its own checks, so review it closely.

## First issues to create

1. Chore: "Product discovery", then run `/discover`.
2. Chore: "Walking skeleton". It proves the whole chain before the first real
   feature. A chore has no spec and no skill: do it by hand or ask for it. It is done
   when it delivers all of this:
   - one Rust endpoint, its OpenAPI contract in `contracts/openapi.json`, the generated
     types, one React screen calling it, one Playwright test;
   - the exact commands to build, lint and test each area, written in
     `.claude/rules/backend.md` and `.claude/rules/frontend.md`: `/develop` runs them;
   - the command that starts the application and how a test creates its data, written
     in `.claude/rules/testing.md`: `/test` needs both;
   - the commands that export the contract and regenerate the types;
   - a CI workflow for the code, which you then add to the required checks of `main`.
3. The stories of the first release, created by `/discover`.

## Checks

```bash
python3 scripts/conventions.py --help
python3 -m unittest discover -s scripts/tests
```

## What was verified when this frame was generated

Verified:

- `scripts/conventions.py`, the two guards in `.claude/hooks/` and the git hooks are
  covered by `scripts/tests`: 67 tests, all passing.
- The steps of the CI workflow were replayed locally in a throwaway repository, on a
  branch that edits its spec and weakens its own check, on an honest branch, and on a
  spec branch that carries code: the first and the last are refused.
- The git guard was given 39 ways around it; the ones it let through were closed and
  are now tests.
- The YAML of the issue forms and of the CI workflow parses.

Not verified:

- Nothing has ever run on GitHub: the CI workflow, the issue forms, the pull request
  template, branch protection.
- No agent and no skill has ever been run on a real issue.
- Whether the edit guard really asks for confirmation in a session, and whether the
  hooks apply to the agents a skill launches.
- The `pre-push` hook on a real push: it was tested with what git sends it.
- That the commit pinned for `actions/checkout` is the release it claims to be.

Expect to adjust the agents and skills after the first two or three issues. Add a
rule only when an agent made the mistake it prevents.
