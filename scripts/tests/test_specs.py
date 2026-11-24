"""Tests for scripts/checks/specs.py and for the spec template override."""
import tempfile
import unittest
from pathlib import Path

from support import ROOT, VALID_REPORT, VALID_SPEC
from checks import common, specs


class SpecTests(unittest.TestCase):
    def make(self, text, folder="012-record-weighing"):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        spec_dir = root / "specs" / folder
        spec_dir.mkdir(parents=True)
        (spec_dir / "spec.md").write_text(text, encoding="utf-8")
        return root

    def test_valid(self):
        specs.check_specs(self.make(VALID_SPEC))

    def test_underscore_folders_are_ignored(self):
        root = self.make(VALID_SPEC)
        (root / "specs" / "_drafts").mkdir()
        (root / "specs" / "_drafts" / "spec.md").write_text("anything")
        specs.check_specs(root)

    def test_template_has_the_required_sections(self):
        template = (ROOT / "specs" / "_TEMPLATE" / "spec.md").read_text(encoding="utf-8")
        meta, body = specs.parse_frontmatter(template)
        self.assertEqual(set(meta), {"issue", "title", "ui_impact", "infra_impact"})
        headings = [h for h, _ in specs.spec_sections(body)]
        for heading in specs.SPEC_SECTIONS + ["UI"]:
            self.assertIn(heading, headings)
        for heading in ("Infrastructure", "Out of Scope", "Clarifications", "Assumptions"):
            self.assertIn(heading, headings)
        self.assertEqual([h for h in headings if h in specs.SPEC_SECTIONS], specs.SPEC_SECTIONS)
        self.assertTrue(specs.SPEC_TITLE_RE.search(body))

    def test_a_spec_left_as_the_template_is_refused(self):
        template = (ROOT / "specs" / "_TEMPLATE" / "spec.md").read_text(encoding="utf-8")
        self.assertNotIn("NEEDS CLARIFICATION", template)
        with self.assertRaises(common.Failure) as ctx:
            specs.check_specs(self.make(template.replace("issue: 0", "issue: 12")))
        self.assertTrue(any("placeholder" in p for p in ctx.exception.problems), ctx.exception.problems)

    def test_brackets_that_are_not_placeholders(self):
        specs.check_specs(self.make(VALID_SPEC.replace(
            "- Automatic import from weighing equipment is out of scope.",
            "- See [the vision](../../docs/product/vision.md).\n- [x] checked\n- [ ] unchecked\n- `[12/FR-001]` in test names.")))

    def test_infrastructure_section(self):
        infra = VALID_SPEC.replace("infra_impact: no", "infra_impact: yes")
        with self.assertRaises(common.Failure):
            specs.check_specs(self.make(infra))
        specs.check_specs(self.make(infra.replace(
            "## Assumptions", "## Infrastructure *(include if infra_impact is yes)*\n\nOne new environment variable.\n\n## Assumptions")))

    def test_other_templates(self):
        report = (ROOT / "specs" / "_TEMPLATE" / "test-report.md").read_text(encoding="utf-8")
        sections = dict(common.split_sections(common.strip_comments(report)))
        self.assertEqual([h for h in sections if h in specs.REPORT_SECTIONS], specs.REPORT_SECTIONS)
        self.assertTrue(specs.REPORT_ROW_RE.search(sections["Results"]))
        plan = (ROOT / "specs" / "_TEMPLATE" / "plan.md").read_text(encoding="utf-8")
        self.assertEqual([h for h, _ in common.split_sections(common.strip_comments(plan))],
                         ["Approach", "Requirements", "Contract", "Decisions", "Not done here"])

    def test_optional_sections(self):
        no_ui = VALID_SPEC.replace("ui_impact: yes", "ui_impact: no").replace(
            "## UI *(include if ui_impact is yes)*\n\nOne screen with a numeric keypad.\n\n", "")
        self.assertNotIn("## UI", no_ui)
        specs.check_specs(self.make(no_ui))
        specs.check_specs(self.make(VALID_SPEC.replace(
            "## Requirements", "## Clarifications\n\n### Session 2026-11-24\n\n- Q: unit? A: kg\n\n## Requirements")))

    def test_failures(self):
        cases = {
            "clarification marker": VALID_SPEC.replace("below the empty weighing.", "below [NEEDS CLARIFICATION: which tare?]."),
            "gap in stories": VALID_SPEC.replace("### User Story 2 -", "### User Story 3 -"),
            "story without priority": VALID_SPEC.replace(" (Priority: P2)", ""),
            "missing Then": VALID_SPEC.replace(", **Then** the net tonnage is stored", ""),
            "missing section": VALID_SPEC.replace(
                "## Security Considerations *(mandatory)*\n\nOnly an active operations lead of the operating organization can record a weighing.\n\n", ""),
            "empty section": VALID_SPEC.replace("Only an active operations lead of the operating organization can record a weighing.", ""),
            "wrong order": VALID_SPEC.replace("## Requirements *(mandatory)*", "## Success Criteria *(mandatory)*", 1).replace(
                "## Success Criteria *(mandatory)*\n\n### Measurable", "## Requirements *(mandatory)*\n\n### Measurable"),
            "no requirement": VALID_SPEC.replace("**FR-001**", "FR-001").replace("**FR-002**", "FR-002"),
            "duplicate requirement": VALID_SPEC.replace("**FR-002**", "**FR-001**"),
            "requirement id with two digits": VALID_SPEC.replace("**FR-002**", "**FR-02**"),
            "success criterion id with two digits": VALID_SPEC.replace("**SC-001**", "**SC-1**"),
            "requirement without user story": VALID_SPEC.replace(" *(US2)*", ""),
            "requirement citing an unknown user story": VALID_SPEC.replace("*(US2)*", "*(US3)*"),
            "no success criterion": VALID_SPEC.replace("- **SC-001**: An operations lead records a weighing in under 20 seconds.", "Fast."),
            "wrong title": VALID_SPEC.replace("# Feature Specification: Record", "# Spec #12: Record"),
            "wrong issue": VALID_SPEC.replace("issue: 12", "issue: 13"),
            "placeholder": VALID_SPEC.replace("Automatic import from weighing equipment is out of scope.", "TODO"),
            "template placeholder": VALID_SPEC.replace("38.460 t", "[weight]"),
            "bad ui flag": VALID_SPEC.replace("ui_impact: yes", "ui_impact: maybe"),
            "ui yes without UI section": VALID_SPEC.replace(
                "## UI *(include if ui_impact is yes)*\n\nOne screen with a numeric keypad.\n\n", ""),
        }
        for name, text in cases.items():
            self.assertNotEqual(text, VALID_SPEC, name)
            with self.assertRaises(common.Failure, msg=name):
                specs.check_specs(self.make(text))

    def test_requirement_may_cite_its_user_story_on_the_next_line(self):
        specs.check_specs(self.make(VALID_SPEC.replace("below the empty weighing. *(US2)*", "below the empty weighing.\n  *(US2)*")))

    def test_requirement_may_cite_several_user_stories_on_a_wrapped_line(self):
        specs.check_specs(self.make(VALID_SPEC.replace(
            "below the empty weighing. *(US2)*", "below the empty weighing,\n  whatever the truck. *(US1, US2)*")))

    def make_with_report(self, report):
        root = self.make(VALID_SPEC)
        (root / "specs" / "012-record-weighing" / "test-report.md").write_text(report, encoding="utf-8")
        return root

    def test_test_report(self):
        specs.check_specs(self.make_with_report(VALID_REPORT))
        specs.check_specs(self.make_with_report(VALID_REPORT.replace(
            "| pass |\n\n", "| not testable: needs the weighing equipment |\n\n")))
        cases = {
            "requirement without a line": VALID_REPORT.replace("| FR-002 |", "| FR-003 |"),
            "failing requirement": VALID_REPORT.replace("empty weighing | pass |", "empty weighing | fail |"),
            "no test named": VALID_REPORT.replace("e2e/weighing.spec.ts: [12/FR-001] stores the net tonnage", " "),
            "not testable without a reason": VALID_REPORT.replace("empty weighing | pass |", "empty weighing | not testable |"),
            "line for a requirement that is not in the spec": VALID_REPORT.replace(
                "\n\n## Gaps", "\n| FR-009 | e2e/x.spec.ts: [12/FR-009] x | pass |\n\n## Gaps"),
            "missing section": VALID_REPORT.replace("## Gaps\n\nNone.\n\n", ""),
        }
        for name, text in cases.items():
            self.assertNotEqual(text, VALID_REPORT, name)
            with self.assertRaises(common.Failure, msg=name):
                specs.check_specs(self.make_with_report(text))

    def test_test_report_is_required_on_the_code_pull_request(self):
        with self.assertRaises(common.Failure) as ctx:
            specs.check_test_report_present(self.make(VALID_SPEC), 12)
        self.assertIn("test-report.md", ctx.exception.problems[0])
        root = self.make_with_report(VALID_REPORT)
        self.assertEqual(specs.check_test_report_present(root, 12).name, "test-report.md")

    def test_design_folder_without_ui_impact(self):
        root = self.make(VALID_SPEC.replace("ui_impact: yes", "ui_impact: no"))
        (root / "specs" / "012-record-weighing" / "design").mkdir()
        with self.assertRaises(common.Failure):
            specs.check_specs(root)

    def test_bad_folder_and_stray_file(self):
        with self.assertRaises(common.Failure):
            specs.check_specs(self.make(VALID_SPEC, folder="record-weighing"))
        with self.assertRaises(common.Failure):
            specs.check_specs(self.make(VALID_SPEC, folder="12-record-weighing"))
        root = self.make(VALID_SPEC)
        (root / "specs" / "notes.md").write_text("x")
        with self.assertRaises(common.Failure):
            specs.check_specs(root)


if __name__ == "__main__":
    unittest.main()
