# Watcher

[![CI](https://github.com/mpanamar/watcher-automation/actions/workflows/ci.yml/badge.svg)](https://github.com/mpanamar/watcher-automation/actions/workflows/ci.yml)

Portfolio project for **Test Automation Engineer (JavaScript)**: a watch-identification quiz built as a real application with a deliberate **test pyramid** (unit → API contract → component). Identify the watch from a film still, confirm your guess, unlock a dossier with catalogue links, and move through a case queue.

The player UI uses the **salon** layout (Satoshi, split still + copy). The same styling lives in `mock-swiss/` as a static reference; the product app is `src/web/` and talks to Express over HTTP. The **admin** area uses the same visual language and signs in with **Supabase Auth**.

## Product

### Quiz (player)

- Film stills with multiple-choice options or free-text model name (seed catalog locally, or published rows from Supabase when server env is set).
- **Confirm** submits an ident; the UI shows **Correct** / **Incorrect** and hints on misses.
- Correct idents lock the case, open the dossier, and update the session score.
- Routes: `/` redirects to the first case; `/case/:id` for each still.
- Public API responses never include `answer`, `aliases`, or `hint`.
- No login required for the quiz.

### Admin

- Routes: `/admin/login`, `/admin`, `/admin/cases/new`, `/admin/cases/:id`.
- **Sign in** with Supabase Auth (`signInWithPassword`). The account email must appear in the `admins` allowlist table (RLS + `is_admin()` RPC).
- Users who are signed in but not on the allowlist see **Not an admin** with sign out.
- **Case list and form** read and write **`cases`** in Supabase (including drafts). Still images upload to the **`stills`** bucket at `{caseId}/{filename}`; the row stores that object key and the server resolves public URLs for the quiz.
- **Headline crop** on the case form: sliders for horizontal/vertical focus and zoom on the “Name the … watch” pill (stored as `inline_still_x/y/zoom`).
- Stricter **`caseSchema`** and migrations `20260320140000_case_validation.sql` (and later) align DB checks with Zod. Run all files in `supabase/migrations/` in order in the SQL editor.

### Supabase

- Migrations in `supabase/migrations/`: `cases`, `public_cases` view (no spoilers), `admins`, RLS, `stills` bucket, `is_admin()` for the browser client.
- Run migration SQL in the Supabase SQL editor, create an Auth user, and insert their email into `admins` (exact address, no trailing spaces).
- **Player catalog:** Express reads published `cases` with the **service role** when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set; otherwise it uses the seed fixture in `src/server/seed-cases.ts`. If keys are set but Supabase is down, the API returns **503** (no silent fallback to seed).

## Tech stack

| Layer | Tools |
|--------|--------|
| UI | Preact 10, preact-router, Vite 8 |
| API | Express 5, Zod (request/response validation) |
| Domain | TypeScript (`normalize` / `isMatch`, Zod `caseSchema`, in-memory session) |
| Data | Supabase Postgres + Storage (`@supabase/supabase-js` on server and in the admin UI) |
| Unit / API tests | Vitest (Node) |
| Component tests | Vitest + jsdom, Testing Library (Preact), MSW (quiz flows), Supabase client mock (admin) |
| E2E / a11y | Playwright in dependencies; `tests/e2e/` and `tests/a11y/` are placeholders |
| Tooling | `tsx`, `concurrently`, `wait-on`, TypeScript 7 |

## Project structure

```
src/
  domain/           # ident, caseSchema, case-mapper, session (pruneLocked)
  server/           # catalog port, seed-cases, still-url, load-env, createApp()
  web/              # Preact app (quiz + admin), watcher-api client, supabase.ts
    admin/          # login, gate (useAdminGate), list, form, Not an admin screen
supabase/
  migrations/       # schema + admin email / is_admin fixes
tests/
  unit/             # domain, mapper, still-url, migration smoke
  api/              # Express contract + catalog port (503, fresh reads)
  component/        # quiz (MSW) + admin (Supabase mock)
  e2e/              # (planned) Playwright
  a11y/             # (planned) axe in Playwright
mock-swiss/         # static salon reference UI (optional demo)
.env.example        # Supabase env var names (no secrets)
```

## Prerequisites

- **Node.js** 20+ (CI uses Node 22; LTS recommended locally)
- npm

## Setup

```bash
git clone https://github.com/mpanamar/watcher-automation.git
cd watcher-automation
npm install
```

Optional — Supabase-backed catalog and admin login:

1. Create a Supabase project and run migrations from `supabase/migrations/` in the SQL editor (in order).
2. Create an Auth user; add the same email to `public.admins`.
3. Copy `.env.example` → `.env` in the repo root and fill values from **Project Settings → API**:
   - **Project URL** → `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **Publishable key** → `VITE_SUPABASE_ANON_KEY`
   - **Secret key** → `SUPABASE_SERVICE_ROLE_KEY` (server only, never in Vite)
4. Restart `npm run dev` after changing `.env` (Vite reads `VITE_*` at startup).

Without `.env`, the API uses the five-case seed and admin login stays disabled until `VITE_SUPABASE_*` is set.

## Run locally

### Full app (API + UI) — recommended

Starts the API on port **3001** and Vite on **5173** (UI proxies `/api/*` to the API). Client HTTP code is `src/web/watcher-api.ts` (the Vite proxy must not treat that module as an API route). Vite loads `.env` from the **repository root** (`envDir` in `vite.config.ts`).

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`). Admin: `http://localhost:5173/admin/login`.

### API only

```bash
npm run dev:api
```

Base URL: `http://127.0.0.1:3001`. Loads `.env` from the repo root via `src/server/load-env.ts`.

### UI only

Requires the API on `3001` for quiz routes.

```bash
npm run dev:web
```

Admin UI needs `VITE_SUPABASE_*` for sign-in; quiz routes need the API.

### Static mock (reference UI, no backend)

Serves `mock-swiss/` (salon layout) on port **5174**:

```bash
npm run mock
```

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | Browser (Vite) | Supabase project URL for admin Auth |
| `VITE_SUPABASE_ANON_KEY` | Browser | Publishable key (safe in the client bundle) |
| `SUPABASE_URL` | Server only | Supabase project URL for catalog reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Secret key; never expose to the client |

See `.env.example`. Do not commit `.env`.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cases` | Public case list (no `answer`, `aliases`, or `hint`); `still` URLs are ready for `<img src>` |
| `GET` | `/api/cases/:id` | Single public case |
| `POST` | `/api/cases/:id/ident` | Body `{ "guess": "..." }` → correct + dossier or hint |
| `GET` | `/api/session` | `identified`, `total`, `locked`, `index` (locks pruned to current catalog) |

Session state is **in-memory** (one session per API process).

## Testing

| Layer | Command | What it checks |
|--------|---------|----------------|
| Unit | `npm run test:unit` | `normalize`, `isMatch`, schema, mapper, inline-still focus, session, still-url |
| API / contract | `npm run test:api` | Status codes, JSON shape, no spoilers, catalog 503, fresh reads |
| Component | `npm run test:component` | Quiz (MSW); admin Auth, save guards, Supabase mock save → list |
| All (CI-style) | `npm test` | Runs unit + API + component (68 tests) |

Watch mode for unit tests: `npm run test:unit:watch`.

Quiz component tests use **MSW** and do not require a live Express process. Admin component tests use a **Supabase client mock** (no live cloud in CI).

## Continuous integration

GitHub Actions workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on **push** and **pull requests** to `main` when app or test code changes (`src/`, `tests/`, Vitest/Vite/TS config, lockfile).

Three parallel jobs mirror the pyramid:

| Job | Command |
|-----|---------|
| Unit | `npm run test:unit` |
| API contract | `npm run test:api` |
| Component | `npm run test:component` |

Local equivalent: `npm test`. E2E is not in CI yet (sprint 4 deferred).

## Roadmap (honest)

| Area | Status |
|------|--------|
| Unit + API + component pyramid | **Implemented** |
| Supabase catalog on server (sprint 9) | **Implemented** |
| Admin Supabase Auth (sprint 10) | **Implemented** |
| Admin CRUD + stills upload (sprint 11) | **Implemented** |
| Playwright E2E / visual / a11y | Planned (`@playwright/test` installed, no `playwright.config.ts` yet) |

## Scripts reference

| Script | Action |
|--------|--------|
| `npm run dev` | API (`tsx watch`) + Vite after API is ready |
| `npm run dev:api` | Express on `:3001` |
| `npm run dev:web` | Vite Preact app on `:5173` |
| `npm run mock` | Static mock on `:5174` |
| `npm test` | Full unit + API + component suite |
| `npm run test:unit` | Vitest unit |
| `npm run test:api` | Vitest API config |
| `npm run test:component` | Vitest + jsdom (+ MSW for quiz) |

## Agent skills (Cursor)

| Skill | Purpose |
|--------|---------|
| `.cursor/skills/pre-commit-change-summary/` | Detailed narrative before committing |
| `.cursor/skills/post-commit-readme-sync/` | Refresh this README after commits |

## Repository

- Issues: https://github.com/mpanamar/watcher-automation/issues
- Home: https://github.com/mpanamar/watcher-automation#readme

## License

ISC
