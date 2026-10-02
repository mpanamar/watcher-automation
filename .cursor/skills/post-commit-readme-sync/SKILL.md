---
name: post-commit-readme-sync
description: >-
  Refreshes README.md from the current codebase after commits so docs match
  implemented behavior, scripts, structure, and test layers. Use after a
  successful git commit when the user asks to update the readme, sync docs,
  or keep README current; also when finishing a sprint or feature that changed
  run/test commands or project layout.
---

# Post-commit README sync

Run **after** changes are committed (or when the user explicitly wants README updated). Keep `README.md` factual—derive content from the repo, not memory.

## When to run

- User committed (or asked you to commit) and wants docs current.
- User says: update readme, sync README, document the project.
- A sprint landed new scripts, folders, or test layers.

Do **not** replace local-only docs (e.g. `PLAN.md` if gitignored). Only maintain `README.md` unless the user names other files.

## Workflow

1. **Inspect the repo** (parallel where possible):
   - `package.json` — scripts, dependencies, name.
   - `src/` tree — domain, server, web.
   - `tests/` — unit, api, component, e2e, a11y placeholders.
   - `vite.config.ts`, `vitest*.config.ts`, `mock-swiss/` if present.
   - Recent commit(s): `git log -3 --oneline` and last diff if needed for "what changed" nuance.

2. **Reconcile README sections** (update in place; do not drop unrelated user prose without reason):

   | Section | Source of truth |
   |---------|-----------------|
   | Product / purpose | App behavior + domain |
   | Tech stack | `package.json` dependencies |
   | Project structure | Actual directories |
   | Prerequisites | Node version if specified; else "Node.js LTS" |
   | Install & run | Exact npm scripts |
   | API | `src/server/app.ts` routes |
   | Testing | Scripts + `tests/` layout |
   | Visual mock | `mock-swiss/` + `npm run mock` |
   | Roadmap / next | Only if repo has CI/E2E/playwright config; mark "planned" honestly |

3. **Write rules**
   - English for README unless the user requires another language.
   - Commands must be copy-pasteable (Windows-friendly where the project uses them).
   - List ports: API default `3001`, Vite default `5173`, mock `5174`.
   - Mention Vite `/api` proxy and that client HTTP code lives in `watcher-api.ts` (not a file named `api.ts` at web root).
   - Testing pyramid: state what **exists** vs **planned** (e.g. Playwright in deps but no `playwright.config.ts` yet → planned).

4. **Verify**
   - Scripts mentioned in README exist in `package.json`.
   - No references to removed paths or tools.

5. **Commit README** only if the user asked to commit doc updates. Otherwise show the diff summary.

## README skeleton

Use this outline; expand sections as the project grows:

```markdown
# Watcher

[One paragraph: quiz product + TAE portfolio intent]

## Product
[What the user does in the app]

## Tech stack
[Bulleted: Preact, Express, Zod, Vitest, MSW, Vite, Playwright (planned), TypeScript]

## Project structure
[ASCII tree of src/ and tests/]

## Prerequisites
## Setup
## Run locally
### Full app (API + UI)
### API only
### UI only
### Static mock (reference UI)

## API
[Method + path + short description]

## Testing
[Pyramid table + npm commands]

## Scripts reference
[Table: script → what it runs]

## Repository
[Link from package.json if set]
```

## Coordination with `pre-commit-change-summary`

- **Pre-commit skill**: narrative before commit.
- **This skill**: after commit, align README with the new reality.
- If both run in one session: commit code first, then refresh README; optional second commit `docs: sync README with …`.

## Quality bar

- Accurate > marketing.
- If unsure, read the file or run `npm run` with `--help` / inspect config—do not guess ports or script names.
