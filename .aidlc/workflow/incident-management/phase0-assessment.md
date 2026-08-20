# Phase 0 — Repository Assessment (Product Refinement v3.0)

> Mandated first deliverable per Refinement Spec §26 ("START NOW WITH: Phase 0 … Do not modify behavior until the Phase 0 assessment is complete").
> Source of truth = actual code in `packages/shared`, `apps/api`, `apps/web` as of 2026-08-19. No behavior changed while producing this document.

---

## A. Current Architecture Snapshot

**Shape:** npm-workspaces monorepo.
- `packages/shared` — domain model (`types.ts`), constants/labels/state-machine (`constants.ts`), pure logic (`logic.ts`: priority matrix, keyword classify, SLA math), synthetic fixtures. Consumed by both API and web.
- `apps/api` — Express 5 + TS. JWT auth, `authenticate`/`authorize` middleware, repository seam (`memory` | `pg` via `DATA_BACKEND`), 9 services, routes (`auth`, `incidents`, `misc`), custom migration runner + `001_init.sql`, seed, `slaClock` intervals (SLA eval 30s, maintenance 300s), pino logging, `/health`.
- `apps/web` — React 19 + Vite 6 + React Router 7 + TanStack Query. `apiClient` with `mock | http` transport seam (`VITE_DATA_MODE`); `mockBackend` is a full in-memory reimplementation so the SPA runs with no API. Role-based routing (`RequireRole`), AppShell, UI kit, **TH/EN i18n already present** (`i18n/`), **light/dark theme already present** (`theme/`, `styles/tokens.css`).

**Runtime status (per PROJECT_STATUS + audit):** 57 tests green; memory + PostgreSQL + full Docker Compose stack all live-verified.

**Canonical enums (already aligned to target in several places):**
- `Priority = P1|P2|P3|P4` — **already canonical** (High/Med/Low is only `ImpactUrgency`, the matrix *input*).
- `Role` (flat 6): business_user, service_desk, application_support, infrastructure_support, manager, management.
- `SupportGroup` (3): service_desk, application_support, infrastructure_support.
- `IncidentStatus` (9), `SlaState` (within_target|at_risk|breached), `Channel` (web_portal|mail|line|phone — only web_portal is ever produced).

---

## B. Requirement-to-Implementation Gap Matrix

Legend: ✅ present · ◑ partial · ❌ absent.

