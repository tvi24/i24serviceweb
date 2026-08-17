# Implementation

## Project structure (monorepo, npm workspaces)

```
incident-management/                 (repo root = workspace root)
├─ package.json                      # workspaces: apps/*, packages/*
├─ docker-compose.yml                # postgres + api + web (Phase 2)
├─ .env.example                      # documented env vars, no secrets
├─ .gitignore                        # ignores .env, node_modules, dist
├─ packages/
│  └─ shared/
│     ├─ package.json
│     └─ src/
│        ├─ types.ts
│        ├─ constants.ts             # roles, status transitions, defaults
│        └─ fixtures/                # synthetic seed (users, incidents...)
├─ apps/
│  ├─ api/
│  │  ├─ package.json
│  │  ├─ Dockerfile
│  │  ├─ src/
│  │  │  ├─ index.ts                 # bootstrap, graceful shutdown
│  │  │  ├─ app.ts                   # express app (mountable for tests)
│  │  │  ├─ config.ts                # env parsing (zod), no hard-coded secrets
│  │  │  ├─ routes/
│  │  │  ├─ middleware/
│  │  │  ├─ services/
│  │  │  ├─ repositories/{memory,pg}/
│  │  │  ├─ db/{pool.ts,migrate.ts,seed.ts}
│  │  │  ├─ migrations/*.sql
│  │  │  └─ lib/{logger.ts,slaClock.ts,ids.ts,crypto.ts}
│  │  └─ test/                       # vitest + supertest
│  └─ web/
│     ├─ package.json
│     ├─ Dockerfile
│     ├─ vite.config.ts
│     ├─ index.html
│     ├─ public/mocks/*.json         # Phase 1 mock data
│     └─ src/
│        ├─ main.tsx, App.tsx, router.tsx
│        ├─ styles/tokens.css        # design-token source of truth
│        ├─ api/apiClient.ts         # mock | http seam (VITE_DATA_MODE)
│        ├─ auth/AuthContext.tsx
│        ├─ hooks/, components/, pages/
│        └─ test/
```

## Build order (matches workspace policy)

1. **Setup** — root workspaces, shared package (types/constants/fixtures), tokens.css, design-system steering, base tooling (tsconfig, vite, vitest, lint). Verify web dev server boots.
2. **Core FE + mock** — apiClient in `mock` mode reading `public/mocks/*.json` (generated from shared fixtures). Build all pages/components with real interactions against mock. Verify every flow clicks through in the browser.
3. **Core FE + backend** — Express API + services + memory repo, then pg repo + migrations + seed + Docker Compose. Flip `VITE_DATA_MODE=http`. Verify end-to-end.
4. **Extras** — SLA clock, escalation, CSAT reminders, KPI charts polish.
5. **Test/Verify** — Vitest unit + Supertest API + RTL component tests for critical rules.
6. **Deploy** — Docker Compose runbook, redeploy/rollback docs.

## Configuration (env)

| Var | Used by | Notes |
|---|---|---|
| `VITE_DATA_MODE` | web | `mock` (Phase 1) or `http` (Phase 2) |
| `VITE_API_BASE_URL` | web | e.g. `http://localhost:3001/api` |
| `PORT` | api | default 3001 |
| `DATA_BACKEND` | api | `memory` or `pg` |
| `DATABASE_URL` | api | postgres connection string (Phase 2) |
| `JWT_SECRET` | api | from env/secret store, never committed |
| `JWT_EXPIRES_IN` | api | e.g. `8h` |
| `AI_PROVIDER` | api | `rules` (default) or `bedrock` |
| `BEDROCK_*` / `API_KEY` | api | only if AI_PROVIDER=bedrock; from env, never committed |
| `LOG_LEVEL` | api | pino level |

`.env.example` documents all keys with placeholder values. `.env` is gitignored. Secrets are read only from `process.env`.

## Key implementation notes

- **ticket_id**: `INC-<year>-<zero-padded sequence>`; sequence from a counter (memory: in-proc; pg: sequence/table).
- **Password hashing**: `crypto.scryptSync(password, salt, 64)`; compare with `timingSafeEqual`. Seed users get pre-hashed passwords in the seed script (documented workshop credentials, not committed as plaintext in code comments beyond the seed).
- **Repository seam**: services depend on interfaces (e.g. `IncidentsRepo`); a factory returns memory or pg impl based on `DATA_BACKEND`. Identical method contracts.
- **Frontend seam**: `apiClient` exposes typed functions; mock impl imports the same shared fixtures the memory repo uses, keeping Phase 1 and Phase 2 data shapes identical.
- **SLA clock**: single `setInterval` evaluator in api process; disabled in tests, invoked directly by unit tests.
- **Business-day math**: helper counts Mon–Fri from `started_at` for P3/P4 resolution targets.
