# 0012. Design system and atomic design

Status: proposed (2026-11-24)

Completes ADR 0004, which chooses shadcn/ui and a feature-sliced structure without
saying how components are layered or where the visual language is decided.
Supersedes nothing.

## Context

ADR 0004 gives the web app four top-level folders (`app`, `routes`, `features`,
`shared`) and shadcn/ui components. Two things were left open.

The first is the design system. The product is used on office desktops and on field
tablets and phones, in sunlight and with gloves. Without one place that decides
colours, spacing, type and sizes, each mock-up and each screen settles them again,
and the mock-ups made in Claude Design drift from what the code can build.

The second is the vocabulary of components. The human wants atomic design (atoms,
molecules, organisms, templates, pages). Applied as five global folders, it would
contradict ADR 0004: an organism carries domain vocabulary, so a global `organisms/`
folder would be shared between features, which may not import each other.

## Decision

- **Atomic design names the layers; the feature slices keep the structure.** Each
  atomic level has one place in the structure of ADR 0004:

  | Level | Where | What |
  |---|---|---|
  | Tokens | `shared/styles/` | Colours, spacing, type, radii, as CSS variables of the Tailwind theme |
  | Atoms | `shared/atoms/` | The shadcn/ui primitives |
  | Molecules | `shared/molecules/` | Generic composites of atoms, with no domain vocabulary |
  | Templates | `shared/templates/` | Page layouts with slots, with no domain vocabulary and no data |
  | Organisms | `features/<context>/components/` | Sections that carry domain vocabulary |
  | Pages | `features/<context>/<context>-page.tsx`, `routes/` | Screens connected to data |

  `shared/atoms/` and `shared/molecules/` replace the `shared/ui/` and
  `shared/components/` folders that the front-end rules named until now.

- **Dependencies go one way.** Atoms import tokens only. Molecules import atoms.
  Templates import molecules and atoms. Organisms and pages import all three. An
  organism is never shared between features: when a third screen needs it and its
  domain vocabulary can be removed, it becomes a molecule.

- **Styling is Tailwind CSS, and the tokens are the only source of visual values.**
  Components use the utilities bound to the tokens. A colour, a spacing or a font
  size written as a raw value in a component is a defect. The themes (light, dark,
  high contrast for sunlight) and the densities (office, field) are sets of token
  values, not variants written component by component.

- **The atoms start from shadcn/ui and belong to the design system.** They are
  generated with the shadcn CLI, then changed only by an issue about the design
  system: a new variant, a field size, an accessibility fix. A feature never edits
  an atom to fit one screen.

- **The design system used in Claude Design mirrors the code.** It is built from the
  tokens and the atoms of the repository, so that a mock-up is drawn with the
  components the developer will use. When the two differ, the repository is right
  and the design system in Claude Design is updated.

- **The foundation comes before the first screen.** The tokens, the themes, the base
  atoms and the first templates are one issue, done after the walking skeleton and
  before the first feature with `ui_impact: yes`.

## Consequences

- No change to the rules between `routes`, `features` and `shared`: the lint
  boundaries of ADR 0004 gain the order tokens, atoms, molecules, templates inside
  `shared`.
- The shadcn CLI must be configured to write into `shared/atoms/` (the aliases of
  `components.json`).
- Updating an atom from upstream shadcn/ui becomes a merge by hand once the atom has
  local variants. The variants are kept few for that reason.
- A cross-cutting improvement (a loading skeleton, a field size, the high-contrast
  theme) is made once, in the design system, and every screen gets it. A new
  behaviour of a screen still needs a spec.
- How Claude Design imports tokens and components from a repository is not verified.
  If it cannot, the design system is kept in sync by hand, and the brief of `/design`
  lists the components to use.
- The mock-ups approved before the foundation exists may need a second design pull
  request to align with it.
