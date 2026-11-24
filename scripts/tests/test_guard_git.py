"""Tests for .claude/hooks/guard_git.py."""
import json
import subprocess
import sys
import unittest

from support import ROOT, make_repo, run_git

GUARD = ROOT / ".claude" / "hooks" / "guard_git.py"


class GuardHookTests(unittest.TestCase):
    def setUp(self):
        self.repo = make_repo(self)

    def run_hook(self, command, tool="Bash"):
        payload = {"tool_name": tool, "tool_input": {"command": command}, "cwd": str(self.repo)}
        proc = subprocess.run([sys.executable, str(GUARD)], input=json.dumps(payload), capture_output=True, text=True)
        return proc.returncode

    def test_blocked_on_main(self):
        for command in (
            "gh pr merge 12 --squash",
            "gh pr review 12 --approve",
            "gh api -X PUT repos/o/r/pulls/12/merge",
            "git push",
            "git push origin main",
            "git push origin HEAD:main",
            "git push --force origin feat/001-x",
            "git commit -m 'feat: x'",
            "git add . && git commit -m 'feat: x'",
            "git commit --no-verify -m 'feat: x'",
            "git checkout -b my-branch",
            "git switch -c feature/001-x",
            "git -C . merge feat/001-x",
            "cd apps && git push origin main",
        ):
            self.assertEqual(self.run_hook(command), 2, command)

    def test_allowed(self):
        for command in (
            "git status",
            "git checkout -b feat/012-back-record-weighing",
            "git switch -c spec/012-record-weighing",
            "git fetch origin main",
            "gh pr create --title 'spec: x' --body-file body.md",
            "gh issue view 12 --json title,body",
            "gh pr view 12",
            "cargo test",
            "echo 'git push origin main is forbidden' > /dev/null",
        ):
            self.assertEqual(self.run_hook(command), 0, command)

    def test_allowed_on_feature_branch(self):
        run_git(self.repo, "checkout", "-q", "-b", "feat/012-back-record-weighing")
        for command in (
            "git commit -m 'feat: x'",
            "git push -u origin feat/012-back-record-weighing",
            "git push",
            "git push --force-with-lease",
            "git rebase origin/main",
        ):
            self.assertEqual(self.run_hook(command), 0, command)
        self.assertEqual(self.run_hook("git push origin feat/012-back-record-weighing:main"), 2)

    def test_wrapped_commands_are_seen(self):
        for command in (
            "bash -c 'git push origin main'",
            'sh -c "gh pr merge 12"',
            "env git push origin main",
            "/usr/bin/git push origin main",
            "(git push origin main)",
            "echo $(git push origin main)",
            "echo `git push origin main`",
            "time git push origin main",
            "xargs git push origin main",
            "git \\\npush origin main",
            "eval 'gh pr merge 12'",
            "bash <<'E'\ngit push origin main\nE",
        ):
            self.assertEqual(self.run_hook(command), 2, command)

    def test_protected_branch_cannot_be_rewritten(self):
        for command in (
            "git update-ref refs/heads/main HEAD~1",
            "git branch -f main HEAD~1",
            "git branch -D main",
            "git branch -m main old",
            "git reset --hard HEAD~1",
            "git checkout -B main",
            "git push origin :main",
            "git push origin --delete main",
        ):
            self.assertEqual(self.run_hook(command), 2, command)

    def test_blocked_on_feature_branch(self):
        run_git(self.repo, "checkout", "-q", "-b", "feat/012-record-weighing")
        for command in (
            "git commit -nm 'feat: x'",
            "git commit -anm 'feat: x'",
            "git -c core.hooksPath=/dev/null commit -m 'feat: x'",
            "git config core.hooksPath /dev/null",
            "git config --local core.hooksPath ''",
            "git config --unset core.hooksPath",
            "git push -fu origin feat/012-record-weighing",
            "git push origin +feat/012-record-weighing",
            "git push origin HEAD:bad-name",
            "git switch --create=bad",
            "git checkout --orphan bad",
            "cd . && git push origin main",
        ):
            self.assertEqual(self.run_hook(command), 2, command)

    def test_gh_and_api_bypasses(self):
        for command in (
            "gh api graphql -f query='mutation { mergePullRequest(input:{pullRequestId:\"x\"}) { clientMutationId } }'",
            "gh alias set m 'pr merge'",
            "gh workflow run deploy.yml",
            "gh secret set TOKEN",
            "gh variable set X",
            "gh repo edit --enable-auto-merge",
            "gh pr edit 12 --base other",
            "gh ruleset list",
            "curl -X PUT https://api.github.com/repos/o/r/pulls/12/merge",
        ):
            self.assertEqual(self.run_hook(command), 2, command)

    def test_still_allowed(self):
        run_git(self.repo, "checkout", "-q", "-b", "feat/012-record-weighing")
        for command in (
            "git commit -m 'feat(api): add (weighing)'",
            "git commit -am 'feat: x'",
            "git config core.hooksPath .githooks",
            "git config user.name",
            "git merge origin/main",
            "git reset --hard HEAD~1",
            "git push origin HEAD:feat/012-record-weighing",
            "git push origin --delete feat/012-record-weighing",
            "git log --oneline origin/main..HEAD -- e2e/",
            "grep -rn git .",
            "cat <<'E' > notes.txt\ngit push origin main\nE",
            "gh pr edit 12 --body-file body.md",
            "gh issue comment 12 --body-file note.md",
            "gh pr comment 12 --body 'do not merge yet'",
            "gh api repos/o/r/pulls/12/comments",
            "curl https://api.github.com/repos/o/r/pulls/12",
            "python3 scripts/conventions.py branch",
        ):
            self.assertEqual(self.run_hook(command), 0, command)

    def test_unparsable_git_command_is_blocked(self):
        self.assertEqual(self.run_hook("git push origin \"main"), 2)
        self.assertEqual(self.run_hook("echo \"unterminated"), 0)

    def test_other_tools_ignored(self):
        self.assertEqual(self.run_hook("git push origin main", tool="Read"), 0)


if __name__ == "__main__":
    unittest.main()
