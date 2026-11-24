"""Tests for the git hooks in .githooks/ and for the setup check."""
import shutil
import subprocess
import unittest

from support import ROOT, enter, make_repo, run_git
from checks import common, setup

ZERO = "0" * 40
SHA = "1" * 40


class PrePushTests(unittest.TestCase):
    def setUp(self):
        self.repo = make_repo(self)
        shutil.copytree(ROOT / "scripts", self.repo / "scripts", ignore=shutil.ignore_patterns("__pycache__", "tests"))

    def push(self, *lines):
        proc = subprocess.run([str(ROOT / ".githooks" / "pre-push"), "origin", "url"], cwd=self.repo,
                              input="".join(line + "\n" for line in lines), capture_output=True, text=True)
        return proc.returncode

    def test_refused(self):
        self.assertEqual(self.push(f"refs/heads/main {SHA} refs/heads/main {SHA}"), 1)
        self.assertEqual(self.push(f"refs/heads/feat/012-x {SHA} refs/heads/main {SHA}"), 1)
        self.assertEqual(self.push(f"refs/heads/feat/012-x {SHA} refs/heads/main {ZERO}"), 1)
        self.assertEqual(self.push(f"refs/heads/wip {SHA} refs/heads/wip {ZERO}"), 1)
        self.assertEqual(self.push(f"refs/heads/feat/012-x {SHA} refs/heads/feat/012-x {ZERO}",
                                   f"refs/heads/main {SHA} refs/heads/main {SHA}"), 1)

    def test_allowed(self):
        self.assertEqual(self.push(f"refs/heads/feat/012-x {SHA} refs/heads/feat/012-x {ZERO}"), 0)
        self.assertEqual(self.push(f"refs/heads/main {SHA} refs/heads/main {ZERO}"), 0, "first push of main")
        self.assertEqual(self.push(f"(delete) {ZERO} refs/heads/wip {SHA}"), 0, "deleting a badly named branch")
        self.assertEqual(self.push(f"refs/tags/v1 {SHA} refs/tags/v1 {ZERO}"), 0)
        self.assertEqual(self.push(), 0)


class SetupTests(unittest.TestCase):
    def test_hooks_path(self):
        repo = make_repo(self)
        enter(self, repo)
        with self.assertRaises(common.Failure):
            setup.check_setup()
        run_git(repo, "config", "core.hooksPath", "elsewhere")
        with self.assertRaises(common.Failure):
            setup.check_setup()
        run_git(repo, "config", "core.hooksPath", ".githooks")
        setup.check_setup()


if __name__ == "__main__":
    unittest.main()
