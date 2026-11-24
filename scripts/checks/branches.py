"""Branch names: <type>/<NNN>-<slug>."""
import re

from .common import Failure, parse_issue


PROTECTED_BRANCHES = ("main",)
BRANCH_TYPES = ("spec", "design", "feat", "fix", "chore", "docs")
# The issue number is zero-padded to three digits, so that folders sort in order:
# issue 12 gives spec/012-<slug> and specs/012-<slug>/.
BRANCH_RE = re.compile(
    r"^(?P<type>%s)/(?P<issue>\d{3,})-(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)$"
    % "|".join(BRANCH_TYPES)
)

def parse_branch(name):
    match = BRANCH_RE.match(name)
    issue = parse_issue(match["issue"]) if match else None
    if issue is None:
        raise Failure([
            f"branch '{name}' does not match <type>/<NNN>-<slug> "
            f"(types: {', '.join(BRANCH_TYPES)}; NNN is the issue number padded to "
            "three digits, for example 012; slug in lowercase kebab-case)"
        ])
    return match["type"], issue, match["slug"]
