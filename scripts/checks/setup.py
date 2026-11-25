"""Local setup: the git hooks of the repository are the ones git runs.

A relative core.hooksPath is resolved from the root of the working tree, so `.githooks`
runs the hooks of the checked-out branch, in a linked worktree too. A worktree created
by the Claude desktop app gets, at the worktree scope, the absolute path of the main
checkout's hooks: that scope wins over the local one, so the fix is written there.
"""
import subprocess

from .common import Failure


HOOKS_PATH = ".githooks"


def read_hooks_path():
    """The value git uses and the scope it comes from (None, None when unset)."""
    proc = subprocess.run(["git", "config", "--show-scope", "--get", "core.hooksPath"],
                          capture_output=True, text=True)
    line = proc.stdout.strip()
    if not line:
        return None, None
    scope, _, value = line.partition("\t")
    return value, scope


def scope_flag(scope):
    """The `git config` option that writes over the value git uses."""
    return "--worktree" if scope == "worktree" else "--local"


def check_setup():
    value, scope = read_hooks_path()
    if value != HOOKS_PATH:
        found = f"'{value}' ({scope} scope)" if value else "not set"
        raise Failure([
            f"core.hooksPath is {found}: the git hooks of this checkout are not active. "
            f"Run: python3 scripts/conventions.py setup --fix "
            f"(or: git config {scope_flag(scope)} core.hooksPath {HOOKS_PATH})"
        ])
    return HOOKS_PATH


def fix_setup():
    """Set core.hooksPath at the scope git reads; return that scope, or None if nothing changed."""
    value, scope = read_hooks_path()
    changed = None
    if value != HOOKS_PATH:
        flag = scope_flag(scope)
        subprocess.run(["git", "config", flag, "core.hooksPath", HOOKS_PATH],
                       check=True, capture_output=True, text=True)
        changed = flag.lstrip("-")
    check_setup()
    return changed
