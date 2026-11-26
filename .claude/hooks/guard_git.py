#!/usr/bin/env python3
"""Claude Code PreToolUse hook for the Bash tool.

Blocks the git and gh commands that would let an agent bypass a human gate:
merging or approving pull requests, pushing to or rewriting the protected branch,
force pushing, committing on the protected branch, skipping or disabling hooks,
creating branches that do not follow the naming convention, starting workflows and
changing repository settings.

git and gh are looked for anywhere in the command: behind a wrapper (env, time,
xargs, an absolute path), in a subshell or a command substitution, in the argument
of `bash -c` or `eval`, and in a here-document fed to a shell. A git or gh command
that cannot be parsed is blocked.

Exit code 2 blocks the tool call and returns stderr to the agent.
This is a guard against mistakes in Claude Code sessions of this repository, not a
security boundary. The real lock is branch protection on GitHub.
"""
import json
import os
import re
import shlex
import subprocess
import sys

PROTECTED = {"main"}
HOOKS_PATH = ".githooks"
# <type>/<NNN>-<slug>: the issue number is padded to three digits (012), as in scripts/conventions.py.
BRANCH_RE = re.compile(r"^(spec|design|feat|fix|chore|docs|style)/(?:(?!000)\d{3}|[1-9]\d{3,})-[a-z0-9]+(-[a-z0-9]+)*$")
GIT_OPTIONS_WITH_VALUE = {"-C", "-c", "--git-dir", "--work-tree", "--namespace"}
SHELLS = {"bash", "sh", "zsh", "dash", "ksh"}
TOOL_WORD_RE = re.compile(r"\b(git|gh)\b")
HEREDOC_RE = re.compile(r"<<-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1")
GITHUB_API_WRITE_RE = re.compile(r"/merges?\b|protection|rulesets|/dispatches\b|/actions/(secrets|variables)", re.I)
GRAPHQL_WRITE_RE = re.compile(r"merge|approve|protection|ruleset", re.I)
MAX_DEPTH = 5


class Unparsable(Exception):
    pass


def current_branch(cwd):
    try:
        out = subprocess.run(
            ["git", "symbolic-ref", "--short", "-q", "HEAD"],
            cwd=cwd or None, capture_output=True, text=True, timeout=5,
        )
        return out.stdout.strip()
    except Exception:
        return ""


def strip_heredocs(command):
    """Drop the body of here-documents, unless it is fed to a shell (then it is code)."""
    out, lines, i = [], command.split("\n"), 0
    while i < len(lines):
        line = lines[i]
        out.append(line)
        match = None if "<<<" in line else HEREDOC_RE.search(line)
        i += 1
        if not match:
            continue
        first = os.path.basename((line.strip().split() or [""])[0])
        body = []
        while i < len(lines) and lines[i].strip() != match.group(2):
            body.append(lines[i])
            i += 1
        i += 1  # the terminator line
        if first in SHELLS:
            out.extend(body)
    return "\n".join(out)


def split_commands(command):
    """Split on the shell operators that are outside quotes."""
    parts, buf, quote, i = [], [], None, 0
    while i < len(command):
        ch = command[i]
        if quote:
            buf.append(ch)
            if ch == "\\" and quote == '"' and i + 1 < len(command):
                buf.append(command[i + 1])
                i += 1
            elif ch == quote:
                quote = None
        elif ch == "\\" and i + 1 < len(command):
            buf.extend((ch, command[i + 1]))
            i += 1
        elif ch in ("'", '"'):
            quote = ch
            buf.append(ch)
        elif ch in ";|&\n()`" or command.startswith("$(", i):
            parts.append("".join(buf))
            buf = []
            if command.startswith("$(", i):
                i += 1
        else:
            buf.append(ch)
        i += 1
    parts.append("".join(buf))
    return [p.strip() for p in parts if p.strip()]


def tokens_of(segment):
    try:
        return shlex.split(segment)
    except ValueError:
        if TOOL_WORD_RE.search(segment):
            raise Unparsable(segment)
        return []


def find_tool(tokens):
    """Index and name of the first git or gh word, whatever comes before it."""
    for i, token in enumerate(tokens):
        name = os.path.basename(token)
        if name in ("git", "gh"):
            return i, name
    return None, None


