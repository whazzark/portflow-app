---
name: review
description: Run an independent code and security review on an existing code pull request, check its test report, and post the reports as comments. Never approves or merges. Use when the user runs /review with a PR number.
argument-hint: <pr-number>
disable-model-invocation: true
---

# /review <pr>

Run this in a fresh session, not in the one that wrote the code or the tests.

## 1. Preconditions

- `$ARGUMENTS` must be one pull request number. Otherwise stop and ask for it.
- `git status --porcelain` must be empty. Otherwise stop.
- `python3 scripts/conventions.py setup --fix` must pass: it activates the git hooks of
  this checkout, a worktree included. If not, stop and give the human what it prints.
- `gh pr view $ARGUMENTS --json number,title,body,headRefName,baseRefName,files,state`.
  Stop if the pull request is not open.
- `git fetch origin`, then `gh pr checkout $ARGUMENTS`.

## 2. Conventions

They are cheap, run them first. Write the body of the pull request to a temporary
file outside the repository, then:

- `python3 scripts/conventions.py pr --branch <headRefName> --title "<title>" --body-file <file>`
- `python3 scripts/conventions.py commits origin/main..HEAD`
- `python3 scripts/conventions.py paths --branch <headRefName>`
- `python3 scripts/conventions.py specs`, which also checks `test-report.md`
- on a `feat/` branch: `python3 scripts/conventions.py fr-coverage --branch <headRefName>`
  and `python3 scripts/conventions.py test-report --branch <headRefName>`

A failure is a blocker. Continue the review anyway.

## 3. According to the branch

- **`spec/` or `design/`**: stop here. Report the result of the conventions. The spec
  was already challenged and reviewed for security by `/spec`; the human reviews it.
- **`feat/`, `fix/`, `style/` or `chore/`**: continue.

## 4. Test report

For a pull request with a `test-report.md`: run the tests it lists and compare. A
line marked `pass` whose test fails or does not exist is a blocker. The tests were
written by `/develop` and `/test`; do not write new ones here.

## 5. Reviews

Launch in parallel, each with a fresh context. They only read:

- `code-reviewer` on the pull request;
- `security-reviewer` in diff-review mode.

Post each report as a separate comment with `gh pr comment`, titled with the agent
name. Do not use `gh pr review --approve` or `--request-changes`.

## 6. Summary

Post a last comment on the pull request. Its first line is `## Review summary`, its
second `Result: blockers` or `Result: no blocker`. Then: the blockers, each with its
file and line; what deserves the attention of the human during their own review;
what could not be verified.

Give the same summary to the human, and the next step:

- **Blockers**: `/develop <issue>` fixes them and drops the outdated test report, then
  `/test <issue>`, `/doc <issue>` to update the pull request, and `/review` again.
- **No blocker**: the human reviews and merges.

A clean agent review is not an approval.
