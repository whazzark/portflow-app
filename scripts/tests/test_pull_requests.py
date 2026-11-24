"""Tests for scripts/checks/pull_requests.py."""
import unittest

from support import VALID_BODY
from checks import common, pull_requests


class PullRequestTests(unittest.TestCase):
    def test_valid_spec_pr(self):
        pull_requests.check_pr("spec/012-record-weighing", "spec(discharges): record a weighing (#12)", VALID_BODY)

    def test_issue_mismatch(self):
        with self.assertRaises(common.Failure):
            pull_requests.check_pr("spec/012-record-weighing", "spec: record a weighing (#13)", VALID_BODY)

    def test_type_mismatch(self):
        with self.assertRaises(common.Failure):
            pull_requests.check_pr("spec/012-record-weighing", "feat: record a weighing (#12)", VALID_BODY)

    def test_spec_pr_must_not_close(self):
        with self.assertRaises(common.Failure):
            pull_requests.check_pr("spec/012-record-weighing", "spec: record a weighing (#12)", VALID_BODY.replace("Refs #12", "Closes #12"))

    def test_missing_section(self):
        with self.assertRaises(common.Failure):
            pull_requests.check_pr("spec/012-record-weighing", "spec: record a weighing (#12)", VALID_BODY.replace("## Rust notes\n\nN/A\n\n", ""))

    def test_unticked_checklist(self):
        with self.assertRaises(common.Failure):
            pull_requests.check_pr("spec/012-record-weighing", "spec: record a weighing (#12)", VALID_BODY.replace("- [x]", "- [ ]"))

    def test_empty_section_with_only_comment(self):
        body = VALID_BODY.replace("Adds the spec.", "<!-- describe the change -->")
        with self.assertRaises(common.Failure):
            pull_requests.check_pr("spec/012-record-weighing", "spec: record a weighing (#12)", body)

    CODE_BODY = VALID_BODY.replace("Refs #12", "Closes #12").replace(
        "## Requirements covered\n\nN/A", "## Requirements covered\n\n12/FR-001: e2e/weighing.spec.ts")

    def test_code_pr_closes_the_issue(self):
        pull_requests.check_pr("feat/012-record-weighing", "feat(web): record a weighing (#12)", self.CODE_BODY)
        for branch, title in (("feat/012-record-weighing", "feat(web): record a weighing (#12)"),
                              ("fix/012-record-weighing", "fix(web): record a weighing (#12)")):
            with self.assertRaises(common.Failure, msg=branch):
                pull_requests.check_pr(branch, title, self.CODE_BODY.replace("Closes #12", "Refs #12"))

    def test_feat_pr_lists_the_requirements_it_covers(self):
        with self.assertRaises(common.Failure):
            pull_requests.check_pr("feat/012-record-weighing", "feat(web): record a weighing (#12)",
                                   VALID_BODY.replace("Refs #12", "Closes #12"))

    def test_checklist_keeps_every_item_of_the_template(self):
        template = "## Checklist\n\n- [ ] Conventions pass locally\n- [ ] Vocabulary matches CONTEXT.md\n"
        title = "spec(discharges): record a weighing (#12)"
        with self.assertRaises(common.Failure) as ctx:
            pull_requests.check_pr("spec/012-record-weighing", title, VALID_BODY, template=template)
        self.assertIn("Vocabulary matches CONTEXT.md", ctx.exception.problems[0])
        full = VALID_BODY.replace("- [x] Conventions pass locally", "- [x] Conventions pass locally\n- [X] Vocabulary matches CONTEXT.md")
        pull_requests.check_pr("spec/012-record-weighing", title, full, template=template)

    def test_the_repository_template_has_a_checklist(self):
        from support import ROOT
        template = (ROOT / ".github" / "pull_request_template.md").read_text(encoding="utf-8")
        self.assertGreaterEqual(len(pull_requests.checklist_items(template)), 3)


if __name__ == "__main__":
    unittest.main()
