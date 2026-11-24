#!/usr/bin/env python3
"""Repository convention checks: command line. Standard library only.

The rules written in docs/conventions.md are enforced by the modules of
scripts/checks/, and this script is run by the git hooks, by the Claude Code skills
and by CI. The rules it does not check are marked "(not checked)" on that page.

Usage:
  conventions.py branch [NAME]
  conventions.py commit-msg FILE
  conventions.py commits RANGE
  conventions.py pr --branch NAME --title TITLE --body-file FILE [--template FILE]
  conventions.py specs [--root DIR]
  conventions.py spec-approved (--issue N | --branch NAME) [--ref REF]
  conventions.py design-approved (--issue N | --branch NAME) [--ref REF]
  conventions.py fr-coverage (--issue N | --branch NAME) [--dirs DIR ...]
  conventions.py test-report (--issue N | --branch NAME)
  conventions.py paths [--branch NAME] [--base REF]
  conventions.py setup
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from checks.branches import PROTECTED_BRANCHES, parse_branch
from checks.commits import check_commit_msg, check_commits
from checks.common import Failure, git
from checks.coverage import DEFAULT_TEST_DIRS, check_fr_coverage
from checks.gates import check_design_approved, check_spec_approved
from checks.paths import changed_files, check_paths
from checks.pull_requests import check_pr
from checks.setup import check_setup
from checks.specs import check_specs, check_test_report_present


PR_TEMPLATE = ".github/pull_request_template.md"


def issue_from_args(args):
    if args.issue is not None:
        return args.issue
    return parse_branch(args.branch)[1]


def build_parser():
    parser = argparse.ArgumentParser(description="Repository convention checks")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("branch", help="check a branch name")
    p.add_argument("name", nargs="?")

    p = sub.add_parser("commit-msg", help="check a commit message file")
    p.add_argument("file")

    p = sub.add_parser("commits", help="check commit headers in a revision range")
    p.add_argument("range")

    p = sub.add_parser("pr", help="check a pull request title and body")
    p.add_argument("--branch", required=True)
    p.add_argument("--title", required=True)
    p.add_argument("--body-file", required=True)
    p.add_argument("--template", default=PR_TEMPLATE,
                   help="pull request template whose checklist must be kept (skipped when missing)")

    p = sub.add_parser("specs", help="validate every spec in specs/")
    p.add_argument("--root", default=".")

    for name, text in (("spec-approved", "spec gate"), ("design-approved", "design gate")):
        p = sub.add_parser(name, help=f"check the {text} on a git ref")
        group = p.add_mutually_exclusive_group(required=True)
        group.add_argument("--issue", type=int)
        group.add_argument("--branch")
        p.add_argument("--ref", default="origin/main")

    p = sub.add_parser("fr-coverage", help="check that every functional requirement has a test")
    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument("--issue", type=int)
    group.add_argument("--branch")
    p.add_argument("--root", default=".")
    p.add_argument("--dirs", nargs="+", default=list(DEFAULT_TEST_DIRS))

    p = sub.add_parser("test-report", help="check that the test report of an issue exists")
    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument("--issue", type=int)
    group.add_argument("--branch")
    p.add_argument("--root", default=".")

    p = sub.add_parser("paths", help="check that the branch changes only what its type allows")
    p.add_argument("--branch")
    p.add_argument("--base", default="origin/main")

    sub.add_parser("setup", help="check that the git hooks of the repository are active")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        if args.command == "branch":
            name = args.name or git("rev-parse", "--abbrev-ref", "HEAD").strip()
            if name in PROTECTED_BRANCHES:
                print(f"ok: '{name}' is the protected branch")
            else:
                parse_branch(name)
                print(f"ok: branch '{name}'")
        elif args.command == "commit-msg":
            check_commit_msg(args.file)
        elif args.command == "commits":
            check_commits(args.range)
            print("ok: commit headers")
        elif args.command == "pr":
            body = Path(args.body_file).read_text(encoding="utf-8")
            template = Path(args.template)
            check_pr(args.branch, args.title, body,
                     template.read_text(encoding="utf-8") if template.is_file() else None)
            print("ok: pull request title and body")
        elif args.command == "specs":
            check_specs(args.root)
            print("ok: specs")
        elif args.command == "spec-approved":
            print(f"ok: spec gate passed ({check_spec_approved(issue_from_args(args), args.ref)})")
        elif args.command == "design-approved":
            print(f"ok: design gate passed ({check_design_approved(issue_from_args(args), args.ref)})")
        elif args.command == "fr-coverage":
            issue = issue_from_args(args)
            ids = check_fr_coverage(args.root, issue, args.dirs)
            print(f"ok: {len(ids)} functional requirements of #{issue} are covered by tests")
        elif args.command == "paths":
            branch = args.branch or git("rev-parse", "--abbrev-ref", "HEAD").strip()
            count = check_paths(branch, changed_files(args.base))
            print(f"ok: {count} changed file(s) allowed on '{branch}'")
        elif args.command == "setup":
            print(f"ok: git hooks active ({check_setup()})")
        elif args.command == "test-report":
            print(f"ok: {check_test_report_present(args.root, issue_from_args(args))}")
    except Failure as failure:
        for problem in failure.problems:
            print(f"error: {problem}", file=sys.stderr)
        return 1
    except OSError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
