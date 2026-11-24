---
name: develop
description: Implement an approved spec, or fix a bug, on its work branch, unit and integration tests first, with a short plan the next stages can read. Also used to fix the gaps reported by /test or /review. Does not open the pull request. Use when the user runs /develop with an issue number.
argument-hint: <issue-number>
disable-model-invocation: true
---

# /develop <issue>

The deliverables are, on the work branch: `specs/<NNN>-<slug>/plan.md`, the code, its
unit and integration tests committed before it, and `contracts/openapi.json` up to
date. `<NNN>` is the issue number padded to three digits (issue 12 gives `012`).

The work branch is `feat/<NNN>-<slug>` for a user story and `fix/<NNN>-<slug>` for a bug.

End-to-end and regression tests, documentation and the pull request belong to the
next stages. Do not do them here.

## 1. Preconditions

- `$ARGUMENTS` must be one issue number. Otherwise stop and ask for it.
- `git status --porcelain` must be empty. Otherwise stop.
- `python3 scripts/conventions.py setup` must pass: the git hooks are active. If not, stop
  and give the human the command it prints.
- `git fetch origin`, then `gh issue view $ARGUMENTS --json labels,state,title --comments`.
- For a bug (label `bug`), read "Bugs" at the end first.
- For a user story: `python3 scripts/conventions.py spec-approved --issue $ARGUMENTS`
  must pass. If not, stop.
- Switch to the work branch if it exists, otherwise create it from `origin/main`.
- Bring in what was merged since: if `git log HEAD..origin/main --oneline` is not empty,
  `git merge origin/main`. Never rebase a pushed branch. On a conflict, stop and report.
- Decide the scope from the spec:
  - `ui_impact: no`: back end only.
  - `ui_impact: yes` and `python3 scripts/conventions.py design-approved --issue $ARGUMENTS`
    passes: back end and front end.
  - `ui_impact: yes` and the design gate fails: back end only. Say so; the front end
    waits for the design pull request to be merged, then `/develop` is run again.

### When the branch already has work

Read, in this order, what asks for more work:

- `plan.md`, section "Not done here";
- the last issue comment starting with `## Handover: test`, when it lists gaps;
- the review comments of the pull request, when one is open
  (`gh pr view <branch> --comments`): the blockers.

A gap or a blocker is fixed in the application. The test that found it is not
modified. If `test-report.md` exists and you change code, delete it in the same run
(`docs(<context>): drop outdated test report`): it no longer describes the code, and
`/test` must run again.

## 2. Plan

Write or update `specs/<NNN>-<slug>/plan.md` from `specs/_TEMPLATE/plan.md`, one page
at most: the approach, where each requirement is implemented and at which level it
is tested, the changes to the contract, the decisions the spec does not dictate, and
what is not done here.

Stop and ask the human when:

- the spec is ambiguous or contradicts the code: the answer goes into the spec through
  a spec pull request, not into the plan;
- a decision is structural or contradicts an ADR: draft the new ADR and stop;
- the plan needs a new dependency or a new service.

Otherwise commit the plan (`docs(<context>): plan`) and continue without waiting.

## 3. Implement

Launch the `fullstack-developer` agent with the spec, the plan, the scope and, on a
later run, the gaps or blockers to fix:

- one instance when the work is small or back end only;
- two, one after the other, when both sides are in scope: scope `back` first, then
  scope `front` once the contract is committed. Never two at the same time: they
  share one checkout and one git index.

When the spec has `infra_impact: yes`, launch the `devops-engineer` agent afterwards,
on the same branch, for the CI, container or infrastructure files.

Each agent commits its failing tests before the implementation they cover. Every
functional requirement is referenced by at least one test under `apps/`, including
the ones that cannot be tested end to end.

## 4. Check

Run these yourself; do not rely on the reports of the agents:

- the full checks of each area touched (build, lint, unit and integration tests), as
  its rules in `.claude/rules/` describe;
- `python3 scripts/conventions.py commits origin/main..HEAD`
- `python3 scripts/conventions.py paths`: the branch changed only what it may;
- `git log --oneline origin/main..HEAD`: every `feat(...)` or `fix(...)` commit comes
  after the `test(...)` commit that covers it;
- no commit of this run touches `e2e/` (`git log --oneline -- e2e/`);
- `python3 scripts/conventions.py fr-coverage --issue $ARGUMENTS`. A failure does not
  block this stage: list the requirements not covered yet in the handover.

If a check fails, send the agent back with the output. Never weaken a test to get
green. Update `plan.md` when what was built differs from what was planned.

## 5. Hand over

Push the branch. Do not open the pull request. Post one comment on the issue with
`gh issue comment`. Its first line is `## Handover: develop`. Then:

- the branch, and the scope that was done (back, front, infrastructure), or
  "front end waiting for the design gate";
- the requirement table: `FR`, test that covers it, or "not covered yet";
- the gaps or blockers that were fixed, when this was a later run;
- the commands run and their real result, and what was not run;
- the decisions of the plan, one line each;
- for back-end work, the "Rust notes" of the developer;
- anything out of scope that was noticed.

Then stop and report the same to the human. The next stage is `/test $ARGUMENTS`, in
a fresh session.

## Bugs

A bug has no spec of its own and no `plan.md`. `/test $ARGUMENTS` runs first: it
creates `fix/<NNN>-<slug>` and commits the regression test that reproduces the bug.
If that branch or that test does not exist, stop and say so.

Skip the spec gate, the scope and step 2. Give the developer the issue, the failing
regression test and the spec the bug quotes. The developer writes a failing unit test
at the level of the fault, then the fix. In step 4, skip `fr-coverage`.
