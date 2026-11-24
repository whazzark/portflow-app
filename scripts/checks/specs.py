"""Spec structure: front matter, sections, user stories, requirements."""
import re
from pathlib import Path

from .common import Failure, pad_issue, parse_issue, split_sections, strip_comments


# Sections every spec must have, in this relative order. Other sections
# (Assumptions, Clarifications...) are allowed anywhere.
SPEC_SECTIONS = [
    "User Scenarios & Testing",
    "Requirements",
    "Success Criteria",
    "Security Considerations",
]
SPEC_TITLE_RE = re.compile(r"^# Feature Specification: \S", re.M)
SPEC_DIR_RE = re.compile(r"^(?P<issue>\d{3,})-(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)$")
HEADING_NOTE_RE = re.compile(r"\s*\*\([^)]*\)\*$")
STORY_PREFIX = "User Story"
STORY_HEADING_RE = re.compile(r"^User Story (?P<n>\d+) - \S.*\(Priority: P[1-9]\d*\)$")
FR_RE = re.compile(r"\*\*FR-(?P<id>\d{3,})\*\*")
SC_RE = re.compile(r"\*\*SC-(?P<id>\d{3,})\*\*")
# A requirement cites the user stories it comes from: "... *(US1, US2)*".
STORY_REF_RE = re.compile(r"\bUS(?P<n>\d+)\b")
# An item ends at a blank line, at the next list item or at a heading.
ITEM_END_RE = re.compile(r"\n\s*\n|\n\s*[-*] |\n#")
SHORT_ID_RE = re.compile(r"\*\*(?P<label>FR|SC)-(?P<id>\d{1,2})\*\*")
CLARIFICATION_MARKER = "[NEEDS CLARIFICATION"
# test-report.md, written by the test stage next to the spec.
REPORT_SECTIONS = ["Results", "Gaps", "Not tested"]
REPORT_ROW_RE = re.compile(r"^\|\s*FR-(?P<id>\d{3,})\s*\|(?P<test>[^|]*)\|(?P<result>[^|]*)\|", re.M)
NOT_TESTABLE_RE = re.compile(r"^not testable:\s*\S")
PLACEHOLDER_RE = re.compile(r"\b(TODO|TBD|FIXME)\b")
# "[initial state]" left from the template. Links, checkboxes and code spans are not placeholders.
TEMPLATE_PLACEHOLDER_RE = re.compile(r"\[(?![ xX]\])(?!NEEDS CLARIFICATION)[^\]\n]+\](?!\()")
CODE_SPAN_RE = re.compile(r"`[^`\n]*`")
# Sections required by a flag of the front matter.
CONDITIONAL_SECTIONS = (("ui_impact", "UI"), ("infra_impact", "Infrastructure"))
YES_NO = ("yes", "no")

def parse_frontmatter(text):
    if not text.startswith("---\n"):
        return None, text
    end = text.find("\n---", 4)
    if end == -1:
        return None, text
    meta = {}
    for line in text[4:end].splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip().strip('"').strip("'")
    return meta, text[end + 4:].lstrip("\n")


def spec_sections(spec_body):
    """Return [(heading, body)] of a spec, without the '*(mandatory)*' heading notes."""
    return [(HEADING_NOTE_RE.sub("", h), b) for h, b in split_sections(strip_comments(spec_body))]


def functional_requirements(spec_body):
    """Return the ids ('001', '002'...) found in the Requirements section, in order."""
    section = dict(spec_sections(spec_body)).get("Requirements", "")
    return [m["id"] for m in FR_RE.finditer(section)]


def requirement_items(section):
    """Return [(id, text)] of the FR items of a Requirements section, wrapped lines included."""
    items = []
    for match in FR_RE.finditer(section):
        rest = section[match.end():]
        end = ITEM_END_RE.search(rest)
        items.append((match["id"], rest[:end.start()] if end else rest))
    return items


