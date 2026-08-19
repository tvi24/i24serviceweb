# Audit — incident-management

### [2026-08-17] requirements: generation
- Phase: requirements
- Action: generated requirements.md (15 groups, 111 EARS criteria) + .config.kiro
- Artifacts: .kiro/specs/incident-management/requirements.md
- Outcome: approved

### [2026-08-17] design: decision-gate
- Phase: design
- Action: D3 decision gate (12 questions); user "done" with blanks -> accepted recommendations; no conflicts
- Artifacts: .aidlc/workflow/incident-management/decisions-design.md
- Outcome: resolved

### [2026-08-17] design: generation
- Phase: design
- Action: generated modular design (design.md + 8 design/*.md) + design-system.md steering; resolved versions
- Artifacts: .kiro/specs/incident-management/design.md, design/*, .kiro/steering/design-system.md
- Outcome: draft, pending approval

### [2026-08-17] implement: Group 1 (Setup)
- Phase: implement
- Action: monorepo scaffold (root workspaces, shared types/constants/logic/fixtures, web app + tokens + AppShell), installed Node 24.19.0 via winget + deps
- Artifacts: package.json, packages/shared/*, apps/web/*, tsconfig.base.json, .env.example, .gitignore
- Outcome: verified — shared 6/6 tests, web 1/1 test, `npm run dev` serves HTTP 200, Vite compiles cleanly

### [2026-08-17] implement: Group 2 (Core Frontend + Mock)
- Phase: implement
- Action: built mock in-memory backend + apiClient seam, AuthContext/login, UI kit, all 8 pages (intake, my incidents, control tower, workspace, alert center, dashboard, sla config), responsive AppShell
- Artifacts: apps/web/src/api/*, auth/*, components/*, hooks/*, pages/*
- Outcome: verified — web 9/9 tests (incl. full lifecycle: create→triage→assign→note→resolve→confirm→close, RBAC, illegal-transition, CSAT range, reopen), tsc clean, production build clean, dev server HTTP 200
- Note: mock implemented as in-memory backend seeded from shared fixtures (supersedes static public/mocks JSON) — same contract as Phase 2 HTTP client

### [2026-08-17] implement: Group 3 (Backend + PostgreSQL)
- Phase: implement
- Action: built Express 5 API (config, logger, errors, crypto, JWT auth, RBAC middleware, validate, all services, routes, health, graceful shutdown), repository interface with memory + pg impls, migrations (up/down), seed, docker-compose + Dockerfiles; wired web http mode
- Artifacts: apps/api/**, docker-compose.yml, apps/web/Dockerfile, apps/web/nginx.conf
- Outcome: verified (memory) — API tsc clean, 12/12 Supertest pass, live HTTP round-trip (health/login/RBAC/intake INC-2026-001007), web http-mode build clean
- Blocked: PostgreSQL live verification — Docker Desktop engine did not start in this session; pg repo/migrations/seed/compose are code-complete + type-checked but not run against a live DB

### [2026-08-17] implement: Group 4 (Extras)
- Phase: implement
- Action: maintenanceService (auto-close past grace + CSAT reminders up to max) wired into clock; dashboard refresh control; privacy hardening (minimal request logging serializers, secret redaction, user field stripping, reporter brief scoping)
- Artifacts: apps/api/src/services/maintenanceService.ts, lib/slaClock.ts, app.ts, apps/web/src/pages/DashboardPage.tsx, apps/api/test/maintenance.test.ts
- Outcome: verified — API 15/15 tests, web 9/9, tsc clean both

### [2026-08-17] implement: Group 5 (Test / Verify)
- Phase: implement
- Action: added shared rules tests (9-combo priority matrix, routing/fallback, SLA targets, status map, default config), API fallback/reopen tests, web CsatForm + state component tests, requirement coverage map
- Artifacts: packages/shared/src/rules.test.ts, apps/api/test/api.test.ts (+), apps/api/test/coverage-map.md, apps/web/src/test/components.test.tsx
- Outcome: verified — full suite 57 tests pass (shared 25, api 18, web 14); root build clean

### [2026-08-17] implement: Group 6 (Deploy)
- Phase: implement
- Action: README with run instructions + deploy/redeploy/rollback runbook; fixed api start script to tsx; fixed shared build to exclude test files (+ vitest scope to src); validated docker-compose config
- Artifacts: README.md, apps/api/package.json, apps/api/Dockerfile, packages/shared/tsconfig.json, packages/shared/vitest.config.ts
- Outcome: verified — `docker compose config` valid; root build clean; full suite 57 tests pass (shared 25, api 18, web 14)

## Deployment evidence (workshop)
- Health: `GET /api/health` returns `{status:"ok"}` (verified live, memory backend).
- Smoke login: `POST /api/auth/login` (sam/emma) returns JWT + roles (verified live).
- RBAC: business_user 403 on control-tower list and KPI; support/manager allowed (verified).
- Intake: created ticket `INC-2026-001007` over live HTTP (verified).
- Seed data: 6 synthetic users + 6 incidents across P1–P4/statuses (fixtures).
- docker-compose.yml validated via `docker compose config` (syntax OK). Full container run + PostgreSQL round-trip pending a running Docker engine (unavailable this session).

### [2026-08-17] change-request: Add-on Theme & Localization
- Phase: implement (post-delivery change request)
- Action: user requested Dark/Light theme toggle + TH/EN localization (enterprise best practice) after UX testing; confirmed both features + lightweight (zero-dep) approach, light default, browser-detected language w/ EN fallback, proposed dark palette approved
- Spec refinement (under `Add-on` headings): requirements.md (R16 Theme, R17 Localization), design/components.md (Theme & Localization), tasks.md (Add-on Group A)
- Artifacts: .kiro/specs/incident-management/requirements.md, design/components.md, tasks.md, .kiro/steering/design-system.md
- Outcome: specs refined and approved; implementation follows

### [2026-08-17] bugfix + env findings: live PostgreSQL verification attempt
- Trigger: user asked to run `docker compose` and fix to reach the live pg round-trip goal.
- Environment blockers (not code):
  - Docker Desktop engine will not start — **WSL2 is not installed** (`wsl --status` → not installed). Docker's `desktop-linux` engine depends on WSL2; installing it needs admin + reboot, so it was not done unilaterally.
  - Portable PostgreSQL fallback (EDB 17.6 binaries zip, 314MB) could not be downloaded — every method (Invoke-WebRequest, curl, BITS) truncated at 57–196MB, consistent with antivirus/egress interruption of large binaries.
- **Bug found & fixed (would break the pg path on first `seed`):** `apps/api/src/migrations/001_init.sql` declared all id / `*_id` columns as `uuid`, but application IDs are opaque strings (`u-emma`, `i-1001`, `a-1`, `al-1`, …). Against real PostgreSQL, `npm run seed` would fail with `invalid input syntax for type uuid`. In-memory backend is untyped JS so all 57 tests passed, masking it. Fixed by changing those columns to `text` (runtime `randomUUID()` IDs remain valid text). FKs adjusted to match. `pg.ts` INSERT/UPDATE column lists + param counts statically cross-checked against the schema — consistent.
- Verified after fix: full suite 57/57 green (shared 25, api 18, web 14). Live pg round-trip still pending an environment with WSL2/Docker or a local PostgreSQL.
- To verify live (either path):
  - Docker: `wsl --install` (admin + reboot) → `docker compose up -d --build` → open http://localhost:8080, check `GET /api/health`.
  - Local PG: install/run PostgreSQL, create db `incident`, set `DATABASE_URL` + `DATA_BACKEND=pg` + `JWT_SECRET`, then `npm run migrate -w apps/api` && `npm run seed -w apps/api` && `npm run dev:api`.

### [2026-08-17] LIVE-VERIFIED: PostgreSQL round-trip (portable PG, no Docker)
- WSL2 install not possible on this domain machine (UAC elevation not granted). Pivoted to a portable PostgreSQL 17.6 (EDB binaries zip) run locally — no admin, no Docker. Earlier download truncations were the foreground tool timeout, not AV: re-ran the 314MB download as a background process → completed.
- Steps executed: extract binaries → `initdb` (superuser `incident`, trust) → start `postgres -p 5432` → `createdb incident` → `npm run migrate -w apps/api` (10 tables created) → `npm run seed -w apps/api` (users 6, incidents 6, activities 5, alerts 3, audit 3) → API `DATA_BACKEND=pg` on :3005.
- Live HTTP round-trip against pg: `/health` `{db:ok}`; JWT login (users from pg); `/incidents` RBAC list = 6; intake write → `INC-2026-001007` persisted, `ticket_seq` 1006→1007, `audit_events` 3→8.
- Confirms the `uuid`→`text` migration fix end-to-end. tasks 3.11 / 3.12 pg-verification gap is now closed. Only remaining unverified item: a full `docker compose up` container run (needs WSL2/Docker on the host).

### [2026-08-19] LIVE-VERIFIED: full Docker Compose stack + compose bugfix
- WSL2 installed via elevated `wsl --install --no-distribution` (UAC approved) + reboot → VirtualMachinePlatform active → Docker engine 29.7.2 (Linux containers) now starts.
- `docker compose up -d --build` built api + web images, pulled postgres:18-alpine.
- **Bug found & fixed (only surfaces on a real container run):** postgres:18-alpine changed its data-dir convention — v18+ requires the volume mounted at `/var/lib/postgresql` (not `/var/lib/postgresql/data`); the old mount caused the postgres container to exit(1) on startup. Fixed in `docker-compose.yml`.
- After fix: all 3 services Up (postgres healthy = PostgreSQL 18.6); api container ran migrate (001_init applied) → seed (complete) → start (backend=pg, listening).
- Live round-trip against the containerized stack: web nginx :8080 → 200; api :3001 `/health` `{db:ok}`; login + RBAC list = 6; intake write → `INC-2026-001007` persisted to containerized Postgres.
- Result: both fixes (schema `uuid`→`text` + compose volume path) are now proven by a real `docker compose` run. Deployment path (R15) fully verified.