| Refinement req | Status | Evidence / gap |
|---|---|---|
| FR-10 Organization / Company / BU Master | ❌ | No org/company/BU/department entity, table, field or UI anywhere. Only in docs. |
| FR-11 User & Profile Master incl. Avatar | ◑ | `User{username,displayName,roles,supportGroup}` only. No profile, avatar, job title, manager, location, tz, lang, last-login. |
| FR-12 Role / Permission / Support Group admin | ◑ | Roles are a flat `text[]`; SupportGroup is an enum. No Permission object, no UserRole/SupportGroupMember tables, no admin UI, `authorize()` is coarse role-membership only. |
| FR-13 Multiple Email Identity & Verification | ❌ | `User` has no email at all. No UserEmail, no verification. |
| FR-14 Email Account & Notification Config | ❌ | No EmailAccount, adapter, or template entity/UI. |
| FR-15 Inbound Email → Ticket (E2E) | ❌ | `Channel='mail'` declared but never set; no ingestion/parsing/matching. |
| FR-16 Email Reply / Thread / Delivery tracking | ❌ | No EmailMessage/EmailThread; no delivery/processing state. |
| FR-17 Configurable SLA Policy Engine | ◑ | SLA targets/matrix/routing/at-risk% **are** configurable (`SlaConfig`, `PUT /config/sla`, SlaConfigPage). BUT it is a single global config, not per BU/Service/RequestType policy records with effective dates/warning+escalation thresholds. |
| FR-18 Business Calendar & SLA Clock | ◑ | `addBusinessDays` skips Sat/Sun (UTC) only. No holidays, no time zone, no support-hours/24x7, no per-BU/service calendar, no pause. |
| FR-19 Interactive SLA Dashboard | ◑ | KPI summary exists (counts, compliance %, breach, aging, reopen, CSAT, recurring, trend, hasData). BUT flat — no drill-down, no numerator/denominator exposure, no BU/service dimension, no last-refresh contract, no click-through. |
| FR-20 Group/BU/Service drill-down analytics | ❌ | No BU/service dimension on incidents or KPI. |
| FR-21 Business User My Requests & My SLA | ◑ | MyIncidentsPage lists own incidents. No "My SLA" summary (within %/at-risk/breached), no reply/attachment. |
| FR-22 Executive Service Performance Dashboard | ◑ | DashboardPage exists (manager/management). No BU/service breakdown, MTTA/MTTR, major-incident count. |
| FR-23 AI Triage Suggestion & Human Confirmation | ✅ | `aiAdapter.suggest()` → `*Suggested` fields; triage records override vs recommended in audit. Rules default + Bedrock stub fallback. Lacks per-field confidence + a structured AIRecommendation record. |
| FR-24 Notification Center | ◑ | In-app Central Alert Center + bell exists. No general notification center / templates / per-channel prefs. |
| FR-25 Global Search | ❌ | None. |
| FR-26 Saved Views / Filters | ❌ | Filters exist on control tower; not savable. |
| FR-27 Integration Health Console | ❌ | `/health` only; no per-integration health UI. |
| BR-06 verified org email primary identity | ❌ | No email identity. |
| BR-07 preserve Requester/Affected/ServiceOwner BU + SupportGroup on incident | ◑ | SupportGroup preserved; BU fields absent. |
| BR-08 SLA precedence (BU+Service+Priority+ReqType+Calendar) | ❌ | Single global config; no precedence resolution. |
| BR-11 Priority override w/ mandatory reason | ◑ | Override is recorded in audit, but **reason is not currently mandatory** on triage. |
| BR-12 Resolution code + note | ✅ | Enforced in `resolveIncident`. |
| BR-13 Re-open requires reason → active | ✅ | Enforced in `reopenIncident`. |
| NFR-08 Performance / loading + last-refresh | ◑ | Loading skeletons exist; dashboard lacks explicit last-refreshed contract. |
| NFR-09 Security (RBAC, no secrets, validation, audit) | ✅ | scrypt, JWT, zod validation, env secrets, append-only audit, helmet/CORS. Personal-email protection N/A yet. |
| NFR-10 Localization TH/EN | ✅ | Full i18n with key fallback; enum label maps. Must extend keys for new features. |
| NFR-11 Accessibility | ✅ | focus-visible, ARIA, non-color-only badges, Lucide icons. Extend to new UI. |
| NFR-12 Observability | ◑ | Structured logs, audit, `/health`. No email/SLA-engine/integration health surface. |
| NFR-13 Data integrity (idempotent, no silent dup, KPI from source) | ✅/◑ | Idempotency + duplicate warning present; KPI computed from source. Extend to email + BU. |

---

## C. Reuse / Refactor / New Component Matrix

**REUSE as-is (do not rewrite):** repository seam + `mock|http` client, JWT auth + `authenticate`, incident lifecycle service (create→triage→assign→note→resolve→confirm→csat→reopen→close), status-transition state machine, audit writer/reader, alert service + Alert Center, KPI base aggregation, i18n framework, theme + `tokens.css`, UI kit (badges/cards/tables/states), Docker Compose + migration runner + seed, test harnesses.

**REFACTOR (extend, keep contract):**
- `User` type + `users` table + fixtures → add profile fields + FK to BU (nullable, migration-safe).
- `authorize()` → keep role gate; add optional permission check layer (additive).
- `Incident` + `incidents` table → add `requesterBuId`, `affectedBuId`, `serviceOwnerBuId`, `serviceId`, `category`, `subcategory` (all nullable so existing rows/tests hold). `channel` becomes actually used.
- `SlaConfig`/SLA start → introduce `SLAPolicy`/`SLAInstance` while keeping the global config as the default/fallback policy so current tests keep passing.
- Triage → make override reason mandatory (BR-11); add per-field AIRecommendation record (FR-23).
- KPI service → add BU/Service dimensions + numerator/denominator + last-refresh envelope (additive fields).
- Router/AppShell nav → expand to role-based workspaces (My Requests, My Work, Queues, Control Tower, Executive, Platform Admin).

**NEW:** Organization/Company/BusinessUnit/Department entities + master UI; UserProfile + UserEmail (+verification); Role/Permission/UserRole/SupportGroup/SupportGroupMember tables + admin UI; Service catalog + Category/Subcategory; SLAPolicy/SLAInstance/BusinessCalendar; EmailAccount/EmailMessage/EmailThread/EmailTemplate + inbound/outbound adapter (mock-first); Notification Center; Global Search; Saved Views; Integration Health console; Platform Administrator role + workspace.

---

## D. Database Migration Impact

