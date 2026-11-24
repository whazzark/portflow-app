"""Pull request title and body."""
import re

from .branches import parse_branch
from .commits import HEADER_MAX, HEADER_RE, header_problems
from .common import Failure, pad_issue, split_sections, strip_comments


# GitHub appends " (#<pull request>)" to the title when it squashes: the title itself
# carries no number, and leaves room for that suffix within the 72 characters of a header.
TITLE_NUMBER_RE = re.compile(r"\(?#\d+\)?\s*$")
TITLE_MAX = HEADER_MAX - len(" (#9999)")
TITLE_TYPES_BY_BRANCH = {
    "spec": {"spec"},
    "design": {"design"},
    "feat": {"feat"},
    "fix": {"fix"},
    "docs": {"docs"},
    "chore": {"chore", "ci", "build", "refactor", "test", "perf"},
}

PR_SECTIONS = [
    "Issue",
    "Spec",
    "Summary",
    "Requirements covered",
    "Tests",
    "QA report",
    "Rust notes",
    "Checklist",
]

CODE_BRANCHES = ("feat", "fix")
CHECKLIST_ITEM_RE = re.compile(r"^\s*[-*] \[(?P<mark>[ xX])\] (?P<text>.+?)\s*$", re.M)


def checklist_items(markdown):
    """Return the text of every item of the Checklist section."""
    section = dict(split_sections(strip_comments(markdown))).get("Checklist", "")
    return [m["text"] for m in CHECKLIST_ITEM_RE.finditer(section)]


def check_pr(branch, title, body, template=None):
    problems = []
    btype, issue, _ = parse_branch(branch)

    if TITLE_NUMBER_RE.search(title):
        problems.append(
            "PR title must not end with an issue or pull request number: GitHub adds the pull "
            f"request number at merge, and the issue goes in the body ('Closes #{issue}' or 'Refs #{issue}')"
        )
    else:
        problems.extend(header_problems(title, label="PR title"))
        if len(title) > TITLE_MAX:
            problems.append(
                f"PR title is {len(title)} characters, the limit is {TITLE_MAX} "
                "(GitHub appends the pull request number at merge)"
            )
        match = HEADER_RE.match(title)
        if match and match["type"] not in TITLE_TYPES_BY_BRANCH[btype]:
            allowed = ", ".join(sorted(TITLE_TYPES_BY_BRANCH[btype]))
            problems.append(f"PR title type '{match['type']}' is not allowed on a {btype}/ branch (allowed: {allowed})")

    sections = split_sections(strip_comments(body))
    headings = [h for h, _ in sections]
    if headings != PR_SECTIONS:
        problems.append(
            "PR body sections must be exactly, in order: " + ", ".join(PR_SECTIONS)
            + f" (found: {', '.join(headings) or 'none'})"
        )
    content = dict(sections)
    for heading in PR_SECTIONS:
        if heading in content and not content[heading].strip():
            problems.append(f"PR section '{heading}' is empty (write N/A if it does not apply)")

    issue_text = content.get("Issue", "")
    refs = {(m[1].lower(), int(m[2])) for m in re.finditer(r"\b(Closes|Refs) #([1-9]\d*)\b", issue_text, re.I)}
    if not any(n == issue for _, n in refs):
        problems.append(f"PR section 'Issue' must contain 'Closes #{issue}' or 'Refs #{issue}'")
    if btype in ("spec", "design") and ("closes", issue) in refs:
        problems.append(f"a {btype}/ PR must use 'Refs #{issue}': the issue stays open until the code is merged")
    if btype in CODE_BRANCHES and ("closes", issue) not in refs:
        problems.append(f"a {btype}/ PR must use 'Closes #{issue}': it is the only code pull request of the issue")
    if btype == "feat" and not re.search(r"\bFR-\d{3,}\b", content.get("Requirements covered", "")):
        problems.append("PR section 'Requirements covered' must list the functional requirements (FR-001: <test>)")

    if btype in ("spec", "design", "feat") and f"specs/{pad_issue(issue)}-" not in content.get("Spec", ""):
        problems.append(f"PR section 'Spec' must link the spec folder (specs/{pad_issue(issue)}-<slug>/)")

    if re.search(r"^\s*[-*] \[ \]", content.get("Checklist", ""), re.M):
        problems.append("every checklist item must be ticked")
    if template is not None:
        ticked = {m["text"] for m in CHECKLIST_ITEM_RE.finditer(content.get("Checklist", "")) if m["mark"] != " "}
        for item in checklist_items(template):
            if item not in ticked:
                problems.append(f"checklist item removed or changed: '{item}' (keep every item of the template, ticked)")
    if "Checklist" in content and not re.search(r"^\s*[-*] \[[xX]\]", content["Checklist"], re.M):
        problems.append("PR section 'Checklist' must contain at least one ticked item")

    if problems:
        raise Failure(problems)

