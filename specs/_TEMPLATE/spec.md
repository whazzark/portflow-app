---
issue: 0
title: "[title of the issue]"
ui_impact: no
infra_impact: no
---

<!--
  Portflow spec template. Format rules: docs/conventions.md.
  Checked by `python3 scripts/conventions.py specs`.

  - issue: the GitHub issue number, without leading zeros. The folder is specs/<NNN>-<slug>/.
  - ui_impact: yes when the feature changes a screen. The mock-up is then added by the
    design pull request in specs/<NNN>-<slug>/design/.
  - infra_impact: yes when CI, deployment or infrastructure files must change.

  Use the vocabulary of CONTEXT.md. Describe behaviour, never implementation.
  Remove these comments and replace every [text in brackets]: the check refuses a
  bracket that is left.
-->

# Feature Specification: [title of the issue]

## User Scenarios & Testing *(mandatory)*

<!--
  One issue is one user action. The user stories of a spec are slices of that action,
  most valuable first: the nominal path is User Story 1, then the refusals and the
  variants. Each slice can be built, tested and shown on its own.
  One story is enough for a simple action. Do not invent stories to fill the page.
-->

### User Story 1 - [what the user does, e.g. "Record a valid weighing"] (Priority: P1)

[Who does what, in which situation, and what they get, in two or three sentences.]

**Why this priority**: [the value of this slice]

**Independent Test**: [how to check this slice alone, e.g. "record a loaded weighing on an in-progress rotation and read the net tonnage"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [one action], **Then** [one observable outcome]
2. **Given** [initial state], **When** [one action], **Then** [one observable outcome]

<!--
  Copy the block above for each further slice: "### User Story 2 - ... (Priority: P2)".
  Numbers go from 1 without gaps.
-->

### Edge Cases

<!--
  Statements, not questions: each one says what happens, and is covered by a scenario
  or a requirement. A case nobody can decide yet is a question for the human, not a line here.
-->

- [boundary or error case]: [what the system does], covered by [FR-00k or User Story k, scenario n]

## Requirements *(mandatory)*

<!--
  One testable rule per requirement, numbered FR-001, FR-002... Each one cites the
  user stories it comes from, as *(US1)* or *(US1, US2)*.
-->

### Functional Requirements

- **FR-001**: System MUST [one rule, e.g. "store the net tonnage of a completed rotation"] *(US1)*
- **FR-002**: System MUST [one rule, e.g. "refuse a loaded weighing below the empty weighing"] *(US1)*

### Key Entities *(include if the feature involves data)*

- **[term of CONTEXT.md]**: [what it represents here, and its relations, without implementation]

## Success Criteria *(mandatory)*

<!-- Measurable, seen from the user, with no word about technology. -->

### Measurable Outcomes

- **SC-001**: [measurable outcome, e.g. "An operations lead records a weighing in under 20 seconds"]

## Clarifications

<!-- Answers given by the human during the /spec interview. Remove the section when there are none. -->

### Session [date]

- Q: [question] A: [answer]

## Security Considerations *(mandatory)*

<!--
  Who is allowed to do this, which data is sensitive, how it could be abused, what is
  written to the activity log. Write "None" with a one-line reason when there is nothing to add.
-->

- [who may perform the action, and within which organization]
- [sensitive data involved, and how the feature could be abused]

## UI *(include if ui_impact is yes)*

<!--
  Screens and states, at a functional level. Keep the last line as it is: /design
  replaces it with links to the mock-up. Remove the section when ui_impact is no.
-->

- [screen or state, and what the user sees]

Mock-up: pending design gate.

## Infrastructure *(include if infra_impact is yes)*

<!--
  What must change outside the application code: environment variable, service,
  deployment step, data migration strategy. Never a secret value.
  Remove the section when infra_impact is no.
-->

- [what must change, and why the feature needs it]

## Out of Scope

<!-- What this issue does not do, so that nobody builds or tests it. -->

- [what is left out, and the issue that will cover it when there is one]

## Assumptions

<!-- What was taken for granted because the issue did not say. Each one is a risk the human accepts by merging. -->

- [assumption]
