"""Tests for scripts/checks/paths.py."""
import unittest

from support import enter, make_repo, run_git
from checks import common, paths

SPEC = "specs/012-record-weighing/"


class PathTests(unittest.TestCase):
    def assert_allowed(self, branch, *files):
        paths.check_paths(branch, list(files))

    def assert_refused(self, branch, *files, count=None):
        with self.assertRaises(common.Failure, msg=f"{branch}: {files}") as ctx:
            paths.check_paths(branch, list(files))
        if count is not None:
            self.assertEqual(len(ctx.exception.problems), count)

    def test_spec_branch(self):
        self.assert_allowed("spec/012-record-weighing", SPEC + "spec.md", "CONTEXT.md", "specs/007-login/spec.md")
        self.assert_refused("spec/012-record-weighing", SPEC + "spec.md", "apps/api/src/main.rs", "packages/e2e/x.spec.ts", count=2)
        self.assert_refused("spec/012-record-weighing", "docs/workflow.md")

    def test_design_branch(self):
        self.assert_allowed("design/012-record-weighing", SPEC + "design/brief.md", SPEC + "design/a.html", SPEC + "spec.md")
        self.assert_refused("design/012-record-weighing", "specs/007-login/spec.md")
        self.assert_refused("design/012-record-weighing", "apps/web/src/app.tsx")

    def test_docs_branch(self):
        self.assert_allowed("docs/003-product-discovery", "docs/product/vision.md", "README.md", "CONTEXT.md",
                            "packages/user-docs/pesee.md")
        self.assert_refused("docs/003-product-discovery", "packages/e2e/weighing.spec.ts")
        self.assert_refused("docs/003-product-discovery", "apps/api/src/main.rs")
        self.assert_refused("docs/003-product-discovery", SPEC + "spec.md")

    def test_feat_branch_cannot_change_what_was_approved(self):
        self.assert_allowed("feat/012-record-weighing", "apps/api/src/main.rs", "packages/e2e/weighing.spec.ts",
                            SPEC + "plan.md", SPEC + "test-report.md", "packages/user-docs/pesee.md", "README.md",
                            "contracts/openapi.json", ".github/workflows/ci.yml")
        self.assert_refused("feat/012-record-weighing", SPEC + "spec.md")
        self.assert_refused("feat/012-record-weighing", SPEC + "design/a.html")
        self.assert_refused("feat/012-record-weighing", "specs/007-login/plan.md")
        self.assert_refused("feat/012-record-weighing", "specs/007-login/spec.md")

    def test_fix_branch_has_no_spec_folder(self):
        self.assert_allowed("fix/031-negative-weight", "apps/api/src/main.rs", "packages/e2e/weighing.spec.ts", "packages/user-docs/pesee.md")
        self.assert_refused("fix/031-negative-weight", SPEC + "spec.md")
        self.assert_refused("fix/031-negative-weight", "specs/031-negative-weight/plan.md")

    def test_the_frame_changes_only_on_a_chore_branch(self):
        frame = (".claude/hooks/guard_git.py", ".claude/settings.json", ".githooks/pre-push",
                 "scripts/conventions.py", "scripts/checks/specs.py", "scripts/tests/test_specs.py",
                 ".github/workflows/conventions.yml", ".github/CODEOWNERS", ".github/pull_request_template.md", "specs/_TEMPLATE/spec.md")
        for branch in ("feat/012-record-weighing", "fix/031-negative-weight", "spec/012-record-weighing",
                       "design/012-record-weighing", "docs/003-product-discovery"):
            for path in frame:
                self.assert_refused(branch, path)
        self.assert_allowed("chore/040-tighten-checks", *frame, "apps/api/src/main.rs", SPEC + "spec.md")

    def test_changed_files_come_from_the_merge_base(self):
        repo = make_repo(self)
        enter(self, repo)
        run_git(repo, "checkout", "-q", "-b", "spec/012-record-weighing")
        (repo / "specs" / "012-record-weighing").mkdir(parents=True)
        (repo / "specs" / "012-record-weighing" / "spec.md").write_text("x")
        run_git(repo, "add", ".")
        run_git(repo, "commit", "-q", "-m", "spec: x")
        # main moves on after the branch was created: its files are not the branch's.
        run_git(repo, "checkout", "-q", "main")
        (repo / "apps").mkdir()
        (repo / "apps" / "main.rs").write_text("x")
        run_git(repo, "add", ".")
        run_git(repo, "commit", "-q", "-m", "feat: other work")
        run_git(repo, "checkout", "-q", "spec/012-record-weighing")
        self.assertEqual(paths.changed_files("main"), ["specs/012-record-weighing/spec.md"])


if __name__ == "__main__":
    unittest.main()