def git_invocation(tokens):
    """Return (subcommand, args, -C directory, -c settings) of a git invocation."""
    directory, settings, i = None, [], 1
    while i < len(tokens):
        tok = tokens[i]
        if tok in GIT_OPTIONS_WITH_VALUE:
            value = tokens[i + 1] if i + 1 < len(tokens) else ""
            if tok == "-C":
                directory = value
            elif tok == "-c":
                settings.append(value)
            i += 2
        elif tok.startswith("-"):
            i += 1
        else:
            return tok, tokens[i + 1:], directory, settings
    return None, [], directory, settings


def short_flags(args):
    """Letters given as short options: -fu gives 'f' and 'u'."""
    return {letter for a in args if re.match(r"^-[A-Za-z]+$", a) for letter in a[1:]}


def option_value(args, names):
    """Value of the first of the given options, written '--opt value' or '--opt=value'."""
    for i, arg in enumerate(args):
        if arg in names and i + 1 < len(args):
            return args[i + 1]
        for name in names:
            if name.startswith("--") and arg.startswith(name + "="):
                return arg.split("=", 1)[1]
    return None


def bare(ref):
    return ref.lstrip("+").removeprefix("refs/heads/")


def check_gh(tokens):
    rest = tokens[1:]
    joined = " ".join(rest)
    if rest[:2] == ["pr", "merge"]:
        return "merging a pull request is a human gate: only the repository owner merges"
    if rest[:2] == ["pr", "review"] and any(t in ("--approve", "-a") for t in rest):
        return "approving a pull request is a human gate"
    if rest[:2] == ["pr", "edit"] and any(t in ("--base", "-B") or t.startswith("--base=") for t in rest):
        return "changing the base branch of a pull request is not allowed"
    if rest[:1] == ["api"]:
        if GITHUB_API_WRITE_RE.search(joined):
            return "merging, protection, rulesets, workflow dispatch and secrets are not allowed through the API"
        if "graphql" in rest and GRAPHQL_WRITE_RE.search(joined):
            return "merging, approving and protection changes are not allowed through GraphQL"
    if rest[:1] == ["alias"]:
        return "gh aliases are not allowed: they hide the command that is run"
    if rest[:1] == ["workflow"] and rest[1:2] and rest[1] in ("run", "enable", "disable"):
        return "starting or switching a workflow is a human decision (deployment is started by a human)"
    if rest[:1] == ["secret"] or (rest[:1] == ["variable"] and rest[1:2] and rest[1] in ("set", "delete")):
        return "secrets and variables are handled by a human"
    if rest[:1] == ["ruleset"]:
        return "rulesets and branch protection are handled by a human"
    if rest[:1] == ["repo"] and rest[1:2] and rest[1] in ("delete", "edit", "rename", "archive", "unarchive"):
        return "changing or deleting the repository is not allowed"
    return None


