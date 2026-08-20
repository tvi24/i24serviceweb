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

### [2026-08-19] refinement v3.0: Phase 0 + spec refinement
- Trigger: user provided `product refinements/AI_Assisted_Enterprise_Service_Operations_Product_Refinement_v3.0_Kiro.md` and asked to develop/continue.
- Phase 0 (mandated by refinement §26, no behavior changed): produced `.aidlc/workflow/incident-management/phase0-assessment.md` with Architecture Snapshot, Requirement-to-Implementation Gap Matrix (FR-10..27/BR-06..13/NFR-08..13), Reuse/Refactor/New matrix, DB migration impact, P0 vertical-slice plan, risks/assumptions.
- Key Phase-0 findings: Priority already P1–P4; SLA/matrix/routing already configurable; AI HITL recording already present; TH/EN + light/dark already ship. Absent (P0 build): Org/BU hierarchy, user profile/avatar/multi-email, granular permissions + platform_admin, service catalog + category/subcategory, SLA policy/instance/business-calendar, email ticketing E2E, BU/service drill-down analytics, role workspaces.
- Spec refinement (living docs, no runtime change): requirements.md Add-on R18–R27 (+BR-06..13, NFR-08..13); tasks.md Add-on slices V1–V6; new `design/refinement-v3.md`. Schema strategy = additive nullable + default SLA fallback to preserve R1–R17 and the 57 tests.
- Decisions (recommended defaults, reversible synthetic data): dedicated `admin` user for platform_admin; MGC Group→{MCR,MAG,MGC,XPENG} synthetic org tree; email uses local mock adapter (no provider secrets). Awaiting user confirmation at slice boundaries per workshop policy.
- Outcome: Phase 0 gate complete; specs refined; ready to implement Slice 1 (Org & Identity Foundation).

### [2026-08-19] refinement v3.0: Slice 1 — Org & Identity Foundation (COMPLETE)
- Scope: R18 (Org/BU master), R19 (profile/avatar/email identity), R20 (roles/permissions/support groups) + platform_admin role + role-based nav shell.
- Shared: types.ts (+Organization/BusinessUnit/Department/Location/UserEmail/Permission/SupportGroupMember, User profile fields, platform_admin role); constants.ts (+PERMISSIONS, ROLE_PERMISSIONS, permissionsForRoles); fixtures/org.ts (MGC synthetic tree), fixtures/users.ts (BU mapping + admin user), fixtures/index.ts (seedData wiring).
- API: migration 002_org_identity.sql (+down, additive nullable), Repositories interface + memory.ts + pg.ts + seed.ts extended together; orgService.ts; routes/admin.ts (adminRouter + profileRouter); requirePermission middleware; usersRouter opened to platform_admin/management; app.ts mounts /api/admin + /api/profile.
- Web: PlatformAdminPage (4 tabs), ProfilePage (avatar initials fallback + email verify/add), AuthContext.hasPermission, AppShell nav (+admin, username→profile), router routes/guards + platform_admin HomeRedirect, mockBackend + apiClient parity, en.ts/th.ts keys, ui.css utilities.
- Decisions applied (recommended defaults): dedicated `admin`/`Passw0rd!` platform_admin user; MGC Group→{MCR,MAG,MGC,XPENG} synthetic; avatar as validated data-URL (≤512KB) — no binary store; email verification is a workshop stub (marks verified + audits).
- Verify: 57 tests green (shared 25, api 18, web 14); all three builds clean; live API round-trip (admin org CRUD, user reassign, profile, RBAC 403) + both dev servers boot. Found/fixed during smoke: stale Docker `api` container from prior session still bound :3001 (killed com.docker.backend/wslrelay) — not a code bug.
- Pending: live pg/docker re-verify of migration 002 deferred to Slice 6 hardening (memory path fully verified; pg code-complete + type-checked).
- Status: Slice 1 DoD met (UI+API+persistence+RBAC+TH/EN+demo data+no regression). Awaiting user confirmation before Slice 2 (Priority & SLA engine).

