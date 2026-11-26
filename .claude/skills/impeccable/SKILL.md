---
name: impeccable
description: Judge whether a Portflow mock-up or a component of the design system is well designed, not only whether it follows the design system, with three commands of Impeccable: critique, audit and polish. Used by the designer agent only.
argument-hint: "critique|audit|polish <target>"
---

# /impeccable critique | audit | polish

> A partial copy of `pbakaus/impeccable`, skill 4.11.1, commit
> `2fc5e1459efbbf06d92c7306517c286bf12490cf`, under the Apache License 2.0 (`LICENSE`).
> The files under `reference/` are copied verbatim; this file is written for Portflow and
> replaces the `SKILL.md` of Impeccable. Not copied: the other 21 commands, the launcher
> `scripts/impeccable` and the engine binary it downloads, the hooks and the agents.

This skill proposes, it never decides. The `designer` agent runs it
(`.claude/agents/designer.md` says when), and lists what it finds for the human, who
settles every value, label and pattern, as for any proposal of the designer.

## Commands

| Command | Target | Reference |
|---|---|---|
| `critique` | A mock-up: the export in `specs/<NNN>-<slug>/design/mockup/` and its brief | [reference/critique.md](reference/critique.md), scored with [reference/critique-rubric.md](reference/critique-rubric.md) |
| `audit` | A component or template of `packages/design-system` | [reference/audit.md](reference/audit.md) |
| `polish` | A component or template of `packages/design-system`, on its style branch | [reference/polish.md](reference/polish.md) |

Read the reference of the command, then [reference/craft-floor.md](reference/craft-floor.md):
its "Refuse" list is the list of anti-patterns to look for, by reading the source and the
export, since the detector of Impeccable is not installed. Any other command is not
available: do not improvise it from what the references mention.

## What changes in Portflow

These rules override the references wherever they disagree.

1. **No launcher.** Every step that runs `"<skill-base-dir>/scripts/impeccable"` (`context`,
   `detect`, `shot`, `live-server`, `critique-storage`, `audit-storage`, `font-fetch`)
   is skipped. Say in the report, once: "Deterministic scan unavailable: the detector of
   Impeccable is not installed in Portflow." Never download or run anything to replace it.
2. **One context.** Run Assessment A and the anti-pattern review in this context, without
   sub-agents. The first line of a critique is
   `Method: design review only (Portflow copy, no detector)`, not the degraded banner.
3. **The design system is the reference, not DESIGN.md.** Read
   `.claude/rules/design-system.md`, the brand book of the Portflow design system and its
   components in `packages/design-system` (ADR 0012, ADR 0019), `CONTEXT.md` for the
   terms, and the spec and brief of the feature for its users and context of use. Never
   write a `DESIGN.md`, a `PRODUCT.md` or a `.impeccable/` folder; never suggest
   `document`, `init` or `extract`.
4. **Nothing is saved.** Skip "Persist the Snapshot" and "Save the Report", and the
   snapshot steps of `polish`. The findings go in the report of the agent.
5. **No questions.** The agent cannot ask the human: end a critique with
   `Questions skipped: delegated run`, and turn the questions it would ask into open
   points of the report.
6. **Propose, never decide.** A fix that changes a colour, a typeface, a density, the
   look of a theme or a label is a proposal for the human, not an edit. The craft floor
   is a checklist of findings: where it disagrees with the design system or an ADR,
   report the disagreement and follow the design system.
7. **Suggested commands.** Name only `critique`, `audit` or `polish`, or the skills
   `ux-copy` and `accessibility-review`; for anything else, describe the fix in words.
8. **`polish` edits only on a style branch**, inside the scope of the `designer` (job 1),
   and each fix follows the order of work of the agent: its test first. On a mock-up,
   `polish` is not used.
9. **Web only.** Portflow is a web app: `audit.native.md` and the native and desktop-app
   paths of the references do not apply.
