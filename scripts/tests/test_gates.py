"""Tests for scripts/checks/gates.py."""
import unittest

from support import VALID_SPEC, enter, make_repo, run_git
from checks import common, gates


class GateTests(unittest.TestCase):
    def setUp(self):
        self.repo = make_repo(self)
        enter(self, self.repo)

    def commit_spec(self, text):
        spec_dir = self.repo / "specs" / "012-record-weighing"
        spec_dir.mkdir(parents=True, exist_ok=True)
        (spec_dir / "spec.md").write_text(text, encoding="utf-8")
        run_git(self.repo, "add", ".")
        run_git(self.repo, "commit", "-q", "-m", "spec: record a weighing")

    def test_spec_gate(self):
        with self.assertRaises(common.Failure):
            gates.check_spec_approved(12, "main")
        self.commit_spec(VALID_SPEC)
        self.assertEqual(gates.check_spec_approved(12, "main"), "specs/012-record-weighing/spec.md")
        with self.assertRaises(common.Failure):
            gates.check_spec_approved(1, "main")

    def test_design_gate(self):
        self.commit_spec(VALID_SPEC)
        with self.assertRaises(common.Failure):
            gates.check_design_approved(12, "main")
        design = self.repo / "specs" / "012-record-weighing" / "design"
        design.mkdir()
        (design / "weighing.html").write_text("<html></html>")
        run_git(self.repo, "add", ".")
        run_git(self.repo, "commit", "-q", "-m", "design: weighing screen")
        self.assertIn("design/", gates.check_design_approved(12, "main"))

    def test_design_gate_needs_more_than_the_brief(self):
        self.commit_spec(VALID_SPEC)
        design = self.repo / "specs" / "012-record-weighing" / "design"
        design.mkdir()
        (design / "brief.md").write_text("brief")
        run_git(self.repo, "add", ".")
        run_git(self.repo, "commit", "-q", "-m", "design: brief")
        with self.assertRaises(common.Failure):
            gates.check_design_approved(12, "main")

    def test_design_gate_not_required(self):
        self.commit_spec(VALID_SPEC.replace("ui_impact: yes", "ui_impact: no"))
        self.assertIn("not required", gates.check_design_approved(12, "main"))


if __name__ == "__main__":
    unittest.main()