### [2026-08-19] refinement v3.0: Slice 1 — completed full Org CRUD (R18 AC4)
- Trigger: user asked whether the MGC tree supports add/remove/create/edit at every level. Slice 1 initially shipped only create for BU/Dept; R18 AC4 requires create/edit/deactivate across the hierarchy. Completed it (in-scope of R18, not new scope).
- Added update + create-location + edit/deactivate at ALL levels: Organization, Business Unit, Department, Location.
- API: Repositories interface + memory.ts + pg.ts (update*/find*ById/insertLocation); orgService (updateOrganization/updateBusinessUnit/updateDepartment/createLocation/updateLocation); routes/admin.ts (POST /org/locations; PATCH /org/organizations|business-units|departments|locations/:id) guarded by requirePermission('org.manage').
- Web: PlatformAdminPage OrgTab rewritten with generic `OrgSection` component — view table + inline edit + activate/deactivate + create form for each of the 4 levels + overview tree with inactive markers. i18n keys added (en+th).
- Verify: all builds clean; 57 tests green; live API round-trip — create org, rename org, deactivate BU (active=false), rename department, create+deactivate location, and sam (service_desk) blocked 403 from org edit.
- Answer to user: YES — the org hierarchy is now fully manageable (add/create/edit/deactivate) at every level: Group/Company Organization, Business Unit, Department, Location.

### [2026-08-19] refinement v3.0: Slice 2 — Priority & SLA Engine (COMPLETE)
- Scope: R21 (configurable SLA policy engine + business calendar), R22 (canonical priority with governed mandatory override reason / BR-11).
- Shared: SlaPolicy/BusinessCalendar/SlaInstanceState types; enriched SlaRecord (policyId/policyName/calendarId/resolutionMetAt); TriageRequest.overrideReason. logic.ts: resolveSlaPolicy (specificity precedence + active/effective-window filter), addCalendarMinutes (calendar-aware working-hours clock, UTC-wallclock workshop simplification documented), computeSlaTargetsFromPolicy, slaInstanceState. fixtures/sla.ts: cal-24x7 + cal-th-bh + pol-p1..p4 mirroring DEFAULT_SLA_CONFIG (no calendar → identical legacy targets).
- API: migration 003_sla_engine.sql (+down, additive nullable); Repositories + memory.ts + pg.ts + seed.ts extended; slaService.startSlaTracking resolves policy (BU from reporter + priority) with calendar-aware targets, falls back to global config; resolveIncident marks resolutionMetAt; slaPolicyService + config routes (/config/sla-engine, sla-policies POST/PATCH, business-calendars POST/PATCH) guarded requirePermission('sla.manage'); /config/sla opened to platform_admin.
- Web: SlaPanel (state + response/resolution timers remaining/overdue/met + policy name) in incident workspace; TriagePanel mandatory override-reason field (shown on override, disables save, surfaces server field error); PlatformAdmin SlaTab (policies + calendars view/create/activate-deactivate); mockBackend + apiClient parity; en/th keys.
- Behavior preservation: 4 default per-priority policies mirror the legacy config with NO calendar, so computeSlaTargetsFromPolicy == computeSlaTargets (unit-tested for all P1–P4). Fallback to global config when no policy matches. Existing 57 tests unaffected.
- Verify: 71 tests green (shared 39 incl. 14 new SLA-engine tests, api 18, web 14); all builds clean. Live round-trip: engine listing (4 policies/2 calendars); created business-hours calendar + BU-specific "MCR P1 fast" policy → precedence resolution picks it on assign (response +5m/resolution +60m vs default P1 15m/4h); priority override blocked 400 without reason, succeeds with reason + audit.
- Pending: live pg/docker re-verify of migrations 002+003 deferred to Slice 6 hardening (memory path fully verified; pg code-complete + type-checked).
- Status: Slice 2 DoD met. NEXT: Slice 3 — incident Channel/Service/Category model + role-based workspaces.

