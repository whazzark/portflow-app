"""Tests for .claude/hooks/guard_edit.py."""
import json
import os
import subprocess
import sys
import unittest

from support import ROOT

GUARD = ROOT / ".claude" / "hooks" / "guard_edit.py"


class GuardEditTests(unittest.TestCase):
    def decision(self, path, tool="Edit", cwd="/repo"):
        payload = {"tool_name": tool, "tool_input": {"file_path": path}, "cwd": cwd}
        env = {k: v for k, v in os.environ.items() if k != "CLAUDE_PROJECT_DIR"}
        proc = subprocess.run([sys.executable, str(GUARD)], input=json.dumps(payload), capture_output=True, text=True, env=env)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        if not proc.stdout.strip():
            return None
        return json.loads(proc.stdout)["hookSpecificOutput"]["permissionDecision"]

    def test_frame_files_need_the_human(self):
        for path in (
            "/repo/.claude/settings.json",
            "/repo/.claude/settings.local.json",
            "/repo/.claude/hooks/guard_git.py",
            "/repo/.githooks/pre-commit",
            "/repo/scripts/conventions.py",
            "/repo/scripts/checks/specs.py",
            "/repo/.github/workflows/conventions.yml",
            "/repo/.github/CODEOWNERS",
            ".claude/hooks/guard_edit.py",
            "/repo/apps/../.githooks/pre-push",
        ):
            for tool in ("Edit", "Write"):
                self.assertEqual(self.decision(path, tool), "ask", path)

    def test_other_files_are_left_alone(self):
        for path in (
            "/repo/apps/api/src/main.rs",
            "/repo/specs/012-record-weighing/spec.md",
            "/repo/.claude/skills/spec/SKILL.md",
            "/repo/.claude/agents/qa-engineer.md",
            "/repo/scripts/tests/test_specs.py",
            "/repo/docs/workflow.md",
            "/elsewhere/.githooks/pre-commit",
        ):
            self.assertIsNone(self.decision(path), path)

    def test_other_tools_and_bad_input_are_ignored(self):
        self.assertIsNone(self.decision("/repo/.githooks/pre-commit", tool="Read"))
        proc = subprocess.run([sys.executable, str(GUARD)], input="not json", capture_output=True, text=True)
        self.assertEqual((proc.returncode, proc.stdout), (0, ""))


if __name__ == "__main__":
    unittest.main()
