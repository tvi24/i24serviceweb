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

---

## Add-on — Product Refinement v3.0 (P0-first vertical slices)

Approved 2026-08-19. Evolves the MVP into the Enterprise Service Operations Platform per `product refinements/AI_Assisted_Enterprise_Service_Operations_Product_Refinement_v3.0_Kiro.md` and the gate in `.aidlc/workflow/incident-management/phase0-assessment.md`. Each slice keeps the app runnable + verified; stop for user confirmation at each slice boundary. Serves R18–R27 (+ existing R1–R17 preserved). Schema changes are additive with nullable columns + `.down.sql`; both `memory` and `pg` repos evolve together behind the `Repositories` interface.

### Slice 1 — Org & Identity Foundation (Vibe 01) — R18, R19, R20
- [x] V1.1 Shared domain: added `Organization`, `BusinessUnit`, `Department`, `Location`, `UserEmail`, `Permission`, `SupportGroupMember` types; extended `User` with profile fields (jobTitle, buId, departmentId, managerId, locationId, avatarUrl, timeZone, preferredLanguage, preferredChannel, lastLoginAt). Added `platform_admin` role + `PERMISSIONS`/`ROLE_PERMISSIONS`/`permissionsForRoles()`. All additive/optional. (R18–R20)
- [x] V1.2 Synthetic fixtures: MGC Group → {MCR, MAG, MGC, XPENG} + 5 departments + 2 locations (`fixtures/org.ts`); mapped 6 demo users to BUs + synthetic org emails (`<user>@mgc.demo`, verified); added dedicated `admin` user (`platform_admin`, `Passw0rd!`). (R18, R19)
- [x] V1.3 Migration `002_org_identity.sql` (+down): organizations, business_units, departments, locations, user_emails + nullable profile columns on `users`. Extended `Repositories` interface + `memory.ts` + `pg.ts` + `seed.ts` together. (R18–R20)
- [x] V1.4 API: `orgService` + `routes/admin.ts` — org overview, create org/BU/dept (perm `org.manage`), admin user update (`user.manage`), profile self-service (`/profile` GET/PATCH, avatar data-URL validated ≤512KB), email add + verify stub. `requirePermission` middleware added. (R18–R20)
- [x] V1.5 Web: Platform Administration workspace (`PlatformAdminPage` tabs: Organization tree + create BU/Dept, Users edit roles/BU/active, Roles & Permissions matrix, Support Groups membership); `ProfilePage` (avatar + initials fallback, emails verify/add, preferences); nav entry (platform_admin) + username→profile link + `platform_admin` HomeRedirect. TH/EN keys added to en.ts + th.ts. mockBackend + apiClient parity. (R18–R20, R27)
- [x] V1.6 Verify gate — PASSED: shared build + 25 tests, api build + 18 tests, web build + 14 tests (57 total, no regression). Live API round-trip: admin lists org tree, creates BU, reassigns emma BU, emma profile shows verified email, emma blocked from org.manage (403). Both dev servers boot (web 200, api :3001 listening). Note: pg path is code-complete + type-checked; live pg/docker re-verify deferred to hardening (Slice 6).

