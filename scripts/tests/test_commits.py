"""Tests for scripts/checks/commits.py."""
import tempfile
import unittest
from pathlib import Path

from support import enter, make_repo, run_git
from checks import commits, common


class CommitTests(unittest.TestCase):
    def test_valid_headers(self):
        for header in ("feat(api): add weighing endpoint", "fix: refuse weight below tare", "spec(discharges): record a weighing"):
            self.assertEqual(commits.header_problems(header), [], header)

    def test_style_is_the_type_of_the_design_system(self):
        self.assertEqual(commits.header_problems("style(design-system): add the button atom"), [])

    def test_invalid_headers(self):
        for header in ("add stuff", "feat: Add thing", "feat: add thing.", "feature: add", "feat(API): add", "feat: " + "x" * 80):
            self.assertTrue(commits.header_problems(header), header)

    def test_commit_msg_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            good = Path(tmp) / "good"
            good.write_text("feat: add weighing\n\nBody.\n# comment\n")
            commits.check_commit_msg(good)
            bad = Path(tmp) / "bad"
            bad.write_text("feat: add weighing\nno blank line\n")
            with self.assertRaises(common.Failure):
                commits.check_commit_msg(bad)
            merge = Path(tmp) / "merge"
            merge.write_text("Merge branch 'main' into feat/001-x\n")
            commits.check_commit_msg(merge)

    def test_only_real_merges_and_reverts_are_exempt(self):
        for header in ("Merge branch 'main' into feat/001-x", "Merge remote-tracking branch 'origin/main' into feat/001-x",
                       "Merge pull request #3 from o/feat/001-x", 'Revert "feat: add weighing"'):
            self.assertTrue(commits.is_exempt_header(header), header)
        for header in ("Merge my hack", "Merged stuff", "Revert things"):
            self.assertFalse(commits.is_exempt_header(header), header)


class CommitRangeTests(unittest.TestCase):
    def setUp(self):
        self.repo = make_repo(self)
        enter(self, self.repo)

    def test_commits_range(self):
        (self.repo / "a").write_text("a")
        run_git(self.repo, "add", ".")
        run_git(self.repo, "commit", "-q", "-m", "bad message")
        with self.assertRaises(common.Failure):
            commits.check_commits("HEAD~1..HEAD")


if __name__ == "__main__":
    unittest.main()
