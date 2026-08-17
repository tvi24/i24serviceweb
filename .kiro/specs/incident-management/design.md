# Design Document

## Summary

The Incident Management System is a workshop-grade, full-stack TypeScript application delivering the working scope from `requirements.md`: Web Portal incident intake, local authentication with per-request RBAC, configurable priority/SLA tracking, an in-app Central Alert Center, incident investigation and resolution, CSAT/reopen/closure, KPI dashboards, and append-only audit history. Mail, LINE OA, Phone/Quick Call, and outbound notifications are represented only as documented integration boundaries.

The system is a **monorepo** with a React + Vite single-page app (`apps/web`), a Node.js 24 + Express REST API (`apps/api`), and shared TypeScript types (`packages/shared`). Persistence follows a two-phase build order: Phase 1 the frontend runs against local `.json` mock fixtures through a typed data-access seam; Phase 2 the same seam is backed by an Express API over PostgreSQL 18. The design keeps the frontend contract identical across both phases so the UI is built and validated before the real backend exists.

## Architecture

**Style**: Layered service architecture with a clear seam between presentation, transport, domain logic, and persistence.

```
┌───────────────────────────────────────────────────────────────┐
│ apps/web (React 19 + Vite 6)                                    │
│  Pages → Components → Hooks (TanStack Query) → apiClient        │
│  apiClient targets: Phase 1 = mock JSON loader | Phase 2 = HTTP │
└───────────────────────────────┬───────────────────────────────┘
                                 │ REST/JSON (Bearer JWT)
┌───────────────────────────────▼───────────────────────────────┐
│ apps/api (Node 24 + Express 5)                                  │
│  Routes → Middleware (auth, rbac, validate, error) → Services   │
│  Services (domain rules): intake, classification, assignment,   │
│    sla, alerts, workflow, resolution, csat, kpi, audit          │
│  Repositories (interface) ── memory impl (dev) / pg impl (prod) │
└───────────────────────────────┬───────────────────────────────┘
                                 │ parameterized SQL (pg)
┌───────────────────────────────▼───────────────────────────────┐
│ PostgreSQL 18  (incidents, activities, sla_records, alerts,     │
│  csat, users, audit_events, sla_config, ...)                    │
└─────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions** (from D3):
- Monorepo with npm workspaces; shared domain types in `packages/shared` consumed by both apps.
- Repository interface seam lets the domain services run over an in-memory store (Phase 1 / tests) or PostgreSQL (Phase 2) without code changes above the repository.
- Stateless JWT auth; every protected route runs `authenticate` then `authorize(...)` middleware. RBAC is enforced per request, per resource.
- AI classification is an adapter interface with a deterministic rules/keyword implementation as default and an optional Bedrock implementation behind `AI_PROVIDER=bedrock`.
- SLA, priority matrix, assignment routing, and closure timing are driven by an editable configuration object (seeded with the assessment defaults), never hard-coded in handlers.

## Technology Stack

| Layer | Choice | Version (Aug 2026) |
|---|---|---|
| Runtime | Node.js LTS | 24.x |
| Language | TypeScript | 5.x |
| Frontend | React + Vite | React 19.x / Vite 6.x |
| Routing (web) | React Router | 7.x |
| Server state | TanStack Query | 5.x |
| Backend | Express | 5.x |
| Validation | zod | 3.x |
| DB | PostgreSQL | 18 |
| DB driver | pg (node-postgres) + parameterized SQL + custom migration runner | 8.x |
| Auth | jsonwebtoken (JWT) + Node `crypto.scrypt` salted password hashing | jwt 9.x |
| Logging | pino | 9.x |
| Testing | Vitest + Supertest + React Testing Library | Vitest 4.x |
| Container | Docker + Docker Compose | Compose v2 |

## Traceability

| Requirement | Covered by |
|---|---|
| R1 Web Portal Intake | `intake` service, `POST /incidents`, IntakePage, incidents repo |
| R2 Auth & RBAC | `auth` service, `authenticate`/`authorize` middleware, users repo, LoginPage |
| R3 Classification/Priority + human control | `classification` service + AI adapter, PriorityMatrix config, TriagePanel |
| R4 Assignment & Fallback | `assignment` service, routing config, fallback queue, IncidentWorkspace |
| R5 Configurable SLA | `sla` service, `sla_config`, SLA evaluator/ticker, sla_records |
| R6 Alert Center & Escalation | `alerts` service, `escalation` rules, alerts repo, AlertCenter UI |
| R7 Investigation & Status | `workflow` service, activities repo, WorkNotes/StatusControl |
| R8 Resolution/CSAT/Reopen/Closure | `resolution` + `csat` services, ConfirmationPage, closure job |
| R9 KPI Dashboard | `kpi` service, aggregation queries, DashboardPage |
| R10 Audit & Traceability | `audit` service, append-only audit_events, AuditHistory |
| R11 Integration Boundaries | `design/integration.md` boundary contracts |
| R12 Security & Safe Failure | validate/error middleware, secure config, crypto, `design/nfr.md` |
| R13 Privacy & Data Minimization | synthetic seed data, field scoping, log masking |
| R14 Reliability & Observability | pino logging, `/health`, persistence ordering, testing-strategy |
| R15 Deployment Readiness | Docker Compose, migrations, runbook in `design/operations.md` |

## References

- `design/components.md` — component/service responsibilities and interfaces
- `design/data-model.md` — entities, relationships, PostgreSQL schema
- `design/api-spec.md` — REST endpoints, auth, error contract
- `design/integration.md` — external channel integration boundaries
- `design/implementation.md` — project structure, config, build order
- `design/operations.md` — logging, health/lifecycle, deploy/rollback runbook
- `design/testing-strategy.md` — test approach and requirement coverage
- `design/nfr.md` — security, privacy, reliability controls (OWASP mapping)
- `.kiro/steering/design-system.md` — UI design decisions and token map
- `apps/web/src/styles/tokens.css` — runtime design-token source of truth