def spec_problems(spec_path, root):
    rel = spec_path.relative_to(root)
    problems = []

    def add(message):
        problems.append(f"{rel}: {message}")

    dir_match = SPEC_DIR_RE.match(spec_path.parent.name)
    issue = parse_issue(dir_match["issue"]) if dir_match else None
    if issue is None:
        add("the spec folder must be named <NNN>-<slug> (issue number padded to three digits)")
        return problems

    meta, body = parse_frontmatter(spec_path.read_text(encoding="utf-8"))
    if meta is None:
        add("missing front matter (issue, title, ui_impact, infra_impact)")
        return problems
    if meta.get("issue") != str(issue):
        add(f"front matter 'issue' must be {issue}")
    if not meta.get("title"):
        add("front matter 'title' is required")
    for key in ("ui_impact", "infra_impact"):
        if meta.get(key) not in YES_NO:
            add(f"front matter '{key}' must be yes or no")

    body = strip_comments(body)
    if not SPEC_TITLE_RE.search(body):
        add("the title line must be '# Feature Specification: <title>'")
    if PLACEHOLDER_RE.search(body):
        add("contains a TODO/TBD/FIXME placeholder")
    left = TEMPLATE_PLACEHOLDER_RE.findall(CODE_SPAN_RE.sub("", body))
    if left:
        shown = ", ".join(left[:3]) + (" ..." if len(left) > 3 else "")
        add(f"contains {len(left)} template placeholder(s) to replace: {shown}")
    if CLARIFICATION_MARKER in body:
        add("contains a [NEEDS CLARIFICATION] marker: resolve it before the spec can be approved")

    sections = spec_sections(body)
    headings = [h for h, _ in sections]
    required = SPEC_SECTIONS + [section for flag, section in CONDITIONAL_SECTIONS if meta.get(flag) == "yes"]
    missing = [h for h in required if h not in headings]
    if missing:
        add("missing section(s): " + ", ".join(missing)
            + " (UI is required when ui_impact is yes, Infrastructure when infra_impact is yes)")
        return problems
    if [h for h in headings if h in SPEC_SECTIONS] != SPEC_SECTIONS:
        add("sections must appear in this order: " + ", ".join(SPEC_SECTIONS))
        return problems
    content = dict(sections)
    for heading in required:
        if not content[heading].strip():
            add(f"section '{heading}' is empty")

    stories = [(title, text) for title, text in split_sections(content["User Scenarios & Testing"], level=3)
               if title.startswith(STORY_PREFIX)]
    numbers = []
    for title, text in stories:
        match = STORY_HEADING_RE.match(title)
        if not match:
            add(f"'{title}' must be '### User Story <k> - <title> (Priority: P<n>)'")
            continue
        numbers.append(int(match["n"]))
        for keyword in ("**Given**", "**When**", "**Then**"):
            if keyword not in text:
                add(f"'User Story {match['n']}' is missing {keyword} in its acceptance scenarios")
    if not stories:
        add("at least one '### User Story 1 - <title> (Priority: P1)' is required")
    elif numbers and numbers != list(range(1, len(numbers) + 1)):
        add(f"user stories must be numbered 1..{len(numbers)} without gaps (found {numbers})")

    for label, regex, heading in (("FR", FR_RE, "Requirements"), ("SC", SC_RE, "Success Criteria")):
        ids = [m["id"] for m in regex.finditer(content[heading])]
        if not ids:
            add(f"section '{heading}' needs at least one '**{label}-001**: ...' item")
        duplicates = sorted({i for i in ids if ids.count(i) > 1})
        if duplicates:
            add(f"duplicate id(s) in '{heading}': " + ", ".join(f"{label}-{i}" for i in duplicates))

    for match in SHORT_ID_RE.finditer(content["Requirements"] + "\n" + content["Success Criteria"]):
        add(f"{match['label']}-{match['id']} must have three digits ({match['label']}-{int(match['id']):03d})")

    for fr_id, text in requirement_items(content["Requirements"]):
        cited = [int(m["n"]) for m in STORY_REF_RE.finditer(text)]
        if not cited:
            add(f"FR-{fr_id} must cite the user story it comes from, as '*(US1)*'")
        unknown = sorted(set(cited) - set(numbers))
        if unknown:
            add(f"FR-{fr_id} cites unknown user stor(ies): " + ", ".join(f"US{n}" for n in unknown))

    design_dir = spec_path.parent / "design"
    if design_dir.exists() and meta.get("ui_impact") == "no":
        add("a design/ folder exists but ui_impact is 'no'")

    return problems


def report_problems(report_path, root, fr_ids):
    """A committed test report has one passing line per requirement of the spec."""
    rel = report_path.relative_to(root)
    sections = dict(split_sections(strip_comments(report_path.read_text(encoding="utf-8"))))
    missing = [h for h in REPORT_SECTIONS if not sections.get(h, "").strip()]
    if missing:
        return [f"{rel}: missing or empty section(s): " + ", ".join(missing)]
    problems = []
    seen = set()
    for row in REPORT_ROW_RE.finditer(sections["Results"]):
        fr, test, result = row["id"], row["test"].strip(), row["result"].strip().lower()
        seen.add(fr)
        if not test:
            problems.append(f"{rel}: FR-{fr} names no test")
        if result == "fail":
            problems.append(f"{rel}: FR-{fr} fails: the feature goes back to development")
        elif result != "pass" and not NOT_TESTABLE_RE.match(result):
            problems.append(f"{rel}: the result of FR-{fr} must be 'pass' or 'not testable: <reason>'")
    problems.extend(f"{rel}: no line for FR-{i}" for i in fr_ids if i not in seen)
    problems.extend(f"{rel}: FR-{i} is not a requirement of the spec" for i in sorted(seen - set(fr_ids)))
    return problems


def check_specs(root):
    root = Path(root)
    specs_dir = root / "specs"
    problems = []
    if not specs_dir.is_dir():
        return
    for entry in sorted(specs_dir.iterdir()):
        if entry.name.startswith((".", "_")) or entry.name == "README.md":
            continue
        if not entry.is_dir():
            problems.append(f"specs/{entry.name}: only spec folders are allowed in specs/")
            continue
        spec = entry / "spec.md"
        if not spec.is_file():
            problems.append(f"specs/{entry.name}: missing spec.md")
            continue
        found = spec_problems(spec, root)
        problems.extend(found)
        report = entry / "test-report.md"
        if report.is_file() and not found:
            _, body = parse_frontmatter(spec.read_text(encoding="utf-8"))
            problems.extend(report_problems(report, root, functional_requirements(body)))
    if problems:
        raise Failure(problems)


def find_spec_dir(root, issue):
    matches = sorted(p for p in (Path(root) / "specs").glob(f"{pad_issue(issue)}-*") if p.is_dir())
    if not matches:
        raise Failure([f"no spec folder specs/{pad_issue(issue)}-<slug>/ found"])
    if len(matches) > 1:
        raise Failure([f"several spec folders found for #{issue}: {', '.join(m.name for m in matches)}"])
    return matches[0]


def check_test_report_present(root, issue):
    """The code pull request of a user story carries the report of the test stage."""
    report = find_spec_dir(root, issue) / "test-report.md"
    if not report.is_file():
        raise Failure([
            f"{report.relative_to(Path(root))} is missing: the test stage (/test {issue}) "
            "writes it once every functional requirement passes"
        ])
    return report
