"""Local setup: the git hooks of the repository are the ones git runs."""
import subprocess

from .common import Failure


HOOKS_PATH = ".githooks"


def check_setup():
    proc = subprocess.run(["git", "config", "--get", "core.hooksPath"], capture_output=True, text=True)
    value = proc.stdout.strip()
    if value != HOOKS_PATH:
        found = f"'{value}'" if value else "not set"
        raise Failure([
            f"core.hooksPath is {found}: the git hooks are not active. "
            f"Run: git config core.hooksPath {HOOKS_PATH}"
        ])
    return HOOKS_PATH
