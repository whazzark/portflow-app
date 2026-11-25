"""Status of the architecture decision records in docs/adr/.

An ADR is accepted when the human merges the pull request that adds it, so every ADR
in the tree carries the status "accepted": a "proposed" one can never reach main.
"""
import re
from pathlib import Path

from .common import Failure


ADR_FILE_RE = re.compile(r"^\d{4}-[a-z0-9-]+\.md$")
STATUS_RE = re.compile(r"^Status: accepted \(\d{4}-\d{2}-\d{2}\)$")


def status_line(text):
    """The first 'Status:' line before the first section, or None."""
    for line in text.splitlines():
        if line.startswith("## "):
            return None
        if line.startswith("Status:"):
            return line.strip()
    return None


def check_adrs(root):
    adr_dir = Path(root) / "docs" / "adr"
    if not adr_dir.is_dir():
        return
    problems = []
    for path in sorted(adr_dir.iterdir()):
        if not ADR_FILE_RE.match(path.name):
            continue
        status = status_line(path.read_text(encoding="utf-8"))
        if status is None or not STATUS_RE.match(status):
            found = f"'{status}'" if status else "no status line before the first section"
            problems.append(
                f"docs/adr/{path.name}: the status must be 'Status: accepted (YYYY-MM-DD)', found {found}. "
                "An ADR is accepted when the human merges the pull request that adds it, "
                "so the pull request writes that status (docs/adr/README.md)"
            )
    if problems:
        raise Failure(problems)
