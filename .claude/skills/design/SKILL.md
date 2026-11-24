---
name: design
description: Prepare the design brief for an approved spec with UI impact, then open the design pull request once the mock-up export is in the spec folder (human gate 2). Use when the user runs /design with an issue number.
argument-hint: <issue-number>
disable-model-invocation: true
---

# /design <issue>

The mock-up itself is made by the human in Claude Design. This skill writes the brief
before, and packages the result after. The deliverables are
`specs/<NNN>-<slug>/design/brief.md`, the export next to it, and the design pull
request. `<NNN>` is the issue number padded to three digits (issue 12 gives `012`).

## 1. Preconditions

- `$ARGUMENTS` must be one issue number. Otherwise stop and ask for it.
- `git fetch origin`
- `python3 scripts/conventions.py setup` must pass: the git hooks are active. If not, stop
  and give the human the command it prints.
- `python3 scripts/conventions.py spec-approved --issue $ARGUMENTS` must pass. If not, stop.
- Read the approved spec. If `ui_impact: no`, stop: no design gate is needed.
- `git status --porcelain` must show nothing outside `specs/<NNN>-<slug>/design/`.
  Otherwise stop.
- Switch to `design/<NNN>-<slug>` if it exists, otherwise create it from `origin/main`.

## 2. If `design/` holds no export yet: write the brief

Write `specs/<NNN>-<slug>/design/brief.md`, which the human pastes into Claude Design:

- The screens to design and, for each, every state required by the acceptance
  scenarios: nominal, empty, loading, error, refused action.
- A table: acceptance scenario visible on screen, screen, state.
- The actor and context of use (office desktop, or field tablet/phone with gloves and sunlight).
- The French labels to show on screen. `CONTEXT.md` defines the terms in English and
  holds no French label: reuse the labels of the mock-ups already approved in `specs/`,
  propose one for each new term, and list the new ones for the human to confirm. Once
  merged, the mock-up is the reference for these labels.
- The components of the design system to reuse, and the existing screens to stay consistent with.
- The UX rules of `.claude/rules/frontend.md`.

Commit `design(<context>): brief` and push. Do not open a pull request yet.

Then stop and tell the human to create the mock-up, export it into
`specs/<NNN>-<slug>/design/` on this branch, and run `/design $ARGUMENTS` again.

## 3. If the export is present: check and open the pull request

The export is every file of `design/` other than `brief.md`.

- Coverage check: for each line of the table of the brief, name the file and the state
  of the mock-up that shows it. List the scenarios with no matching state.
- If the mock-up revealed a gap in the spec, update the spec in the same branch and
  call the change out in the summary of the pull request.
- In the "UI" section of the spec, replace `Mock-up: pending design gate.` with links to
  the files in `design/`. If the line is not there, add the links at the end of the section.
- Run `python3 scripts/conventions.py specs` and `python3 scripts/conventions.py paths`.
- Commit `design(<context>): <screen name>` and push.
- Title `design(<context>): <screen name> (#$ARGUMENTS)`, body from
  `.github/pull_request_template.md` with `Refs #$ARGUMENTS`. Sections that do not
  apply contain `N/A`. In the checklist, the two items about tests are ticked: a design
  pull request changes no test and no code.
- Validate title and body with `python3 scripts/conventions.py pr`, then create the
  pull request, or update it if one exists for the branch. Never merge it.

## 4. Hand over

Post one comment on the issue with `gh issue comment`. Its first line is
`## Handover: design`. Then: the link of the pull request, the scenario-to-state
table, any change made to the spec, and the scenarios with no matching state.

Then stop and report the same to the human, who reviews the mock-up and merges.
`/develop $ARGUMENTS` may already have done the back end; it does the front end only
after this merge.
