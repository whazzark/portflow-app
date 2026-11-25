"""Which files each type of branch may change.

A gate is only worth something if what it approved cannot be changed afterwards by
another kind of pull request: a code pull request does not edit the approved spec,
a spec pull request does not carry code, and the frame itself (guards, checks, the
conventions workflow) changes only on a chore branch.
"""
from .branches import parse_branch
from .common import Failure, git, pad_issue


FRAME = (
    ".claude/hooks/",
    ".claude/settings.json",
    ".claude/settings.local.json",
    ".githooks/",
    "scripts/",
    ".github/workflows/conventions.yml",
    ".github/CODEOWNERS",
    ".github/pull_request_template.md",
    ".github/ISSUE_TEMPLATE/",
    "specs/_TEMPLATE/",
)
CODE_ARTEFACTS = ("plan.md", "test-report.md")
USER_DOCS = "packages/user-docs/"


def changed_files(base):
    """Files changed on the current branch since it left the base branch."""
    return [f for f in git("diff", "--name-only", f"{base}...HEAD").splitlines() if f]


def problem_for(btype, issue, path):
    if btype == "chore":
        return None
    if path.startswith(FRAME):
        return "the frame (guards, checks, conventions workflow, templates) changes only on a chore/ branch"
    own_spec = f"specs/{pad_issue(issue)}-"
    if btype == "spec":
        if not (path.startswith("specs/") or path == "CONTEXT.md"):
            return "a spec/ branch changes only specs/ and CONTEXT.md"
    elif btype == "design":
        if not path.startswith(own_spec):
            return f"a design/ branch changes only the spec folder of its issue ({own_spec}<slug>/)"
    elif btype == "docs":
        if not (path.startswith(("docs/", USER_DOCS)) or path in ("README.md", "CONTEXT.md")):
            return f"a docs/ branch changes only docs/, {USER_DOCS}, README.md and CONTEXT.md"
    elif path.startswith("specs/"):
        folder, _, rest = path[len("specs/"):].partition("/")
        if btype == "feat" and ("specs/" + folder).startswith(own_spec) and rest in CODE_ARTEFACTS:
            return None
        if btype == "feat":
            return (
                "a feat/ branch adds only plan.md and test-report.md to the spec folder of its issue: "
                "the spec and the design change through their own pull requests"
            )
        return f"a {btype}/ branch does not change specs/: a spec changes through a spec pull request"
    return None


def check_paths(branch, files):
    btype, issue, _ = parse_branch(branch)
    problems = []
    for path in files:
        reason = problem_for(btype, issue, path)
        if reason:
            problems.append(f"{path}: {reason}")
    if problems:
        raise Failure(problems)
    return len(files)
