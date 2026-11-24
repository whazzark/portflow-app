---
paths:
  - "e2e/**"
  - "apps/**"
---

# Testing rules

- **Tests come from the spec.** Each functional requirement becomes a test at the lowest
  level able to verify it. Most land in domain and use-case tests.
- **Red first.** Commit the failing tests before the implementation. The history must
  show the test commit before the code commit.
- **Never weaken a test to get green.** Deleting an assertion, loosening a matcher or
  skipping a test requires a justification in the PR's "Tests" section.
- **Traceability.** `N/FR-kkk` appears in the test name or in a comment directly above
  it. `python3 scripts/conventions.py fr-coverage --issue N` must pass on the code
  pull request.
- **Unit and integration tests** (under `apps/`) are written by the developer.
- **End-to-end and regression tests** (Playwright, `e2e/`) are written by the QA agent
  from the spec and the approved mock-up, without reading the implementation. They
  assert what the user sees, through roles and accessible names. A regression test
  reproduces a bug or a gap and stays in the suite.
- The developer never changes a file under `e2e/`; the QA agent never changes a test
  under `apps/`.
- **Every requirement has a test at some level.** One that cannot be tested end to end
  (hardware, third party) is covered by a unit or integration test and marked
  `not testable: <reason>` in the test report.
- **No test for trivial glue**: layer-to-layer conversions, wiring, generated code.
- **Deterministic.** Unit tests use no real clock, no network and no database.
  Integration and end-to-end tests do, so each one creates the data it needs and
  depends on no other test and on no order.
