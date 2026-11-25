"""Tests for scripts/checks/adrs.py."""
import tempfile
import unittest
from pathlib import Path

import support  # noqa: F401
from checks import adrs, common

VALID_ADR = """# 0016. A decision

Status: accepted (2026-11-25)

## Context

Why.

## Decision

What.
"""


class AdrTests(unittest.TestCase):
    def make(self, files):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        adr_dir = root / "docs" / "adr"
        adr_dir.mkdir(parents=True)
        for name, text in files.items():
            (adr_dir / name).write_text(text, encoding="utf-8")
        return root

    def problems(self, text):
        with self.assertRaises(common.Failure) as ctx:
            adrs.check_adrs(self.make({"0016-a-decision.md": text}))
        return ctx.exception.problems

    def test_accepted(self):
        adrs.check_adrs(self.make({"0016-a-decision.md": VALID_ADR}))

    def test_accepted_with_a_note_under_the_status(self):
        adrs.check_adrs(self.make({"0016-a-decision.md": VALID_ADR.replace(
            "Status: accepted (2026-11-25)\n",
            "Status: accepted (2026-11-25)\n\nCompleted by ADR 0017.\n",
        )}))

    def test_proposed_is_refused(self):
        problems = self.problems(VALID_ADR.replace("accepted", "proposed"))
        self.assertEqual(len(problems), 1)
        self.assertIn("0016-a-decision.md", problems[0])
        self.assertIn("docs/adr/README.md", problems[0])

    def test_missing_status_is_refused(self):
        self.problems(VALID_ADR.replace("Status: accepted (2026-11-25)\n", ""))

    def test_status_after_the_first_section_is_refused(self):
        self.problems(VALID_ADR.replace("Status: accepted (2026-11-25)\n", "").replace(
            "Why.", "Why.\n\nStatus: accepted (2026-11-25)"))

    def test_malformed_date_is_refused(self):
        self.problems(VALID_ADR.replace("2026-11-25", "25/11/2026"))
        self.problems(VALID_ADR.replace(" (2026-11-25)", ""))

    def test_every_adr_is_reported(self):
        with self.assertRaises(common.Failure) as ctx:
            adrs.check_adrs(self.make({
                "0016-a.md": VALID_ADR.replace("accepted", "proposed"),
                "0017-b.md": VALID_ADR.replace("accepted", "superseded"),
            }))
        self.assertEqual(len(ctx.exception.problems), 2)

    def test_readme_is_ignored(self):
        adrs.check_adrs(self.make({"README.md": "# Architecture decision records\n"}))

    def test_no_adr_folder(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        adrs.check_adrs(tmp.name)

    def test_the_adrs_of_the_repository(self):
        adrs.check_adrs(support.ROOT)


if __name__ == "__main__":
    unittest.main()
