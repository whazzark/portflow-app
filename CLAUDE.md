# Portflow

Bulk discharge management for the operating organization of a port site. Monorepo: a
Rust API (`apps/api`), a React SPA (`apps/web`), Playwright tests (`packages/e2e`).

This file loads in every session: it holds only what every session needs. Each other
rule lives where the agent that needs it reads it: `.claude/rules/` loads by itself
when you touch matching files (code, tests, commands), the agents and skills carry
their own steps, and the documents below are read when the task calls for them.

## Read what your task touches

| Before | Read |
|---|---|
| Writing or reading a spec, naming anything | `CONTEXT.md`, the group of your bounded context. Use its terms exactly. The rules its entries mention are notes: only an approved spec decides behaviour |
| Running or continuing a stage (`/spec`, `/design`, `/develop`, `/test`, `/doc`, `/review`) | `docs/workflow.md`, and the handover comments of the issue |
| A branch, a commit, a pull request, a spec, a convention check | `docs/conventions.md` |
| Touching `apps/`, `packages/` or a structural choice | `docs/architecture.md` and the ADRs it names. Do not contradict an ADR; propose a new one |

## Rules that always apply

1. **Human gates.** A human merges every pull request. Never merge, approve, push to
   `main`, or bypass a hook. If a gate or a guard blocks you, stop and report: do not
   look for another way to run the command.
2. **No code without an approved spec.** On a `feat/` branch, nothing under `apps/` or
   `packages/e2e/` changes before `spec-approved` passes, and `design-approved` too for
   front-end work when the spec has `ui_impact: yes`.
3. **One source of truth.** Behaviour lives in the spec, decisions in ADRs, names in
   `CONTEXT.md`, user-facing labels in the approved mock-ups, the API in
   `packages/contracts/openapi.json`. Do not duplicate them, and never settle a business
   rule yourself: ask the human.
4. **Stay in scope.** Change only what the issue asks. Report anything else you notice
   instead of fixing it.
5. **Say what you did not verify.** Never claim a check passed if you did not run it.
6. **The frame is not yours to change.** The files of the frame, listed in
   `docs/conventions.md`, change only on a `chore/` branch, on request. Never edit them
   to get past a check.
7. **Languages.** Everything written to the repository and to GitHub is in English.
   Two exceptions are in French: the labels the user sees, and `packages/user-docs/`.
   Talk to the human in French.
8. **Small commits.** Commit each change on its own, as you go; never squash or rewrite
   a branch: the pull request is merged by squash.
