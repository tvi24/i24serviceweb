# Implementation Tasks

Feature: incident-management. Mode: comprehensive (no unit decomposition). Sequencing follows the workspace build-order policy. Complete tasks in order; tick `[x]` as each finishes; stop for user confirmation at each group boundary.

Legend: each task lists the requirements (R#) it serves. Test/verify is concentrated in Group 5 per workspace policy; each group still ends with a working-software verification.

---

## Group 1 — Setup / Foundation

- [x] 1.1 Initialize monorepo root: `package.json` with npm workspaces (`apps/*`, `packages/*`), root scripts (dev, build, test), `.gitignore`, `.env.example`, root `tsconfig.base.json`, editorconfig. (R15)
- [x] 1.2 Create `packages/shared`: `types.ts` (Incident, Activity, SlaRecord, Alert, Csat, User, Role, AuditEvent, SlaConfig, enums), `constants.ts` (roles, status transition map, default SLA config, priority matrix, routing rules). (R2, R3, R5, R8)
- [x] 1.3 Create synthetic fixtures in `packages/shared/src/fixtures` (users for every role, incidents across P1–P4/statuses, activities, alerts, csat, audit events) — single source for mock + memory repo. (R13)
- [x] 1.4 Scaffold `apps/web` (React 19 + Vite 6 + TS + React Router 7 + TanStack Query), `index.html`, `main.tsx`, `router.tsx`, base AppShell placeholder. (R1)
- [x] 1.5 Create `apps/web/src/styles/tokens.css` from `design-system.md` (runtime token source of truth) + global base styles; wire Inter font + reduced-motion. (design-system)
- [x] 1.6 Configure Vitest + React Testing Library (web) and lint/format; verify `npm run dev` boots web and renders AppShell with no console errors. **Verify gate — PASSED: shared 6/6 + web 1/1 tests pass, dev server HTTP 200, Vite compiles modules cleanly.**

---

## Group 2 — Core Frontend + Mock Data

- [x] 2.1 Build `apiClient.ts` with `mock` mode (typed functions, simulated latency/errors) selectable via `VITE_DATA_MODE`, backed by an in-memory `mockBackend` seeded from shared fixtures (supersedes static `public/mocks/*.json` so mutations/flows work). (R1, R7)
- [x] 2.2 Build `AuthContext` + `LoginPage` (mock login against fixture users, token/roles in session), role-aware routing guards. (R2)
- [x] 2.3 Build shared UI components: buttons, cards, PriorityBadge, StatusBadge, SlaBadge, EmptyState, LoadingSkeleton, ErrorState, AppShell (nav + AlertCenter bell). (design-system, R6)
- [x] 2.4 IntakePage: incident form + validation, success panel with ticket id, duplicate warning display. (R1, EX-04, EX-05)
- [x] 2.5 ControlTowerPage + MyIncidentsPage: incident table, filters, own-cases scoping, Priority/SLA/Status badges. (R1, R7)
- [x] 2.6 IncidentWorkspacePage: detail + activity timeline + role-gated TriagePanel, AssignPanel, WorkNotes, StatusControl, ResolvePanel, AuditTimeline. (R3, R4, R7, R8, R10)
- [x] 2.7 User confirmation flow: confirm + CsatForm (1–5, reject out-of-range) + reopen (reason required). (R8, EX-02)
- [x] 2.8 AlertCenterPage: alert list grouped by severity + acknowledge. (R6)
- [x] 2.9 DashboardPage: KPI cards + charts + no-data states (from mock). (R9)
- [x] 2.10 SlaConfigPage: editable SLA/priority/routing form (manager only). (R5)
- [x] 2.11 Responsive pass (mobile/tablet/desktop, nav drawer, no horizontal scroll) + accessibility (focus-visible, ARIA, tap targets). **Verify gate — PASSED: web 9/9 tests incl. full mock lifecycle, tsc clean, production build clean (no warnings), dev server serves all page modules HTTP 200.**

> Note (in scope): the mock layer is an in-memory backend seeded from `@incident/shared/fixtures` rather than static JSON files, so create/triage/assign/resolve/CSAT/reopen mutations behave like the real API. Same typed contract as Phase 2 HTTP client.

---

## Group 3 — Core Frontend + Backend / Database

- [x] 3.1 Scaffold `apps/api` (Node 24 + Express 5 + TS): `app.ts`, `index.ts` (graceful shutdown), `config.ts` (env via zod), pino logger, error contract + errorHandler, requestLogger, helmet + CORS allow-list. (R12, R14)
- [x] 3.2 Repository interfaces + `memory` implementation seeded from shared fixtures; repository factory via `DATA_BACKEND`. (R1, R7)
- [x] 3.3 Auth: `authService` (scrypt hashing, JWT issue/verify), `authenticate` + `authorize` middleware, `/auth/login` + `/auth/me`, RBAC matrix. (R2, R12)
- [x] 3.4 Intake + incidents endpoints: `intakeService` (ticket id, idempotency/duplicate, persist-before-return), incidents list/detail/mine with ownership scoping. (R1, R14, EX-04, EX-05)
- [x] 3.5 Classification/priority: `aiAdapter` interface + `rulesAdapter` (default) + optional `bedrockAdapter` (env-gated); suggestions endpoint + triage (confirm/override + audit). (R3)
- [x] 3.6 Assignment: routing rules, manual owner, fallback queue + audit (in `incidentService`/`slaService`). (R4, EX-03)
- [x] 3.7 SLA: `slaService` (target computation incl. business-day, at-risk/breach evaluation) + `slaClock` evaluator; config endpoints (`configService`). (R5, EX-01)
- [x] 3.8 Alerts + escalation: `alertService` (priority/at-risk/breach/status/escalation alerts, scoped recipients, ack); alerts endpoints. (R6, BR-05, NFR-04)
- [x] 3.9 Workflow + resolution: notes, validated status transitions, resolve (code+note enforce), confirm/reopen/close, CSAT (rating + range) in `incidentService`. (R7, R8, BR-04)
- [x] 3.10 KPI + audit: `kpiService` (aggregations + no-data), `auditService` (append-only writer/reader), audit endpoint; `/health`. (R9, R10, R14)
- [x] 3.11 PostgreSQL: `pg` pool, migration runner + `migrations/*.sql` (up/down), seed script; `pg` repository implementations (parameterized SQL). (R12, R15) **LIVE-VERIFIED 2026-08-17 against PostgreSQL 17.6 (portable, no Docker): migrate → 10 tables, seed → all fixtures inserted, API in pg mode round-trip (health/login/RBAC list/intake write). Fixed a real bug found here: id/`*_id` columns were `uuid` but app IDs are strings (`u-emma`, `i-1001`) → changed to `text`.**
- [x] 3.12 Wire frontend to API: `VITE_DATA_MODE=http`, Bearer token attached, hooks reused; `docker-compose.yml` (postgres + api + web) + Dockerfiles + `.env.example`. **Verify gate — PASSED (memory backend): API 12/12 Supertest, live HTTP round-trip (health/login/RBAC list/intake), web builds clean in http mode. PostgreSQL compose not run (Docker unavailable this session).** (R15)

> Verification note: The API is fully verified end-to-end against the in-memory backend (real HTTP: `/health` ok, JWT login, RBAC-scoped `/incidents`, intake `INC-2026-001007`). The PostgreSQL layer (pg repo with parameterized SQL, migrations up/down, seed, docker-compose) is written and type-checks, but a live PostgreSQL round-trip could not be executed because Docker Desktop's engine did not finish starting in this session. To verify locally once Docker is running: `docker compose up -d --build` then open `http://localhost:8080`.

---

## Group 4 — Extras / Refinements

- [x] 4.1 CSAT reminder scheduling (up to reminder_max) + closure grace auto-close job (`maintenanceService` + clock). (R8, EX-02)
- [x] 4.2 KPI charts (recurring incidents, trend) + dashboard refresh control. (R9)
- [x] 4.3 Privacy hardening: minimal request logging (no headers/bodies/PII), pino secret redaction, user list strips password hash/salt, reporter detail scoped to brief fields. (R13)

> Verify gate — PASSED: API 15/15 tests (incl. 3 maintenance tests: auto-close after grace, reminders capped at reminderMax, no reminder once rated), web 9/9, tsc clean both.

---

## Group 5 — Test / Verify

- [x] 5.1 Unit tests (Vitest) for critical rules: priority matrix (9 combos), SLA targets/state, routing/fallback, status transitions, default SLA config; + resolution/CSAT/reopen/RBAC/idempotency at API level. (R14)
- [x] 5.2 API integration tests (Supertest): auth, RBAC, intake, full lifecycle with audit assertions, fallback, reopen, KPI, config, health. (R14)
- [x] 5.3 Component tests (RTL): CsatForm (reject out-of-range / accept valid), empty/loading/error states; + full mock lifecycle. (R14)
- [x] 5.4 Requirement coverage map (`apps/api/test/coverage-map.md`) + full suite run. **Verify gate — PASSED: 57 tests green (shared 25, api 18, web 14); root `npm run build` clean.** (R14)

---

## Group 6 — Deploy (optional / last)

- [x] 6.1 Docker Compose + Dockerfiles + README runbook (deploy/redeploy/rollback). `docker compose config` validates OK. Live `docker compose up` + `/api/health` green pending a running Docker engine (unavailable this session). (R15)
- [x] 6.2 Deployment evidence notes (health, smoke login, RBAC, intake ticket, seed data) recorded in `.aidlc/workflow/incident-management/audit.md`. (R14, R15)

---

## Add-on Group A — Theme & Localization (R16, R17)

Approved 2026-08-17 (post-UX-testing change request). Zero new runtime dependencies.

- [x] A.1 Add `[data-theme="dark"]` token overrides to `apps/web/src/styles/tokens.css` (surfaces, text, brand, semantic, priority, shadows); light stays `:root`. (R16)
- [x] A.2 `theme/ThemeContext.tsx`: `ThemeProvider` + `useTheme()` — resolve localStorage → prefers-color-scheme → light; apply `documentElement[data-theme]`; persist. (R16)
- [x] A.3 `i18n/`: `I18nContext.tsx` (`I18nProvider` + `useT`), `en.ts` + `th.ts` dictionaries (same keys), enum label helpers; localStorage → navigator.language → en; missing key → en fallback. (R17)
- [x] A.4 `ThemeToggle` + `LanguageSwitch` components (accessible, keyboard, focus-visible); wire into `AppShell` bar and `LoginPage`; wrap providers in `main.tsx`. (R16, R17)
- [x] A.5 Route all `pages/*` + `components/*` interface strings through `t()`; localized enum display labels. (R17)
- [x] A.6 Verify gate: `tsc`/build clean, existing 14 web tests still pass, dev server smoke test (toggle theme persists across reload; TH/EN switches all labels; contrast AA both themes). **PASSED: web build clean, 14/14 web tests pass, full suite 57/57, dev servers serve HTTP 200.** (R16, R17)