- All ID columns are already `text` (opaque strings) — new FKs stay `text`, low risk.
- Strategy: **additive migrations only** (`002_org_users.sql`, `003_priority_sla_engine.sql`, `004_service_catalog.sql`, `005_email.sql`, …), each with a matching `.down.sql`. New columns on `incidents`/`users` are **nullable with sensible defaults** so existing seed rows, memory backend, pg backend, and the 57 tests remain valid.
- New singleton/global rows (default SLA policy, default calendar) seeded to preserve current SLA behavior when no BU/service policy matches (BR-08 precedence falls back to global default).
- `memory.ts` and `pg.ts` must evolve together behind the `Repositories` interface (single contract) so mock and http stay identical.
- Note: `design/data-model.md` still says `uuid` PKs — stale; actual schema is `text` (fixed 2026-08-17). Will reconcile the doc during spec refinement.

---

## E. Recommended P0 Implementation Plan (vertical slices, runnable after each)

Order follows workshop build-order policy (Setup → FE+mock → FE+backend) *within* each slice, and Refinement §26 P0-first.

1. **Slice 1 — Org & Identity Foundation (Vibe 01):** Organization/Company/BU/Department + User profile/avatar + UserEmail(+verify) + Role/Permission/SupportGroup master + Platform Admin workspace + role-based nav shell. Synthetic MGC data (MCR/MAG/MGC/XPENG). TH/EN + RBAC tests. *No SLA/email yet.*
2. **Slice 2 — Priority & SLA Engine (Vibe 02):** SLAPolicy + SLAInstance + BusinessCalendar + PriorityMatrix admin; Impact×Urgency→P1–P4 auto with mandatory override reason; response/resolution timers + At Risk/Breached in incident UI; audit. Global default policy preserves current behavior.
3. **Slice 3 — Incident model + role workspaces (Vibe 04 core):** Channel/Service/Category/Subcategory separation; BU stamping on incident; My Requests / My Work / Incident Queues / Operations Control Tower / Executive workspaces; sticky incident header + context panel.
4. **Slice 4 — Email E2E (Vibe 03):** mock-first Email adapter (inbound→verified-user match→incident create→ack→timeline→public reply→user reply→same thread→delivery/error state→audit) + Email Account console.
5. **Slice 5 — Interactive SLA/BU dashboard (Vibe 05):** Overall→BU→Service→Incident drill-down; numerator/denominator/filter/time-range/last-refresh; never hide untriaged; MTTA/MTTR/re-open/CSAT.
6. **Slice 6 — Hardening:** TH/EN normalization for all new strings, acceptance tests per MUST, audit evidence, verify build/dev + UAT scenarios A–F.

Definition of Done per slice = Refinement §24 (UI+API+persistence+RBAC+TH/EN+acceptance test+error path+audit+no P0 regression+demo data).

---

## F. Risks / Assumptions / Decisions Required

**Assumptions (synthetic, safe per §26 "use synthetic/demo data"):**
- MGC org tree = MGC Group → {MCR, MAG, MGC, XPENG} with sample departments/locations. Configurable, not hard-coded (FR-10).
- Demo users retain existing logins (emma/sam/alex/ivan/mary/gary, `Passw0rd!`); each mapped to a BU + given synthetic org emails (`<user>@mgc.demo`).
- New **Platform Administrator** role added as a separate role (not merged with manager) per §4.1; assign to a new synthetic admin user + optionally to `gary`? → **decision needed** (see below).
- Email slice uses a local **mock adapter** (no real M365/SES/SMTP creds); real providers remain an abstracted, env-gated boundary. No secrets in source.
- SLA precedence falls back to the existing global default policy so current SLA tests/behavior never regress.

**Risks:**
- Scope is large (27 FRs). Mitigation: strict P0-first vertical slices, app runnable + verified after each, checkpoint at slice boundaries (workshop rule).
- Expanding `Incident`/`User` risks regressions in 57 existing tests. Mitigation: additive nullable fields + keep global SLA default; run full suite each slice.
- Dual backend (memory + pg) doubles every persistence change. Mitigation: change both behind the single `Repositories` interface in the same task; run api tests (memory) + note pg migration.

**Decisions required from user before/within Slice 1:**
1. **Platform Administrator identity:** add a dedicated synthetic admin user (e.g. `admin` / `Passw0rd!`), or grant the new `platform_admin` role to an existing user? (Recommend: new dedicated `admin` user.)
2. **Org tree depth for demo:** the 4 BUs above are enough for UAT; confirm sample departments/locations are acceptable as synthetic.
3. **Scope confirmation:** proceed slice-by-slice (recommended) vs any re-prioritization of P0 items.
