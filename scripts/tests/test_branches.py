"""Tests for scripts/checks/branches.py."""
import unittest

import support  # noqa: F401
from checks import branches, common


class BranchTests(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(branches.parse_branch("feat/123-back-record-weighing"), ("feat", 123, "back-record-weighing"))
        self.assertEqual(branches.parse_branch("spec/007-login"), ("spec", 7, "login"))
        self.assertEqual(branches.parse_branch("feat/1234-x")[1], 1234)

    def test_invalid(self):
        for name in ("feature/001-x", "feat/record", "feat/000-x", "feat/012-Record", "feat/012_record",
                     "012-record", "feat/12-record", "feat/7-login", "feat/0012-record"):
            with self.assertRaises(common.Failure, msg=name):
                branches.parse_branch(name)

    def test_the_git_guard_uses_the_same_pattern(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location("guard_git", support.ROOT / ".claude" / "hooks" / "guard_git.py")
        guard = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(guard)
        names = ("feat/123-back-record-weighing", "spec/007-login", "feat/1234-x", "docs/001-a", "chore/999-b-c",
                 "feature/001-x", "feat/record", "feat/000-x", "feat/012-Record", "feat/012_record",
                 "012-record", "feat/12-record", "feat/7-login", "feat/0012-record", "main")
        for name in names:
            try:
                branches.parse_branch(name)
                expected = True
            except common.Failure:
                expected = False
            self.assertEqual(bool(guard.BRANCH_RE.match(name)), expected, name)


if __name__ == "__main__":
    unittest.main()
