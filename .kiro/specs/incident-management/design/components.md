# Components

## Backend services (apps/api/src/services)

Each service is a pure-ish module operating over repository interfaces; no service reaches into another's persistence directly.

- **authService** — verify credentials (scrypt), issue JWT, resolve `me`. Emits `auth.login` audit.
- **intakeService** — create ticket: generate `ticket_id`, idempotency + duplicate-criteria check, validate required fields, persist incident before returning id, trigger classification suggestion + intake audit. (R1, R14, EX-04, EX-05)
- **classificationService** — derive classification + priority recommendation via `aiAdapter`; store recommendation vs authorized value; record override in audit. (R3)
- **aiAdapter** — interface `suggest(incident) → { classification, priority, source }`. Implementations: `rulesAdapter` (keyword + priority_matrix, deterministic, default) and `bedrockAdapter` (optional, env-gated). (R3)
- **assignmentService** — resolve support_group from routing_rules; manual owner assignment; route to fallback queue when unresolved; record assignment/fallback audit. (R4, EX-03)
- **slaService** — start tracking on assignment, compute response/resolution targets (business-day aware), evaluate at_risk/breached states; expose evaluation used by ticker + KPI; audit config-driven changes. (R5, EX-01)
- **alertService** — create alerts for priority/at-risk/breach/status/escalation; scope recipients; acknowledge; record alert as audit + KPI event. (R6, BR-05, NFR-04)
- **escalationService** — apply escalation rules → route case up + create escalation alert. (R6)
- **workflowService** — append work notes, validate + apply status transitions, expose case history. (R7)
- **resolutionService** — enforce resolution_code + note, set resolved, create confirmation+CSAT request, handle reopen (reason required) and closure (confirm or grace expiry). (R8, BR-04, EX-02)
- **csatService** — accept 1–5 rating, reject out-of-range, schedule/emit reminders up to reminder_max. (R8, NFR-05)
- **kpiService** — aggregate counts, SLA compliance/breach, aging, reopen, avg CSAT, recurring, trend; no-data state when empty. (R9)
- **auditService** — append-only writer + authorized reader; masks sensitive fields. (R10)
- **configService** — read/update sla_config; validate; audit changes. (R5)

## Backend infrastructure (apps/api/src)

- **middleware/authenticate** — verify JWT, attach `req.user`.
- **middleware/authorize** — role + resource/group/ownership checks.
- **middleware/validate** — zod schema per route; strips unknown fields.
- **middleware/errorHandler** — maps errors → error contract, generates `errorId`, structured log, no stack leak.
- **middleware/requestLogger** — pino child logger with request id.
- **repositories** — interfaces + two implementations:
  - `memory/*` (Map-based, seeded from shared fixtures) for dev/tests.
  - `pg/*` (parameterized SQL) for Phase 2.
  - Selected via `DATA_BACKEND=memory|pg`.
- **db** — pg Pool, migration runner (`migrations/*.sql`), seed script.
- **lib/slaClock** — periodic evaluator (interval) that recomputes SLA states and emits alerts; safe to run in-process for the workshop.

## Frontend (apps/web/src)

- **apiClient** — single module. Phase 1: reads `/mocks/*.json` and simulates latency; Phase 2: HTTP with Bearer token. Same function signatures → no UI change on swap.
- **auth/AuthContext** — token storage (memory + sessionStorage), current user, role guards.
- **hooks** — TanStack Query hooks: `useIncidents`, `useIncident`, `useAlerts`, `useKpi`, `useSlaConfig`, mutations for triage/assign/resolve/csat/etc.
- **components** — `AppShell` (header + role-aware nav + AlertCenter bell), `IncidentTable`, `PriorityBadge`, `SlaBadge`, `StatusBadge`, `WorkNotes`, `TriagePanel`, `AssignPanel`, `ResolvePanel`, `CsatForm`, `AuditTimeline`, `KpiCards`, `EmptyState`, `LoadingSkeleton`, `ErrorState`.
- **pages** (role-gated routes):
  - `LoginPage` (R2)
  - `IntakePage` — submit incident, receive ticket id, duplicate warning (R1)
  - `MyIncidentsPage` — reporter's cases + confirm/csat/reopen (R1, R8)
  - `ControlTowerPage` — all incidents, filters, SLA states (R1, R7)
  - `IncidentWorkspacePage` — triage, assign, notes, status, resolve, audit (R3–R8, R10)
  - `AlertCenterPage` — alerts list + acknowledge (R6)
  - `DashboardPage` — KPI cards + charts + no-data states (R9)
  - `SlaConfigPage` — edit SLA/priority/routing config (R5)

## Shared (packages/shared)

- **types** — Incident, Activity, SlaRecord, Alert, Csat, User, Role, AuditEvent, SlaConfig, enums (Status, Priority, SlaState).
- **constants** — role names, status transition map, default config, priority matrix.
- **fixtures** — synthetic seed data used by both memory repo and frontend mocks (single source, exported as JSON).

## Add-on — Theme & Localization (R16, R17)

Approved 2026-08-17 after UX testing. Zero new runtime dependencies (custom lightweight implementations).

### Theme (R16)
- **tokens.css** — adds a `[data-theme="dark"]` block that overrides the color tokens only (surfaces, text, brand, semantic, priority, shadows). Light stays under `:root`. Layout/typography/motion tokens are shared. Components remain bound to `var(--color-*)`; no component changes required for color.
- **theme/ThemeContext** (`apps/web/src/theme/`) — `ThemeProvider` + `useTheme()`. Resolves initial theme: `localStorage['im.theme']` → `matchMedia('(prefers-color-scheme: dark)')` → `light`. Applies `document.documentElement.dataset.theme`. Persists on change.
- **ThemeToggle** component — Lucide `Sun`/`Moon`, keyboard operable, `aria-label` reflects current state. Placed in `AppShell` top bar and on `LoginPage`.

### Localization (R17)
- **i18n/I18nContext** (`apps/web/src/i18n/`) — `I18nProvider` + `useT()` returning `t(key, vars?)`. Typed dictionaries `en.ts` and `th.ts` (same key set). Initial language: `localStorage['im.lang']` → `navigator.language` (th→`th`, else `en`). Persists on change. Missing key → English fallback (never raw key).
- **Enum label helpers** — localized display maps for Status, Priority, SlaState, Role; stored enum values unchanged.
- **LanguageSwitch** component — TH/EN segmented control, keyboard operable, `aria-label`. Placed in `AppShell` top bar and on `LoginPage`.
- **Coverage** — all `pages/*` and `components/*` interface strings routed through `t()`. User-entered data (titles, descriptions, notes) not translated.

### Providers wiring
- `main.tsx` wraps the app: `ThemeProvider` + `I18nProvider` around the existing `QueryClientProvider` / router.
