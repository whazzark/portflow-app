"""Shared fixtures for the convention check tests.

Importing this module puts scripts/ on the import path, so it must be imported first.
"""
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

VALID_SPEC = """---
issue: 12
title: Record a weighing
ui_impact: yes
infra_impact: no
---

# Feature Specification: Record a weighing

**Feature Branch**: `spec/012-record-weighing`

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record a valid weighing (Priority: P1)

An operations lead records the loaded weighing of a truck.

**Acceptance Scenarios**:

1. **Given** an in-progress rotation, **When** the operations lead records a loaded weighing of 38.460 t, **Then** the net tonnage is stored

---

### User Story 2 - Refuse a loaded weighing below the empty weighing (Priority: P2)

**Acceptance Scenarios**:

1. **Given** an in-progress rotation with an empty weighing of 14.200 t, **When** the operations lead records a loaded weighing of 12.000 t, **Then** the weighing is refused

### Edge Cases

- Two operators record the same rotation at the same time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store the net tonnage of a completed rotation. *(US1)*
- **FR-002**: System MUST refuse a loaded weighing below the empty weighing. *(US2)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operations lead records a weighing in under 20 seconds.

## Security Considerations *(mandatory)*

Only an active operations lead of the operating organization can record a weighing.

## UI *(include if ui_impact is yes)*

One screen with a numeric keypad.

## Assumptions

- Automatic import from weighing equipment is out of scope.
"""

VALID_REPORT = """# Test Report: Record a weighing

## Results

| Requirement | Test | Result |
|---|---|---|
| FR-001 | packages/e2e/weighing.spec.ts: [12/FR-001] stores the net tonnage | pass |
| FR-002 | packages/e2e/weighing.spec.ts: [12/FR-002] refuses a loaded weighing below the empty weighing | pass |

## Gaps

None.

## Not tested

Nothing.
"""

VALID_BODY = """## Issue

Refs #12

## Spec

specs/012-record-weighing/spec.md

## Summary

Adds the spec.

## Requirements covered

N/A

## Tests

N/A

## QA report

N/A

## Rust notes

N/A

## Checklist

- [x] Conventions pass locally
"""


def run_git(cwd, *args):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True)


def make_repo(test):
    """Create a temporary git repository with one commit on main; removed after the test."""
    tmp = tempfile.TemporaryDirectory()
    test.addCleanup(tmp.cleanup)
    repo = Path(tmp.name)
    run_git(repo, "init", "-q", "-b", "main")
    run_git(repo, "config", "user.email", "test@example.com")
    run_git(repo, "config", "user.name", "Test")
    (repo / "README.md").write_text("x")
    run_git(repo, "add", ".")
    run_git(repo, "commit", "-q", "-m", "chore: init")
    return repo


def enter(test, directory):
    """Run the rest of the test from the given directory."""
    previous = Path.cwd()
    os.chdir(directory)
    test.addCleanup(os.chdir, previous)
