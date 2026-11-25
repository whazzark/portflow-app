"""Commit messages: Conventional Commits."""
import re
from pathlib import Path

from .common import Failure, git


COMMIT_TYPES = (
    "feat", "fix", "spec", "design", "docs", "test",
    "refactor", "perf", "chore", "ci", "build", "style",
)
HEADER_RE = re.compile(
    r"^(?P<type>%s)(?:\((?P<scope>[a-z0-9]+(?:-[a-z0-9]+)*)\))?: (?P<desc>\S.*)$"
    % "|".join(COMMIT_TYPES)
)
HEADER_MAX = 72

def header_problems(header, label="commit"):
    problems = []
    match = HEADER_RE.match(header)
    if not match:
        return [
            f"{label} header '{header}' is not '<type>(<scope>): <description>' "
            f"(types: {', '.join(COMMIT_TYPES)})"
        ]
    desc = match["desc"]
    if len(header) > HEADER_MAX:
        problems.append(f"{label} header is {len(header)} characters, the limit is {HEADER_MAX}")
    if desc[0].isupper():
        problems.append(f"{label} description must start with a lowercase letter")
    if desc.endswith("."):
        problems.append(f"{label} description must not end with a period")
    return problems


EXEMPT_RE = re.compile(r"^(Merge (branch|remote-tracking branch|pull request|tag) |Revert \")")


def is_exempt_header(header):
    """Messages written by git itself for a merge or a revert."""
    return bool(EXEMPT_RE.match(header))


def check_commit_msg(path):
    lines = [l for l in Path(path).read_text(encoding="utf-8").splitlines() if not l.startswith("#")]
    header = lines[0].strip() if lines else ""
    if not header:
        raise Failure(["commit message is empty"])
    if is_exempt_header(header):
        return
    problems = header_problems(header)
    if len(lines) > 1 and lines[1].strip():
        problems.append("the second line of a commit message must be blank")
    if problems:
        raise Failure(problems)


def check_commits(rev_range):
    problems = []
    for header in git("log", "--format=%s", rev_range).splitlines():
        if header and not is_exempt_header(header):
            problems.extend(header_problems(header))
    if problems:
        raise Failure(problems)
