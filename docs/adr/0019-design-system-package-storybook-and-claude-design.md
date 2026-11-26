# 0019. The design system as a package, shown in Storybook and synced with Claude Design

Status: accepted (2026-11-25)

Changes ADR 0012, which puts the tokens, atoms, molecules and templates in
`apps/web/src/shared/`; ADR 0013, which keeps in `packages/` only what is not
deployed; and ADR 0008 and 0010, in which the human draws every mock-up and no agent
works at the design stage. The rest of those ADRs stands.

## Context

Issue #14 lays the foundation of the design system: tokens, themes, densities, the
shadcn/ui atoms, the molecules of the states every read handles, the page templates,
and a page that shows them all. ADR 0012 puts them inside the web app and asks that
the design system used in Claude Design mirror the code, without saying how; it notes
that the import from a repository was not verified.

Three needs came up while planning #14:

- The design system should be one thing that can be built, shown and published on
  its own, not a folder of the web app that only the web app can show.
- The mock-ups made in Claude Design should be drawn with the same components as the
  code, so that a mock-up never asks for something the code cannot build.
- The design stage has no agent: the human writes nothing but has to draw every
  mock-up by hand, from a brief.

Claude Design now lives in Claude as the Design System artifact type: a design system
there holds tokens, components with a live preview and a bundle, and a mock-up made as
a Design artifact is drawn from such a system.

## Decision

- **The design system is the workspace `packages/design-system`**, named
  `@portflow/design-system`. It holds the levels of ADR 0012 that carry no domain
  vocabulary:

  | Level | Where |
  |---|---|
  | Tokens | `packages/design-system/src/styles/` |
  | Atoms | `packages/design-system/src/atoms/` |
  | Molecules | `packages/design-system/src/molecules/` |
  | Templates | `packages/design-system/src/templates/` |

  Organisms and pages stay in the features of the web app, as ADR 0012 says. The web
  app imports the package as TypeScript source, file by file, through the `exports`
  of its `package.json`: there is no barrel and no build step between them. The order
  of the levels (atoms import tokens only, molecules import atoms, templates import
  molecules and atoms) is checked by Oxlint inside the package; the package imports
  nothing from `apps/`.

- **Storybook is the showcase.** Every atom, molecule and template has its stories,
  shown in each theme and density, which a toolbar switches without reloading. It
  replaces the development route that #14 first asked for. Its static build is made
  in CI and kept as an artifact of the run.

- **`packages/` may hold a workspace whose static build is published.** The Storybook
  of the design system is the first. Where and how it is hosted is not decided here:
  it is an infrastructure change, proposed by its own issue, and no agent deploys it.

- **The design system in Claude Design is generated from the package.** A script of
  the package builds what the Design System artifact type reads: the tokens, a bundle
  of the components, and one preview and one guideline per component. The system is
  marked as synced from code, so it is read-only in Claude Design: a change goes
  through the package. It follows `main`: the design stage syncs it before drawing
  when the package has changed since. When the two differ, the repository is right
  (ADR 0012).

- **A `designer` agent owns the design system and works at the design stage.**
  - It changes the package, for an issue about the design system, with the
    end-to-end test of its Storybook: the design system has no spec for the QA agent
    to test from. The fullstack developer uses the package and never edits it; it
    reports a missing token or variant.
  - At the design stage (`/design`), it writes the brief from the approved spec and
    draws the mock-up in Claude Design from the Portflow design system, with its
    components only, then exports it into the spec folder. The human reviews the
    mock-up, asks for changes or makes them, and merges: gate 2 does not change.
  - It proposes a palette, a typeface or the look of a theme; the human decides.

## Consequences

- `apps/web/src/shared/` keeps `api/`, `lib/` and the entry stylesheet, which imports
  the tokens of the package. The import boundaries of the web app no longer name
  `shared/atoms`, `shared/molecules` or `shared/templates`.
- A new atom is generated with the shadcn CLI configured in the package
  (`packages/design-system/components.json`), not in the web app.
- The design-system commits are typed `style` (`docs/conventions.md`).
- The Claude Design system is only as fresh as its last sync: between a merge that
  changes the package and the next design stage, it shows the previous version.
- A mock-up drawn by an agent can still be wrong. The human gate is the same, and the
  brief keeps the table of acceptance scenarios and states that the mock-up must cover.
- The Storybook build adds time to the `web` job of CI.