### [2026-08-19] refinement v3.0: Slice 3 — Incident Model + Role Workspaces (COMPLETE)
- Scope: R23 (Channel/Service/Category/Subcategory separation + BU stamping), R27 (role-based workspaces + My-SLA + permission-appropriate nav).
- Shared: Service type; Channel +monitoring; CHANNELS/CATEGORIES/SUBCATEGORIES/REQUEST_TYPES constants; Incident +serviceId/category/subcategory/requesterBuId/affectedBuId/serviceOwnerBuId/requestType (nullable); MySlaSummary; IntakeRequest/TriageRequest extended; fixtures/services.ts (5 services).
- API: migration 004_service_catalog.sql (+down); Repositories + memory.ts + pg.ts (incident insert/update column lists + mapIncident + service CRUD) + seed.ts; orgService service-catalog CRUD; /admin/services routes (GET open, POST/PATCH service.manage); createIncident stamps channel/service/category/subcategory + requesterBuId/affectedBuId (reporter BU) + serviceOwnerBuId (service); triage captures dimensions; getMySlaSummary + /incidents/my-sla (ordered before /:id).
- Web: Intake channel/service/category/subcategory selectors; MyIncidents My-SLA summary card; ControlTower queue tabs (All/Untriaged/Unassigned/P1/P2/Reopened/Assigned-to-me); incident workspace sticky header + context (channel/category/requester BU); PlatformAdmin Services tab; nav labels (myRequests/queues/execDashboard); mockBackend + apiClient parity; en/th keys.
- Verify: 71 tests green (no regression); all builds clean. Live: services list=5; incident created with channel=mail/svc-m365/email/delivery, requesterBU=bu-mcr, serviceOwnerBU=bu-mgc; my-sla total=7/open=5/atRisk=1/breached=1; admin create service ok, emma 403.
- Honest scope notes: SLA At-Risk/Breached + Closed-Today queues deferred to Slice 5 dashboard (incident list payload has no SLA state); Ops/Exec workspaces reuse existing role-gated pages per refine-not-rewrite. pg/docker live re-verify of migrations 002-004 deferred to Slice 6.
- Status: Slice 3 DoD met. NEXT: Slice 4 — Email adapter E2E.

### [2026-08-19] refinement v3.0: Slice 4 — Email E2E (COMPLETE)
- Scope: R24 (end-to-end email ticketing via provider-agnostic adapter; no secrets in source).
- Shared: EmailAccount/EmailThread/EmailMessage/EmailTemplate types + enums; fixtures/email.ts (mock support mailbox + ack/resolved templates).
- API: migration 005_email.sql (+down); Repositories + memory.ts + pg.ts (accounts/templates/threads/messages) + seed.ts; emailAdapter port + MockEmailAdapter (real smtp/graph/ses env-gated, falls back to mock, creds from process.env only); emailService (ingestInbound verified-user match → thread reply-link OR createIncident + acknowledgement + timeline + audit; agentReply public/internal; test/send-test); routes/email.ts (/email/inbound staff-only, /email/accounts, test, send-test email.manage) + incidents /:id/emails + /:id/reply; app.ts mounts /api/email.
- Web: PlatformAdmin Email tab (accounts + test/send-test + inbound simulator); IncidentWorkspace EmailPanel (thread + public-reply/internal-note tabs, reporter sees public only); mockBackend + apiClient parity; en/th keys.
- Verify: 76 tests green (shared 39, api 23 incl. 5 email Scenario-B tests, web 14); all builds clean. Live: inbound emma@mgc.demo → created INC-2026-001007 + acknowledgement; Re:[ticket] reply linked to same incident; public reply delivered + internal note internal; account test ok/connected; non-staff inbound blocked 403.
- Security: mock adapter only, no provider secrets committed; provider selection abstracted; app remains operational when provider unavailable.
- Status: Slice 4 DoD met. NEXT: Slice 5 — interactive SLA/BU dashboard with drill-down.

