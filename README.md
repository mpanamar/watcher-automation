# Watcher

Portfolio project for **Test Automation Engineer (JavaScript)**: a small watch-identification quiz built as a real application with a deliberate **test pyramid** (unit → API contract → component). Identify the watch from a film still, confirm your guess, unlock a dossier with catalogue links, and move through a case queue.

The Swiss-minimal visual reference lives in `mock-swiss/`; the product UI is in `src/web/` and talks to Express over HTTP.

## Product

- Three cases (film stills), multiple-choice options or free-text model name.
- **Confirm** submits an ident; the UI shows **Correct** / **Incorrect** and hints on misses.
- Correct idents lock the case, open the dossier, and update the session score.
- Routes: `/` redirects to the first case; `/case/:id` for each still.

## Tech stack

| Layer | Tools |
|--------|--------|
| UI | Preact 10, preact-router, Vite 8 |
| API | Express 5, Zod (request/response validation) |
| Domain | TypeScript modules (`normalize` / `isMatch`, cases catalog, in-memory session) |
| Unit / API tests | Vitest (Node) |
| Component tests | Vitest + jsdom, Testing Library (Preact), MSW |
| E2E / a11y | Playwright listed in dependencies; configs under `tests/e2e/` and `tests/a11y/` are placeholders for the next sprint |
| Tooling | `tsx`, `concurrently`, `wait-on`, TypeScript 7 |

## Project structure

```
src/
  domain/           # ident matching, Zod case schema, session lock/score
  server/           # createApp(), HTTP schemas, listen entry
  web/              # Preact app (App, CaseScreen), styles, stills, watcher-api client
tests/
  unit/             # domain logic
  api/              # Express contract tests (in-process server + fetch)
  component/        # UI flows with MSW
  e2e/              # (planned) Playwright
  a11y/             # (planned) axe in Playwright
mock-swiss/         # static HTML/CSS/JS visual reference (optional demo)
```

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- npm

## Setup

```bash
git clone https://github.com/mpanamar/watcher-automation.git
cd watcher-automation
npm install
```

## Run locally

### Full app (API + UI) — recommended

Starts the API on port **3001** and Vite on **5173** (UI proxies `/api/*` to the API).

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`).

### API only

```bash
npm run dev:api
```

Base URL: `http://127.0.0.1:3001`

### UI only

Requires the API to be running on `3001`.

```bash
npm run dev:web
```

### Static mock (reference UI, no backend)

Serves `mock-swiss/` on port **5174**:

```bash
npm run mock
```

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
| Unit | `npm run test:unit` | `normalize`, `isMatch`, cases schema, session |
| API / contract | `npm run test:api` | Status codes, JSON shape, no spoilers in GET |
| Component | `npm run test:component` | Confirm empty/wrong/correct, navigation, score |
| All (CI-style) | `npm test` | Runs unit + API + component |

Watch mode for unit tests: `npm run test:unit:watch`.

Component tests use **MSW** so they do not require a live Express process.

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
| `npm run test:component` | Vitest + jsdom + MSW |

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
