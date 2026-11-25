"""Tests for the command line, scripts/conventions.py."""
import contextlib
import io
import unittest

import support  # noqa: F401
import conventions


class CommandLineTests(unittest.TestCase):
    def test_exit_codes(self):
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(conventions.main(["branch", "spec/012-record-weighing"]), 0)
            self.assertEqual(conventions.main(["branch", "main"]), 0)
            self.assertEqual(conventions.main(["branch", "spec/12-record-weighing"]), 1)

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = conventions.main(list(argv))
        return code, out.getvalue() + err.getvalue()

    def test_every_command_is_wired(self):
        repo = support.make_repo(self)
        support.enter(self, repo)
        spec_dir = repo / "specs" / "012-record-weighing"
        (spec_dir / "design").mkdir(parents=True)
        (spec_dir / "spec.md").write_text(support.VALID_SPEC, encoding="utf-8")
        (spec_dir / "design" / "weighing.html").write_text("<html></html>")
        (spec_dir / "test-report.md").write_text(support.VALID_REPORT, encoding="utf-8")
        e2e = repo / "packages" / "e2e"
        e2e.mkdir(parents=True)
        (e2e / "weighing.spec.ts").write_text("test('[12/FR-001] a', () => {})\ntest('[12/FR-002] b', () => {})\n")
        (repo / "body.md").write_text(support.VALID_BODY, encoding="utf-8")
        (repo / "msg").write_text("spec(discharges): record a weighing\n")
        support.run_git(repo, "config", "core.hooksPath", ".githooks")
        support.run_git(repo, "add", ".")
        support.run_git(repo, "commit", "-q", "-m", "spec(discharges): record a weighing")
        branch = "spec/012-record-weighing"
        for argv in (
            ["commit-msg", "msg"],
            ["commits", "HEAD~1..HEAD"],
            ["pr", "--branch", branch, "--title", "spec(discharges): record a weighing", "--body-file", "body.md"],
            ["specs"],
            ["spec-approved", "--issue", "12", "--ref", "main"],
            ["design-approved", "--branch", branch, "--ref", "main"],
            ["fr-coverage", "--issue", "12"],
            ["test-report", "--branch", branch],
            ["setup"],
            ["paths", "--branch", branch, "--base", "main"],
        ):
            code, output = self.run_cli(*argv)
            self.assertEqual(code, 0, f"{argv}: {output}")
        self.assertEqual(self.run_cli("test-report", "--issue", "13")[0], 1)

    def test_a_missing_file_is_an_error_not_a_crash(self):
        code, output = self.run_cli("pr", "--branch", "spec/012-x", "--title", "spec: x", "--body-file", "/nonexistent/body.md")
        self.assertEqual(code, 1)
        self.assertIn("error:", output)


if __name__ == "__main__":
    unittest.main()
