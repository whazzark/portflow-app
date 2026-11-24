"""Tests for scripts/checks/coverage.py."""
import tempfile
import unittest
from pathlib import Path

from support import VALID_SPEC
from checks import common, coverage


class CoverageTests(unittest.TestCase):
    def test_coverage(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            spec_dir = root / "specs" / "012-record-weighing"
            spec_dir.mkdir(parents=True)
            (spec_dir / "spec.md").write_text(VALID_SPEC, encoding="utf-8")
            tests = root / "apps" / "api" / "tests"
            tests.mkdir(parents=True)
            (tests / "weighing.rs").write_text("// covers 12/FR-001\n#[test]\nfn valid() {}\n")
            with self.assertRaises(common.Failure) as ctx:
                coverage.check_fr_coverage(root, 12, ["apps", "e2e"])
            self.assertEqual(len(ctx.exception.problems), 1)
            self.assertIn("12/FR-002", ctx.exception.problems[0])
            e2e = root / "e2e"
            e2e.mkdir()
            (e2e / "weighing.spec.ts").write_text("test('[012/FR-002] refuses a loaded weighing below the empty weighing', () => {})\n")
            self.assertEqual(coverage.check_fr_coverage(root, 12, ["apps", "e2e"]), ["001", "002"])

    def test_only_test_files_count(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            spec_dir = root / "specs" / "012-record-weighing"
            spec_dir.mkdir(parents=True)
            (spec_dir / "spec.md").write_text(VALID_SPEC, encoding="utf-8")
            src = root / "apps" / "api" / "crates" / "domain" / "src"
            src.mkdir(parents=True)
            (src / "lib.rs").write_text("// see 12/FR-001 and 12/FR-002\npub fn net() {}\n")
            web = root / "apps" / "web" / "src" / "features" / "weighing"
            web.mkdir(parents=True)
            (web / "page.tsx").write_text("// 12/FR-001 12/FR-002\n")
            with self.assertRaises(common.Failure) as ctx:
                coverage.check_fr_coverage(root, 12, ["apps", "e2e"])
            self.assertEqual(len(ctx.exception.problems), 2)
            # A Rust unit test module in a source file, and a front-end test file, do count.
            (src / "weighing.rs").write_text("#[cfg(test)]\nmod tests {\n    // covers 12/FR-001\n    #[test]\n    fn net() {}\n}\n")
            (web / "page.test.tsx").write_text("test('[12/FR-002] refuses', () => {})\n")
            self.assertEqual(coverage.check_fr_coverage(root, 12, ["apps", "e2e"]), ["001", "002"])

    def test_no_false_match_on_other_issue_or_number(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            spec_dir = root / "specs" / "012-record-weighing"
            spec_dir.mkdir(parents=True)
            (spec_dir / "spec.md").write_text(VALID_SPEC, encoding="utf-8")
            e2e = root / "e2e"
            e2e.mkdir()
            (e2e / "x.spec.ts").write_text("// 112/FR-001 and 12/FR-0011 and 12/FR-0021 and x/12/FR-001\n")
            with self.assertRaises(common.Failure) as ctx:
                coverage.check_fr_coverage(root, 12, ["e2e"])
            self.assertEqual(len(ctx.exception.problems), 2)


if __name__ == "__main__":
    unittest.main()
