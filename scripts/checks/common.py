"""Shared helpers: failure type, git, markdown sections, issue numbers."""
import re
import subprocess


class Failure(Exception):
    """Raised with a list of human-readable problems."""

    def __init__(self, problems):
        super().__init__("\n".join(problems))
        self.problems = list(problems)

def git(*args, cwd=None):
    proc = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise Failure([f"git {' '.join(args)} failed: {proc.stderr.strip()}"])
    return proc.stdout


def strip_comments(text):
    return re.sub(r"<!--.*?-->", "", text, flags=re.S)


def pad_issue(issue):
    """Issue number as it appears in branch and spec folder names (12 -> '012')."""
    return f"{int(issue):03d}"


def parse_issue(text):
    """Return the issue number of a zero-padded prefix, or None when it is not canonical."""
    issue = int(text)
    return issue if issue > 0 and pad_issue(issue) == text else None


def split_sections(markdown, level=2):
    """Return [(heading, body)] for headings of the given level, in order."""
    marker = "#" * level + " "
    sections, current, lines = [], None, []
    in_fence = False
    for line in markdown.splitlines():
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
        if not in_fence and line.startswith(marker):
            if current is not None:
                sections.append((current, "\n".join(lines).strip()))
            current, lines = line[len(marker):].strip(), []
        elif current is not None:
            lines.append(line)
    if current is not None:
        sections.append((current, "\n".join(lines).strip()))
    return sections
