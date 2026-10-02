---
name: pre-commit-change-summary
description: >-
  Produces a detailed pre-commit narrative of implemented work by analyzing
  git status and diffs. Use when the user asks to commit, prepare a commit,
  write a commit message, summarize changes before push, or says they are
  about to commit.
---

# Pre-commit change summary

Before any `git add` / `git commit` (unless the user explicitly forbids analysis), produce a **detailed change summary** for the user. Do not skip this step when committing on the user's behalf.

## Workflow

1. **Collect evidence** (run in parallel when possible):
   - `git status` (untracked + modified)
   - `git diff` (unstaged)
   - `git diff --cached` (staged)
   - `git log -5 --oneline` (commit message tone)
   - If the branch diverged from main: `git diff main...HEAD` or `git log main..HEAD --oneline`

2. **Understand scope**
   - Include **every** commit that would land, not only the latest edit.
   - Group changes by concern (domain, API, UI, tests, config, docs).
   - Read files when the diff alone does not explain behavior (new modules, renamed paths, config).

3. **Verify** (when code changed):
   - Run relevant tests if reasonable (`npm test`, targeted scripts).
   - Note pass/fail in the summary. Do not commit if tests fail unless the user accepts that.

4. **Write the summary** using the template below. Use the **user's language** for the narrative unless they ask for English.

5. **Commit gate**
   - Show the full summary to the user first.
   - If they only asked for a summary, stop after the summary.
   - If they asked to commit: draft the commit message from the summary, then follow the repo git safety rules (no secrets, no `git config` changes, hooks respected).

## Summary template

```markdown
## Pre-commit summary

### Overview
[2–4 sentences: what this batch accomplishes end-to-end]

### Implemented
- **[Area]** — [concrete behavior or artifact; mention key files]
- **[Area]** — …

### User-visible / product behavior
- [What someone running the app or API would notice]

### Technical notes
- [Non-obvious fixes: proxy rules, typing, renamed modules, breaking changes]

### Files
| Path | Change |
|------|--------|
| `path` | added / modified / deleted — one-line purpose |

### Tests & verification
- [Commands run and result, or what was not run and why]

### Suggested commit message
```
<type>(<scope>): <subject line, imperative, ~72 chars>

<optional body: why, not a raw file list>
```

### Follow-ups (optional)
- [Only real next steps; omit if none]
```

## Quality bar

- **Specific**: name endpoints, components, test files, scripts — not "updated code".
- **Complete**: cover untracked files; call out deletions and renames.
- **Honest**: distinguish implemented vs. scaffolded vs. untested.
- **No filler**: skip sections that would be empty.

## Safety checks (always mention in summary if applicable)

- Warn if `.env`, credentials, `PLAN.md` (if project keeps it local), or `node_modules` appear in status.
- Do not propose committing secrets or local-only files the project treats as private.

## Commit message alignment

- Subject: **why** the change exists, not a bullet list of filenames.
- Match recent repo style from `git log`.
- Types: `feat`, `fix`, `test`, `refactor`, `chore`, `docs` as appropriate.

## Example (short)

**Situation:** Preact UI wired to Express; MSW component tests added.

**Overview excerpt:** Sprint 3 delivers the Watcher quiz UI on the real API with component tests mocking HTTP.

**Suggested commit message:**
```
feat(web): add Preact UI on API with component tests

Quiz flow uses proxied /api routes; MSW covers confirm, hint, and dossier paths.
```
