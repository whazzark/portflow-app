"""Tests for the git hooks in .githooks/ and for the setup check."""
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

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

    def test_fix_sets_the_local_scope_of_a_clone(self):
        repo = make_repo(self)
        enter(self, repo)
        setup.fix_setup()
        setup.check_setup()
        self.assertEqual(config(repo, "--local", "--get", "core.hooksPath"), ".githooks")
        run_git(repo, "config", "core.hooksPath", "elsewhere")
        setup.fix_setup()
        self.assertEqual(config(repo, "--local", "--get", "core.hooksPath"), ".githooks")

    def test_worktree_runs_the_hooks_of_its_own_branch(self):
        repo = make_repo(self)
        run_git(repo, "config", "core.hooksPath", ".githooks")
        run_git(repo, "config", "extensions.worktreeConfig", "true")
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        worktree = Path(tmp.name) / "wt"
        run_git(repo, "worktree", "add", "-q", str(worktree), "-b", "chore/001-x")
        # What the Claude desktop app writes: the hooks of the main checkout, at the worktree scope.
        run_git(worktree, "config", "--worktree", "core.hooksPath", str(repo / ".githooks"))
        enter(self, worktree)

        with self.assertRaises(common.Failure) as raised:
            setup.check_setup()
        self.assertIn("git config --worktree core.hooksPath .githooks", raised.exception.problems[0])

        setup.fix_setup()
        setup.check_setup()
        self.assertEqual(config(worktree, "--worktree", "--get", "core.hooksPath"), ".githooks")
        self.assertEqual(config(repo, "--local", "--get", "core.hooksPath"), ".githooks")
        hooks = git_output(worktree, "rev-parse", "--path-format=absolute", "--git-path", "hooks")
        self.assertEqual(Path(hooks).resolve(), (worktree / ".githooks").resolve())


def config(cwd, *args):
    return git_output(cwd, "config", *args)


def git_output(cwd, *args):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


if __name__ == "__main__":
    unittest.main()
