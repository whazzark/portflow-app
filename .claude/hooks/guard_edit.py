#!/usr/bin/env python3
"""Claude Code PreToolUse hook for the file editing tools.

The files that make the frame (the guards, the settings, the git hooks, the
convention checks, the CI workflows) decide what an agent may do. Changing one of
them asks the human first, whatever the permission mode.

It does not see a file written through the Bash tool: this is a guard against
mistakes, not a security boundary.
"""
import json
import os
import sys

EDIT_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}
PROTECTED_FILES = {
    ".claude/settings.json",
    ".claude/settings.local.json",
    ".github/CODEOWNERS",
    "scripts/conventions.py",
}
PROTECTED_DIRS = (
    ".claude/hooks/",
    ".githooks/",
    "scripts/checks/",
    ".github/workflows/",
)


def relative_path(file_path, root):
    """Path of the file inside the project, or None when it is outside."""
    root = os.path.normpath(root)
    path = os.path.normpath(os.path.join(root, file_path))
    if path != root and not path.startswith(root + os.sep):
        return None
    return os.path.relpath(path, root).replace(os.sep, "/")


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0
    if payload.get("tool_name") not in EDIT_TOOLS:
        return 0
    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
    root = os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or ""
    if not file_path or not root:
        return 0
    rel = relative_path(file_path, root)
    if rel is None:
        return 0
    if rel in PROTECTED_FILES or rel.startswith(PROTECTED_DIRS):
        json.dump({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "ask",
                "permissionDecisionReason": (
                    f"{rel} is part of the delivery frame (guards, settings, git hooks, "
                    "convention checks, CI). A human confirms every change to it."
                ),
            }
        }, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