### [2026-08-19] refinement v3.0: Slice 5 — Interactive SLA/BU Dashboard (COMPLETE)
- Scope: R26 (interactive analytics with data-trust: numerator/denominator, last-refresh, BU/Service drill-down, untriaged never hidden).
- Shared: KpiSummary extended (envelope lastRefreshedAt/slaEligible/slaMet; atRiskCount/breachedCount/p1Count/p2Count/untriagedCount; mttaMinutes/mttrMinutes; reopenRate; csatCount; byBu/byService/bySupportGroup KpiDimensionRow[] with total/open/breached/atRisk).
- API: kpiService rewritten — SLA compliance numerator/denominator, MTTA (response), MTTR (resolved-created), reopen rate, dimension() helper with explicit 'unset' bucket; BU derived from requesterBuId||reporter BU. mockBackend getKpi parity.
- Web: DashboardPage — last-refresh, compliance detail (met/eligible), MTTA/MTTR/P1/P2/at-risk/untriaged/reopen KPIs, clickable By-BU/By-Service/By-Support-Group tables → navigate to /control-tower?bu|service|group|priority|queue; ControlTower reads URL filters + clearable chip. en/th keys.
- Verify: 76 tests green; builds clean. Live: compliance 50% (1/2), breached 1/at-risk 1, P1 2/P2 1, untriaged 2, MTTA 10m/MTTR 870m, byBU MCR=6(br1), bySupportGroup breakdown, lastRefreshedAt present.
- Honest scope: breached/at-risk cards display-only (list payload has no SLA state); drill covers BU/Service/Group/Priority/untriaged. Time-range filters (7D/30D/QTD/YTD) deferred (trend + last-refresh present).
- Status: Slice 5 DoD met (data-trust R26 core). NEXT: Slice 6 — hardening + live pg/docker re-verify of migrations 002-005 + UAT scenarios.

### [2026-08-19] refinement v3.0: Slice 6 — Hardening + LIVE pg/Docker re-verify (COMPLETE)
- TH/EN: en/th key parity 424/424, 0 missing either side (all v3.0 strings translated). New UI accessible (focus-visible tabs, keyboard drill cards, non-color-only badges, no emoji).
- Reconciled design/data-model.md (superseded uuid note → text IDs; pointed to design/refinement-v3.md for v3.0 entities).
- Final verify: root `npm run build` clean; 76 tests green (shared 39, api 23, web 14).
- **LIVE pg/Docker re-verify (closes the deferred gap for migrations 002–005):** started Docker engine 29.7.2; `docker compose up -d --build` → 3 services up (postgres:18 healthy, api, web nginx). api container ran migrate (Migrations up to date: 001–005) → seed complete → start backend=pg. Live round-trip on real PostgreSQL: `/health` db=ok; `/admin/org` = 5 orgs/4 BUs/5 depts (002); `/config/sla-engine` = 4 policies/2 calendars (003); `/admin/services` = 5 (004); `/email/inbound` from emma@mgc.demo → created INC-2026-001007 + acknowledgement, thread 2 msgs (005); `/kpi/summary` compliance + byBu(2)/byService(1); web :8080 → 200.
- UAT Scenarios A–F: covered by automated tests + live smokes (see V6.2). Audit events present for org/user/sla/service/email/profile actions.
- Status: Slice 6 DoD met. **All P0 slices (1–6) COMPLETE + verified on both memory and live PostgreSQL/Docker.** Containers left running for localhost testing (web http://localhost:8080, api http://localhost:3001/api/health). Deferred to P1 (not P0): time-range dashboard filters (7D/30D/QTD/YTD), breached/at-risk list queues (need SLA state on list payload), real email provider adapters (smtp/graph/ses — boundaries in place).

### [2026-08-19] bugfix: My Requests 403 in http mode (business_user)
- Symptom: "You do not have permission to perform this action." on the My Requests page when running against the real API (Docker :8080 / VITE_DATA_MODE=http).
- Root cause: `apiClient.listIncidents({ mine:true })` issued `GET /incidents?mine=true`, but that support-scoped endpoint is gated to service_desk/support/manager/management — a business_user (reporter) is correctly forbidden (403). The API already exposes `GET /incidents/mine` (allows business_user) but the web client never routed to it. Mock mode masked the bug (mockBackend.listIncidents applies the `mine` filter without a role gate), so it only surfaced in http mode.
- Fix: `apiClient.listIncidents` now routes to `GET /incidents/mine` whenever `filters.mine` is set (http mode); mock path unchanged. One-line, no spec/schema change.
- Verify: web build clean + 14 web tests pass; live on pg/:3001 as emma — `GET /incidents/mine` OK (count 6), `GET /incidents/my-sla` OK (open 4); web image rebuilt + container recreated (:8080 → 200).
