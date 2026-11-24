"""Traceability: every functional requirement is referenced by a test."""
import re
from pathlib import Path

from .common import Failure
from .specs import find_spec_dir, functional_requirements, parse_frontmatter


SKIP_DIRS = {".git", "node_modules", "target", "dist", "build", ".turbo", "coverage"}
DEFAULT_TEST_DIRS = ("apps", "e2e")
TEST_FILE_RE = re.compile(r"\.(test|spec)\.tsx?$")
RUST_TEST_RE = re.compile(r"#\[(cfg\(test\)|test|tokio::test|sqlx::test)")


def is_test_file(relative, text):
    """A reference only counts in a test: e2e/, a tests/ folder, *.test.ts, or Rust test code."""
    if "e2e" in relative.parts or "tests" in relative.parts:
        return True
    if TEST_FILE_RE.search(relative.name):
        return True
    return relative.suffix == ".rs" and bool(RUST_TEST_RE.search(text))

def check_fr_coverage(root, issue, dirs):
    root = Path(root)
    spec_dir = find_spec_dir(root, issue)
    _, body = parse_frontmatter((spec_dir / "spec.md").read_text(encoding="utf-8"))
    ids = functional_requirements(body)
    if not ids:
        raise Failure([f"{spec_dir.name}/spec.md has no functional requirement"])
    # The issue may be written 12 or 012 in a test.
    patterns = {i: re.compile(rf"(?<![\w/])0*{issue}/FR-{i}(?!\d)") for i in ids}
    covered = set()
    for base in dirs:
        base_path = root / base
        if not base_path.is_dir():
            continue
        for path in base_path.rglob("*"):
            if SKIP_DIRS.intersection(path.parts) or not path.is_file():
                continue
            if path.suffix not in {".rs", ".ts", ".tsx"}:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            if not is_test_file(path.relative_to(root), text):
                continue
            for i, pattern in patterns.items():
                if i not in covered and pattern.search(text):
                    covered.add(i)
    missing = [i for i in ids if i not in covered]
    if missing:
        raise Failure([
            f"no test references {issue}/FR-{i} (put '{issue}/FR-{i}' in the name of a test or in a comment above it; only test files count)"
            for i in missing
        ])
    return ids
