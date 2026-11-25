# Specs

One folder per issue: `specs/<NNN>-<slug>/spec.md`, plus `design/` when the feature
has a user interface, then `plan.md` and `test-report.md` added by the code pull
request. `<NNN>` is the issue number padded to three digits.

- A spec is written by `/spec <issue>` (`docs/workflow.md`) and approved when its pull
  request is merged.
- A spec describes behaviour at the time of delivery. When a later feature changes
  that behaviour, its spec pull request updates the affected specs in the same change,
  so the change is approved at the spec gate.
- The current state of the product is the code, the tests and `packages/contracts/openapi.json`.
- The templates are in `specs/_TEMPLATE/`; they change only on a `chore/` branch.
  Structure rules are in
  `docs/conventions.md` and checked by `python3 scripts/conventions.py specs`.