### Slice 2 — Priority & SLA Engine (Vibe 02) — R21, R22
- [x] V2.1 Shared: `SlaPolicy` (conditions BU/Service/Priority/RequestType + effective dates + warningPct), `BusinessCalendar` (mode/workdays/hours/holidays/tz), `SlaInstanceState` (not_started/running/paused/at_risk/met/breached/cancelled); enriched `SlaRecord` (policyId/policyName/calendarId/resolutionMetAt); `TriageRequest.overrideReason`. Logic: `resolveSlaPolicy` (specificity precedence + active/effective window), `addCalendarMinutes` (calendar-aware clock), `computeSlaTargetsFromPolicy`, `slaInstanceState`. (R21, R22)
- [x] V2.2 Migration `003_sla_engine.sql` (+down): sla_policies, business_calendars + nullable enrichment columns on sla_records; fixtures/sla.ts seeds 2 calendars (24x7 + TH business hours) + 4 per-priority default policies that MIRROR DEFAULT_SLA_CONFIG (no calendar) so legacy targets are exactly preserved. Repositories interface + memory.ts + pg.ts + seed.ts extended together. (R21)
- [x] V2.3 API: `slaService.startSlaTracking` resolves the applicable policy by precedence (BU from reporter + priority) with calendar-aware targets, falling back to global SlaConfig when none matches; `slaPolicyService` + config routes (`/config/sla-engine`, POST/PATCH `/config/sla-policies`, POST/PATCH `/config/business-calendars`) guarded by `requirePermission('sla.manage')`; resolution marks `resolutionMetAt`. (R21)
- [x] V2.4 Priority: `triageIncident` enforces mandatory override reason when applied priority ≠ recommendation; audit records reason + previousPriority + recommended (BR-11). Priority matrix editable via `/config/sla` (opened to platform_admin). (R22)
- [x] V2.5 Web: incident-workspace `SlaPanel` (instance state + response/resolution timers with remaining/overdue/met + policy name); TriagePanel override-reason field (required, shown on override, server-error surfaced); PlatformAdmin `SlaTab` (policies + calendars tables, create + activate/deactivate). TH/EN keys (en+th). mockBackend + apiClient parity. (R21, R22, R27)
- [x] V2.6 Verify gate — PASSED: shared 39 tests (+14 SLA-engine incl. behavior-preservation + calendar accrual + resolution precedence), api 18, web 14 (71 total); all builds clean. Live: engine lists 4 policies/2 calendars; created BU-specific "MCR P1 fast" policy wins precedence (response +5m/resolution +60m); override blocked 400 without reason, ok with reason. pg live re-verify deferred to Slice 6.

### Slice 3 — Incident Model + Role Workspaces (Vibe 04 core) — R23, R27
- [x] V3.1 Shared: `Service` type + `CHANNELS`/`CATEGORIES`/`SUBCATEGORIES`/`REQUEST_TYPES` constants + `Channel` gains `monitoring`; `Incident` gains nullable `serviceId/category/subcategory/requesterBuId/affectedBuId/serviceOwnerBuId/requestType`; `MySlaSummary` type; IntakeRequest/TriageRequest extended. Migration `004_service_catalog.sql` (+down, additive nullable). (R23)
- [x] V3.2 API: service-catalog admin (`orgService` create/update/list + `/admin/services` routes guarded `service.manage`; GET open to all roles for intake); `createIncident` captures channel/service/category/subcategory and stamps requesterBuId/affectedBuId from reporter + serviceOwnerBuId from service; triage captures service dimensions; `getMySlaSummary` + `/incidents/my-sla`. Repositories + memory.ts + pg.ts (incident insert/update columns) + seed.ts extended. (R23)
- [x] V3.3 Web: My Requests + **My-SLA summary card** (within%/at-risk/breached/open); Incident Queues tabs on Control Tower (All/Untriaged/Unassigned/P1/P2/Reopened/Assigned-to-me = My Work); Intake channel/service/category/subcategory selectors; incident workspace **sticky header** + context (channel/category/requester BU/service); PlatformAdmin **Services** tab; role-appropriate nav labels (My Requests / Incident Queues / Executive Dashboard). TH/EN keys (en+th). mockBackend + apiClient parity. (R23, R27)
- [x] V3.4 Verify gate — PASSED: 71 tests green (no regression); all builds clean. Live: 5-service catalog; incident stamped channel=mail/service=svc-m365/category=email/delivery + requesterBU bu-mcr + serviceOwnerBU bu-mgc; my-sla summary computed; admin creates service, emma blocked 403. pg live re-verify deferred to Slice 6.
  - Note (honest scope): "At Risk / Breached" queues and "Closed Today" were not added as list tabs because SLA state is not carried on the incident list payload (only in detail); those live in the SLA dashboard (Slice 5). Executive/Ops workspaces reuse existing role-gated Dashboard/Control Tower pages (refine-not-rewrite).