def check_git(tokens, cwd):
    sub, args, directory, settings = git_invocation(tokens)
    if any(s.split("=", 1)[0].lower() == "core.hookspath" for s in settings):
        return "overriding core.hooksPath is not allowed: fix what the hook reports instead"
    if sub is None:
        return None
    if directory:
        cwd = os.path.join(cwd, directory)
    flags = short_flags(args)
    positional = [a for a in args if not a.startswith("-")]

    if "--no-verify" in args or (sub == "commit" and "n" in flags):
        return "--no-verify is not allowed: fix what the hook reports instead"
    if sub == "config" and any(a.lower() == "core.hookspath" for a in positional):
        key = next(i for i, a in enumerate(positional) if a.lower() == "core.hookspath")
        value = positional[key + 1] if key + 1 < len(positional) else None
        if any(a.startswith("--unset") for a in args) or (value is not None and value != HOOKS_PATH):
            return f"core.hooksPath must stay '{HOOKS_PATH}'"

    branch = current_branch(cwd)

    if sub == "push":
        if "f" in flags or any(a in ("--force", "--mirror", "--all") or a.startswith("--force=") for a in args):
            return "force pushing, --all and --mirror are not allowed (use --force-with-lease on your own branch)"
        refspecs = positional[1:]
        for ref in refspecs:
            if ref.startswith("+"):
                return "a '+' refspec is a force push: not allowed"
            target = bare(ref.split(":")[-1])
            if target in PROTECTED:
                return f"pushing to '{target}' is not allowed: open a pull request"
            if ":" in ref and target and not target.startswith("refs/") and not BRANCH_RE.match(target):
                return f"remote branch '{target}' does not match <type>/<NNN>-<slug>"
        if not refspecs and branch in PROTECTED:
            return f"pushing '{branch}' is not allowed: open a pull request"

    if sub in ("commit", "merge", "cherry-pick", "revert", "rebase", "am", "pull") and branch in PROTECTED:
        return f"'{branch}' is protected: create a branch named <type>/<NNN>-<slug> first"
    if sub == "reset" and "--hard" in args and branch in PROTECTED:
        return f"'{branch}' is protected: it is not reset"
    if sub == "update-ref" and any(bare(a) in PROTECTED for a in positional):
        return "rewriting the protected branch is not allowed"
    if sub == "branch":
        rewriting = flags & set("fDdmMcC") or any(
            a in ("--force", "--delete", "--move", "--copy") for a in args)
        if rewriting and any(a in PROTECTED for a in positional):
            return "moving, deleting or renaming the protected branch is not allowed"

    new_branch = None
    if sub in ("checkout", "switch"):
        new_branch = option_value(args, ("-b", "-B", "-c", "-C", "--create", "--force-create", "--orphan"))
    elif sub == "branch":
        listing = flags & set("dDmMlar") or any(a in ("--delete", "--move", "--list") for a in args)
        if positional and not listing:
            new_branch = positional[0]
    elif sub == "worktree" and args[:1] == ["add"]:
        new_branch = option_value(args, ("-b", "-B"))
    if new_branch and not BRANCH_RE.match(new_branch):
        return (
            f"branch '{new_branch}' does not match <type>/<NNN>-<slug> (NNN: issue number padded to three digits) "
            "(types: spec, design, feat, fix, chore, docs, style)"
        )
    return None


def check_command(command, cwd, depth=0):
    """Return the reason to block the command, or None."""
    if depth > MAX_DEPTH:
        return None
    command = strip_heredocs(command.replace("\\\n", " "))
    for segment in split_commands(command):
        tokens = tokens_of(segment)
        while tokens and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", tokens[0]):
            tokens = tokens[1:]
        if not tokens:
            continue
        first = os.path.basename(tokens[0])
        if first == "cd" and len(tokens) > 1:
            cwd = os.path.join(cwd, tokens[1])
            continue

        nested = []
        if first == "eval":
            nested.append(" ".join(tokens[1:]))
        elif first in SHELLS:
            nested.extend(t for t in tokens[1:] if not t.startswith("-"))
        # Substitutions inside double quotes are still executed.
        nested.extend(re.sub(r"\$\(|[`)]", ";", t) for t in tokens if "$(" in t or "`" in t)
        for text in nested:
            reason = check_command(text, cwd, depth + 1)
            if reason:
                return reason

        if first in ("curl", "wget") and "api.github.com" in segment and GITHUB_API_WRITE_RE.search(segment):
            return "merging, protection, rulesets, workflow dispatch and secrets are not allowed through the API"

        index, tool = find_tool(tokens)
        if tool == "gh":
            reason = check_gh(tokens[index:])
        elif tool == "git":
            reason = check_git(tokens[index:], cwd)
        else:
            reason = None
        if reason:
            return reason
    return None


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0
    if payload.get("tool_name") != "Bash":
        return 0
    command = (payload.get("tool_input") or {}).get("command") or ""
    cwd = payload.get("cwd") or ""
    try:
        reason = check_command(command, cwd)
    except Unparsable:
        reason = "this git or gh command could not be parsed: write it more simply"
    except Exception as error:  # a guard that crashes must not let a git command through
        reason = f"internal error ({error})" if TOOL_WORD_RE.search(command) else None
    if reason:
        print(f"Blocked by .claude/hooks/guard_git.py: {reason}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
