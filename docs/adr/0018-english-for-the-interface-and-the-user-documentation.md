# 0018. English for the interface and the user documentation

Status: accepted (2026-11-25)

Completes ADR 0011, 0014 and 0015, which write the labels shown to the user and the
user documentation in French: both are in English.

## Context

The repository, the code, the specs and GitHub are in English. Until now two things
were in French: the labels the user sees, fixed by the approved mock-ups (ADR 0011,
0015), and the user documentation in `packages/user-docs/` (ADR 0014). The walking
skeleton of the front end (#11) showed what this costs: the vocabulary of `CONTEXT.md`
is English, so every label needed a translation that no list held, and the user
documentation would have named in French the screens the code names in English. No
product label and no page of user documentation existed yet, so nothing had to be
translated.

## Decision

- The labels the user sees are in English. The approved mock-ups still fix them; the
  web app keeps them in `constants.ts` files, and the labels of the problem codes in one
  record keyed by the code (ADR 0015).
- The user documentation, in `packages/user-docs/`, is in English. It names each
  screen, field and action with its label in the approved mock-up.
- The only French left is the conversation with the human (`CLAUDE.md`, rule 7).

## Consequences

- `CLAUDE.md`, `.claude/rules/frontend.md`, the `/design` skill and the
  `technical-writer` agent say English.
- The labels and the user documentation use the words of `CONTEXT.md` directly; a
  label is a choice of wording, not a translation.
- Serving the product in French, or in several languages, would be a new decision:
  the labels would then move from the `constants.ts` files to translation files.
