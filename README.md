# Watcher

[![CI](https://github.com/mpanamar/watcher-automation/actions/workflows/ci.yml/badge.svg)](https://github.com/mpanamar/watcher-automation/actions/workflows/ci.yml)

Portfolio project for **Test Automation Engineer (JavaScript)**: a watch-identification quiz built as a real application with a deliberate **test pyramid** (unit → API contract → component). Identify the watch from a film still, confirm your guess, unlock a dossier with catalogue links, and move through a case queue.

The player UI uses the **salon** layout (Satoshi, split still + copy). The same styling lives in `mock-swiss/` as a static reference; the product app is `src/web/` and talks to Express over HTTP. An **admin shell** (local-only for now) shares that visual language.

## Product

### Quiz (player)

- Three cases (film stills), multiple-choice options or free-text model name.
- **Confirm** submits an ident; the UI shows **Correct** / **Incorrect** and hints on misses.
- Correct idents lock the case, open the dossier, and update the session score.
- Routes: `/` redirects to the first case; `/case/:id` for each still.
- Public API responses never include `answer`, `aliases`, or `hint`.

### Admin (sprint 7 — no cloud yet)

- Routes: `/admin/login`, `/admin`, `/admin/cases/new`, `/admin/cases/:id`.
- Login validates non-empty email/password locally; **Supabase auth is planned** (sprint 10).
- Case list with empty state, locally saved cases (`sessionStorage`), and a static layout preview card.
- Case form mirrors the domain `caseSchema` (still preview, options, aliases, dossier fields, published).
- **Save** validates with Zod and shows **Saved locally** — no network calls yet.

### Supabase (sprint 8 — schema in repo)

- SQL migration: `supabase/migrations/` (`cases`, `public_cases` view without spoilers, `admins`, RLS, `stills` bucket policies).
- Copy `.env.example` → `.env` when you create a Supabase project; the **quiz API still uses the embedded catalog** until sprint 9.

## Tech stack

| Layer | Tools |
|--------|--------|
| UI | Preact 10, preact-router, Vite 8 |
| API | Express 5, Zod (request/response validation) |
| Domain | TypeScript modules (`normalize` / `isMatch`, cases catalog, in-memory session) |
| Unit / API tests | Vitest (Node) |
| Component tests | Vitest + jsdom, Testing Library (Preact), MSW (quiz flows only) |
| Database (planned) | Supabase Postgres + Storage; migration SQL in repo |
| E2E / a11y | Playwright in dependencies; `tests/e2e/` and `tests/a11y/` are placeholders |
| Tooling | `tsx`, `concurrently`, `wait-on`, TypeScript 7 |

## Project structure

```
src/
  domain/           # ident matching, Zod case schema, session lock/score
  server/           # createApp(), HTTP schemas, listen entry
  web/              # Preact app (quiz + admin), styles, stills, watcher-api client
    admin/          # login, case list, case form (local session + storage)
supabase/
  migrations/       # reproducible schema (cases, public_cases, admins, RLS, stills)
tests/
  unit/             # domain logic + migration smoke test
  api/              # Express contract tests (in-process server + fetch)
  component/        # quiz flows (MSW) + admin shell (no MSW)
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

Optional (later sprints): copy `.env.example` to `.env` and fill Supabase values after creating a project and running the migration in the SQL editor.

## Run locally

### Full app (API + UI) — recommended

Starts the API on port **3001** and Vite on **5173** (UI proxies `/api/*` to the API). Client HTTP code is `src/web/watcher-api.ts` (the Vite proxy must not treat that module as an API route).

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`). Admin: `http://localhost:5173/admin/login`.

### API only

```bash
npm run dev:api
```

Base URL: `http://127.0.0.1:3001`

### UI only

Requires the API to be running on `3001` for the quiz routes.

```bash
npm run dev:web
```

Admin routes work without the API (no fetch on `/admin/*`).

### Static mock (reference UI, no backend)

Serves `mock-swiss/` (salon layout) on port **5174**:

```bash
npm run mock
```

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | Browser (Vite) | Supabase project URL (sprint 10+) |
| `VITE_SUPABASE_ANON_KEY` | Browser | Anon key for admin auth (sprint 10+) |
| `SUPABASE_URL` | Server only | Catalog from Supabase (sprint 9+) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never expose to the client |

See `.env.example`. Without server Supabase vars, Express keeps using `src/domain/cases.ts`.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/cases` | Public case list (no `answer`, `aliases`, or `hint`) |
| `GET` | `/api/cases/:id` | Single public case |
| `POST` | `/api/cases/:id/ident` | Body `{ "guess": "..." }` → correct + dossier or hint |
| `GET` | `/api/session` | `identified`, `total`, `locked`, `index` |

Session state is **in-memory** (per server process).

## Testing

| Layer | Command | What it checks |
|--------|---------|----------------|
| Unit | `npm run test:unit` | `normalize`, `isMatch`, cases schema, session, Supabase migration file |
| API / contract | `npm run test:api` | Status codes, JSON shape, no spoilers in GET |
| Component | `npm run test:component` | Quiz: Confirm empty/wrong/correct, navigation, score, no admin fields on `/`; admin: login validation, save guards |
| All (CI-style) | `npm test` | Runs unit + API + component |

Watch mode for unit tests: `npm run test:unit:watch`.

Quiz component tests use **MSW** and do not require a live Express process. Admin component tests use local routes only.

## Continuous integration

GitHub Actions workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on **push** and **pull requests** to `main` when app or test code changes (`src/`, `tests/`, Vitest/Vite/TS config, lockfile).

Three parallel jobs mirror the pyramid:

| Job | Command |
|-----|---------|
| Unit | `npm run test:unit` |
| API contract | `npm run test:api` |
| Component | `npm run test:component` |

Local equivalent: `npm test`. E2E is not in CI yet (Sprint 4 deferred).

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
