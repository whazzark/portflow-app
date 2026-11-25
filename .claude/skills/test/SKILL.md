---
name: test
description: Have the QA agent write and run end-to-end and regression tests from the spec and the mock-up, independently of the implementation, and produce the test report. Sends the work back to development when a requirement fails. For a bug, writes the failing regression test first. Use when the user runs /test with an issue number.
argument-hint: <issue-number>
disable-model-invocation: true
---

# /test <issue>

The deliverables are, on the work branch: the end-to-end and regression tests under
`packages/e2e/`, and `specs/<NNN>-<slug>/test-report.md` with one passing line per functional
requirement. `<NNN>` is the issue number padded to three digits.

The work branch is named after the label of the issue: `feat/<NNN>-<slug>` for a
feature (label `feat`), `fix/<NNN>-<slug>` for a bug (label `fix`).

The value of this stage is independence: the tests come from the spec, not from the
code. Run it in a fresh session, not in the one that ran `/develop`.

## 1. Preconditions

- `$ARGUMENTS` must be one issue number. Otherwise stop and ask for it.
- `git status --porcelain` must be empty. Otherwise stop.
- `python3 scripts/conventions.py setup` must pass: the git hooks are active. If not, stop
  and give the human the command it prints.
- `git fetch origin`, then `gh issue view $ARGUMENTS --json labels,state,title --comments`.
- For a bug (label `fix`), read "Bugs" at the end first.
- Switch to the work branch. Stop if it does not exist: `/develop $ARGUMENTS` comes first.
- Bring in what was merged since: if `git log HEAD..origin/main --oneline` is not empty,
  `git merge origin/main`. On a conflict, stop and report.
- Read the spec and the last issue comment starting with `## Handover: develop`. If it
  says the front end is waiting for the design gate, stop: the feature is not complete.
- Build and start the application as the rules of each area describe. If it does not
  start, stop and report: that is a development problem.

## 2. Write and run the tests

Launch the `qa-engineer` agent. Give it the issue number, the spec, the mock-up
folder when there is one, and `contracts/openapi.json`. Do not give it `plan.md`, the
development comments, or anything you know about the implementation.

- **First run**: it derives the cases from every requirement, acceptance scenario and
  edge case, writes the end-to-end tests under `packages/e2e/` only, and commits them
  (`test(<context>): ...`).
- **Later run** (tests of this issue already exist under `packages/e2e/`): it runs them as
  they are. It adds a test only for a requirement that has none, or to reproduce a
  new gap. It does not rewrite a test that failed.

It then runs the whole `packages/e2e/` suite and returns its table: requirement, test, result.

Unit and integration tests are the developer's. For a requirement with nothing to
see on screen, the QA agent finds the developer's test that references it, runs it,
and names it in the table.

## 3. Sort the results

Run the tests yourself once more and compare with the table. Then, for each line that
does not pass:

- **The application differs from the spec**: a gap. The test stays as it is.
- **A test of another feature fails**: a regression, handled as a gap.
- **The spec is ambiguous, untestable or contradicts itself**: a spec problem. Ask the
  human; the answer goes through a spec pull request.
- **The test is wrong** (it asserts something the spec does not say): the QA agent
  fixes its test, and the change is written in the "Gaps" section of the report.
  Never adjust a test to match the application.
- **Not testable end to end** (needs hardware, a third party, production data): the
  result is `not testable: <reason>`, the line names the developer's test that covers
  the requirement at a lower level, and the human is told. A requirement that no test
  covers at any level is a gap.

## 4a. If there is a gap: back to development

- Push the tests. Do not write `test-report.md`.
- Post one comment on the issue. Its first line is `## Handover: test`, its second
  `Result: gaps`. Then, for each gap: the requirement, the failing test, what was
  expected, what happened, and how to reproduce.
- Stop and tell the human to run `/develop $ARGUMENTS` again, then `/test $ARGUMENTS`.

## 4b. If everything passes: write the report

Write `specs/<NNN>-<slug>/test-report.md` from `specs/_TEMPLATE/test-report.md`. A line
looks like:

```markdown
| FR-001 | packages/e2e/weighing.spec.ts: [12/FR-001] stores the net tonnage | pass |
| FR-003 | apps/api/.../weighing.rs: imports_a_weighing (12/FR-003) | not testable: needs the weighing equipment |
```

One line per test; a requirement may have several. Then:

- `python3 scripts/conventions.py specs` must pass: it checks the report.
- `python3 scripts/conventions.py fr-coverage --issue $ARGUMENTS` must pass: every
  requirement is referenced by a test, the `not testable` ones included.
- Commit the report (`docs(<context>): test report`) and push.

## 5. Hand over

Post one comment on the issue. Its first line is `## Handover: test`, its second
`Result: pass`. Then: the result table, the commands run and their real result, what
was not tested, and the spec problems found. Then stop and report the same to the human.

The next stage is `/doc $ARGUMENTS`.

## Bugs

A bug has no spec of its own and no `test-report.md`. The stage runs twice.

**Before the fix**, when `fix/<NNN>-<slug>` does not exist: create it from
`origin/main`. Launch the `qa-engineer` agent with the issue and the spec it quotes. It
writes the end-to-end test that reproduces the bug, named after the requirement it
protects when there is one (`[12/FR-002] ...`), and commits it. Run it: it must fail,
for the reason the issue describes. If it passes, the bug is not reproduced: stop and
ask the human. Push, post the handover (`Result: regression test written, failing`),
and tell the human to run `/develop $ARGUMENTS`.

**After the fix**: run the regression test and the whole `packages/e2e/` suite. Sort the
results as in step 3. Write no report; post the handover with the result table, then
the next stage is `/doc $ARGUMENTS`.
