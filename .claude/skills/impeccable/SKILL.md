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
> `scripts/impeccable` and the engine binary it downloads, the hooks and the agents. The
> engine is built from its source at the same commit by `engine/install.sh`, and only its
> `detect` verb is run, through `engine/detect.sh` (see "The detector").

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
export, beside what the detector finds. Any other command is not available: do not
improvise it from what the references mention.

## The detector

The detector of Impeccable is the `detect` verb of its engine, a Rust binary. Portflow
builds it from source, at the commit pinned in `engine/pin.env`, into `engine/bin/`
(ignored by git). The human installs it, once per clone or worktree:

```bash
.claude/skills/impeccable/engine/install.sh
```

Run it only through `engine/detect.sh`, which takes local files and folders only, always
adds `--json`, gives the engine an empty home (no sign-in, so nothing is uploaded), sets
the opt-outs of its background reports and, on macOS, kills it on any network operation.

| Command | Run | When |
|---|---|---|
| `audit` | `.claude/skills/impeccable/engine/detect.sh <the source files of the component or template>` | After the manual review is recorded |
| `critique` | `.claude/skills/impeccable/engine/detect.sh specs/<NNN>-<slug>/design/mockup/` | After Assessment A is recorded |
| `polish` | No new run: reuse the findings of the `audit` of the same component | |

- **Exit codes.** 0: no finding; 2: findings, the JSON array on stdout; 3: the engine is
  missing or is not the pinned version; any other code: the scan failed. On 3 or a
  failure, say once in the report "Deterministic scan unavailable: <the error, word for
  word>", give the install command above for the human, and go on with the manual review.
  Never run `install.sh`, never download, build or run another engine to replace it.
- **An empty result is not a clean bill.** On `.tsx` and `.css` files the engine runs its
  regex rules only: the rules that need a parsed page (contrast, tiny text and other
  element rules) run on the HTML of the mock-up export, not on the source. Report what was
  scanned and say which rules could not run.
- **Findings are proposals.** Report them in a section of their own, next to the manual
  review, never merged into it: for each, the rule (`antipattern`), the file and line, the
  snippet, and your verdict after reading the code in context: confirmed, false positive
  (say why), or in conflict with the design system or an ADR (follow them, report the
  conflict). A fix that touches a value, a colour, a typeface, a density or a label goes
  to the human, as for any finding.
- **Nothing is uploaded.** If the output ever carries `savedTo`, or a line
  `Saved to Impeccable`, stop and report it to the human: it means a report left the
  machine.

## What changes in Portflow

These rules override the references wherever they disagree.

1. **No launcher.** A step that runs `"<skill-base-dir>/scripts/impeccable" detect` on
   local files runs `engine/detect.sh` instead (see "The detector"). Every other step
   that runs the launcher (`context`, `shot`, `live-server`, `critique-storage`,
   `audit-storage`, `font-fetch`, and `detect` on a URL or with `--cdp`) is skipped.
2. **One context.** Run Assessment A and the anti-pattern review in this context, without
   sub-agents, and record them before you read the output of the detector. The first
   line of a critique is `Method: design review and detector (Portflow copy, one context)`,
   or `Method: design review only (Portflow copy, detector unavailable)` when the scan did
   not run; not the degraded banner.
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
