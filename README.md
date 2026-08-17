# AI-Assisted Incident Management (APP-03)

Workshop-grade full-stack Incident Management system: Web Portal intake, local RBAC, configurable SLA tracking, in-app Central Alert Center, incident workflow, resolution/CSAT/reopen/closure, KPI dashboards, and append-only audit history.

Built with the AI-DLC workflow. Specs live in `.kiro/specs/incident-management/` (requirements, design, tasks).

## Stack

- Monorepo (npm workspaces): `packages/shared`, `apps/api`, `apps/web`
- Frontend: React 19 + Vite 6 + React Router 7 + TanStack Query
- Backend: Node.js 24 + Express 5 + zod + pino
- Data: PostgreSQL 18 (via `pg` + parameterized SQL) or in-memory backend
- Auth: local JWT (Bearer), scrypt salted password hashing, per-request RBAC
- Tests: Vitest + Supertest + React Testing Library

## Prerequisites

- Node.js 24 LTS + npm
- Docker Desktop (only for the PostgreSQL / full-container path)

## Install

```bash
npm install
```

## Run — Option A: local dev, no database (fastest)

One command runs both the API (in-memory backend) and the web app (pointed at the API via `apps/web/.env`):

```bash
npm run dev
# API: http://localhost:3001    Web: http://localhost:5173
```

Then open http://localhost:5173 and sign in with a demo user below.

Run individually if preferred:
```bash
npm run dev:api        # http://localhost:3001  (DATA_BACKEND defaults to memory)
npm run dev:web        # http://localhost:5173
```

Mock-only (no backend at all): set `VITE_DATA_MODE=mock` in `apps/web/.env`, then `npm run dev:web`.

## Run — Option B: full stack with PostgreSQL (Docker)

```bash
cp .env.example .env        # set JWT_SECRET
docker compose up -d --build
# web:  http://localhost:8080
# api:  http://localhost:3001/api/health
```
The API container runs migrations + seed automatically on start.

## Demo users

All workshop users share the password `Passw0rd!` (synthetic data only):

| Username | Role |
|---|---|
| emma | Business User |
| sam  | Service Desk |
| alex | Application Support |
| ivan | Infrastructure Support |
| mary | Manager |
| gary | Management |

## Test

```bash
npm run test               # all packages (57 tests)
npm run test -w @incident/api
npm run test -w @incident/web
npm run test -w @incident/shared
```

## Environment variables

See `.env.example`. Secrets (`JWT_SECRET`, DB creds, Bedrock keys) are read from the environment only and must never be committed. `VITE_*` values are bundled into the client — acceptable only for the workshop demo; in production the API key/secret must stay server-side.

## Deployment runbook

### Deploy (workshop / local)
1. `cp .env.example .env`, set `JWT_SECRET`.
2. `docker compose up -d --build`.
3. Verify: `curl http://localhost:3001/api/health` → `{"status":"ok"}`.
4. Open `http://localhost:8080`, log in as a demo user, submit an incident.

### Redeploy
1. `git pull`.
2. `docker compose build api web`.
3. `docker compose up -d`.
4. Apply pending migrations if any: `docker compose exec api npm run migrate -w @incident/api`.
5. Verify `/api/health`.

### Rollback
1. `git checkout <previous-tag>`.
2. `docker compose up -d --build`.
3. To revert a migration, apply its paired `*.down.sql` then redeploy.
4. Verify `/api/health` + a smoke login.

## Project layout

```
packages/shared   # domain types, constants, pure logic, synthetic fixtures
apps/api          # Express API (services, repositories memory|pg, migrations, seed)
apps/web          # React SPA (apiClient mock|http seam, pages, components)
docker-compose.yml
.kiro/specs/incident-management   # requirements / design / tasks
```

## Notes

- Mail, LINE OA, Phone/Quick Call and outbound notifications are documented integration boundaries (`design/integration.md`), not live channels in this workshop scope.
- AI classification uses a deterministic rules/keyword adapter by default; an optional Bedrock adapter is gated behind `AI_PROVIDER=bedrock` and falls back to rules.
