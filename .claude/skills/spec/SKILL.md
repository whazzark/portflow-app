---
name: spec
description: Turn a GitHub issue into a spec through an interview with the human, have it reviewed for security, and open the spec pull request (human gate 1). Use when the user runs /spec with an issue number.
argument-hint: <issue-number>
disable-model-invocation: true
---

# /spec <issue>

The deliverable is `specs/<NNN>-<slug>/spec.md`, readable by an agent that did not
follow this session, and a spec pull request. `<NNN>` is the issue number padded to
three digits (issue 12 gives `012`).

You run in an interactive session: ask the human instead of guessing a business rule.

## 1. Preconditions

- `$ARGUMENTS` must be one issue number. Otherwise stop and ask for it.
- `git status --porcelain` must be empty. Otherwise stop: do not switch branch over
  uncommitted work.
- `python3 scripts/conventions.py setup` must pass: the git hooks are active. If not, stop
  and give the human the command it prints.
- `gh issue view $ARGUMENTS --json number,title,body,labels,state`. Stop if the issue
  is closed. Stop if it is not a feature (label `feat`): a bug has no spec, see
  "Bugs" in `docs/workflow.md`. If the issue has no label at all, ask the human which
  type it is rather than guessing from its title.
- `git fetch origin`. If `specs/<NNN>-*/` already exists on `origin/main`, stop: the
  spec is approved. If a `spec/<NNN>-*` branch exists, switch to it and resume from the
  first step that is not done.
- Read `CONTEXT.md`, `docs/product/` and the specs in `specs/` that touch the same concepts.

## 2. Challenge the issue

Launch the `product-owner` agent on the issue. It returns `QUESTIONS` and a `DRAFT`.

## 3. Interview

Put the questions to the human, grouped by theme, a few at a time, each with the
default the agent proposed. Keep every question and its answer: they are written into
the spec at step 4. Rules:

- Ask about behaviour, limits, permissions and what is out of scope. Do not ask about
  implementation.
- Never settle a business rule yourself. A default is used only when the human picks it.
- A word that is not in `CONTEXT.md` is a question: is it a new term, or a synonym of
  an existing one?
- A rule that `CONTEXT.md` mentions is not decided. When the issue needs it, ask the
  human, with the wording of `CONTEXT.md` as the proposed default, and write the answer
  as a functional requirement. A rule the issue does not need stays out of the spec.
- If the answers show that the issue covers several user actions, propose a split
  and stop.

Continue until no open point remains.

## 4. Write the spec

- Pick the slug: two to four words, lowercase kebab-case, from the issue title.
- Create the branch `spec/<NNN>-<slug>` from `origin/main`.
- Write `specs/<NNN>-<slug>/spec.md` from `specs/_TEMPLATE/spec.md`. Remove the
  template comments, the sections that do not apply, and every text in brackets: the
  check refuses one that is left.
- One user story is enough for a simple action. Further stories are slices of the
  same action (refusals, variants), never another feature.
- User stories are ordered by priority, each one testable on its own, each with
  Given / When / Then scenarios, one behaviour per scenario.
- Each functional requirement is one testable rule and cites the user stories it
  comes from: `- **FR-003**: System MUST ... *(US1, US2)*`.
- The answers of the interview go into `## Clarifications`, as `- Q: ... A: ...` under
  `### Session <date>`.
- When `ui_impact` is yes, the "UI" section ends with the line
  `Mock-up: pending design gate.` The design stage replaces it.
- What is out of scope is written in `## Out of Scope`; what was taken for granted, in
  `## Assumptions`.
- When `infra_impact` is yes, `## Infrastructure` says what must change outside the code.
- Each edge case is a statement that names the scenario or requirement covering it.
- A new term goes into `CONTEXT.md` in the same branch.

## 5. Security review

Launch the `security-reviewer` agent in spec-review mode on the file. Merge its
requirements and scenarios into the spec, and its notes into "Security
Considerations". If one of its proposals changes the scope or a business rule, ask
the human before adding it.

## 6. Check

- `python3 scripts/conventions.py specs` must pass.
- Read the spec once as the developer and once as the tester: could each write code,
  or a test, for every requirement without asking a question? Fix what fails, or go
  back to step 3.

## 7. Open the pull request

- Commit `spec(<context>): <description>`, and push the branch.
- If a pull request already exists for the branch (`gh pr list --head <branch>`), update
  it instead of creating one.
- Title `spec(<context>): <description> (#$ARGUMENTS)`, body from
  `.github/pull_request_template.md` with `Refs #$ARGUMENTS`. Sections that do not
  apply contain `N/A`. In the checklist, the two items about tests are ticked: a spec
  pull request changes no test and no code.
- Validate title and body with `python3 scripts/conventions.py pr` before `gh pr create`.
- `python3 scripts/conventions.py paths` must pass.
- Never merge it.

## 8. Hand over

Post one comment on the issue with `gh issue comment`. Its first line is
`## Handover: spec`. Then:

- the link of the pull request;
- the decisions taken during the interview, one line each;
- what the security review added;
- what remains uncertain or was not verified.

Then stop and report the same to the human, who reviews and merges. After the merge,
the next stage is `/design $ARGUMENTS` when `ui_impact` is yes, and
`/develop $ARGUMENTS` in every case: the back end does not wait for the design.