### Slice 4 — Email E2E (Vibe 03) — R24
- [x] V4.1 Shared: `EmailAccount`, `EmailThread`, `EmailMessage`, `EmailTemplate` types + delivery/processing/visibility enums; fixtures/email.ts (mock support mailbox + acknowledgement/resolved templates). Migration `005_email.sql` (+down). (R24)
- [x] V4.2 API: `emailAdapter` port + local mock adapter (no secrets; real smtp/graph/ses are env-gated boundaries, falls back to mock so app never blocks); `emailService` — ingestInbound (verified-user match → reply-to-ticket thread match OR create incident → acknowledgement → timeline + audit), agentReply (public=emailed+delivered / internal=timeline-only), listIncidentEmails, testConnection, sendTestEmail; routes/email.ts (`/email/inbound`, `/email/accounts`, test, send-test) + incident `/:id/emails` + `/:id/reply`. Repositories + memory.ts + pg.ts + seed.ts extended. (R24)
- [x] V4.3 Web: PlatformAdmin **Email tab** (accounts console + test-connection/send-test + inbound simulator); incident-workspace **EmailPanel** (thread with inbound/outbound/internal styling + public-reply/internal-note tabs; reporters see public only). TH/EN keys (en+th). mockBackend + apiClient parity. (R24)
- [x] V4.4 Verify gate — PASSED: **76 tests** green (shared 39, api 23 incl. 5 email E2E Scenario-B tests, web 14); all builds clean. Live round-trip: inbound from emma@mgc.demo → created INC-2026-001007 + acknowledgement (thread inbound+outbound); reply `Re:[ticket]` → linked to same incident; agent public reply delivered + internal note internal; account test ok/connected. pg live re-verify deferred to Slice 6.

### Slice 5 — Interactive SLA/BU Dashboard (Vibe 05) — R26
- [x] V5.1 API: `KpiSummary` extended — envelope (`lastRefreshedAt`, `slaEligible`/`slaMet` numerator/denominator), `atRiskCount`/`breachedCount`/`p1Count`/`p2Count`/`untriagedCount`, `mttaMinutes`/`mttrMinutes`, `reopenRate`, `csatCount`, and `byBu`/`byService`/`bySupportGroup` dimension rows (total/open/breached/atRisk). Aggregation keeps an explicit `unset` bucket so untriaged/unmapped are never dropped (R26). BU derived from `requesterBuId` or reporter BU. mockBackend `getKpi` parity. (R26)
- [x] V5.2 Web: dashboard shows last-refresh, SLA compliance with numerator/denominator, MTTA/MTTR/P1/P2/at-risk/untriaged/reopen-rate KPIs, and clickable **By-BU / By-Service / By-Support-Group** tables that drill through to Control Tower filtered by `?bu=`/`?service=`/`?group=`/`?priority=`/`?queue=` (with a clearable filter chip). TH/EN keys. (R26)
- [x] V5.3 Verify gate — PASSED: 76 tests green; all builds clean. Live: compliance 50% (1/2), breached 1 / at-risk 1, P1 2 / P2 1, untriaged 2, MTTA 10m, MTTR 870m, byBU MCR=6(breached 1), bySupportGroup breakdown, lastRefreshedAt present.
  - Honest scope: breached/at-risk KPI cards are display-only (the incident-list payload carries no SLA state, so those queues can't be filtered from the list); drill-through covers BU/Service/SupportGroup/Priority/untriaged which are all derivable. Time-range filters (7D/30D/QTD/YTD) not yet added — trend chart + last-refresh present; time filters deferred to Slice 6/P1.

### Slice 6 — Hardening & UAT Evidence — R14, R16, R17, NFR-08..13
- [x] V6.1 TH/EN normalization: verified **en/th key parity = 424/424, 0 missing** either side (all new v3.0 strings translated). New UI keeps accessible patterns (focus-visible tabs, keyboard-operable KPI drill cards, non-color-only badges, Lucide icons, no emoji).
- [x] V6.2 Acceptance evidence — UAT Scenarios verified via automated + live smokes: A lifecycle (api/web lifecycle tests), B email E2E (5 email tests + live pg), C multi-BU SLA + dashboard (policy precedence + byBu dimension live), D priority override (400 w/o reason live+mock), E SLA breach (sla clock + KPI breached/at-risk), F RBAC (platform_admin gates, non-staff inbound 403, emma admin 403). Audit events recorded for org/user/sla/service/email/profile actions.
- [x] V6.3 Final verify gate — PASSED: `npm run build` (root) clean, no warnings; **76 tests green** (shared 39, api 23, web 14); reconciled `design/data-model.md` (text IDs + v3.0 entities → refinement-v3.md); PROJECT_STATUS updated. **LIVE pg/Docker re-verify DONE:** `docker compose up -d --build` → postgres 18 healthy, api migrate(001–005)+seed+start(backend=pg), web nginx; round-trip on real Postgres — `/health` db=ok, org 5/4/5, SLA 4 policies/2 calendars, services 5, email inbound→created INC-2026-001007+ack (thread 2), KPI BU/service dims, web :8080 → 200.
