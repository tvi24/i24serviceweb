# Requirement Coverage Map

Maps each requirement group (see `.kiro/specs/incident-management/requirements.md`) to the automated test(s) that assert it. Runner: Vitest. Suites: `packages/shared` (rules), `apps/api` (Supertest integration + maintenance), `apps/web` (RTL components + mock lifecycle).

| Req | Description | Covered by |
|---|---|---|
| R1 | Web Portal intake, ticket id, required fields, idempotency, own-scope | api: intake (create/validate/idempotency/mine); web: mockFlow create/required/idempotency |
| R2 | Local auth + per-request RBAC | api: auth (login/bad-creds/no-token), rbac (403 cases); web: mockFlow invalid creds |
| R3 | Classification/priority recommendation + human control | shared: priority matrix (9 combos), keyword classify; api: triage override; web: mockFlow suggestion |
| R4 | Assignment + fallback routing | shared: routeSupportGroup + null fallback; api: assign auto-route + fallback path |
| R5 | Configurable SLA targets (P1–P4) | shared: computeSlaTargets P2/P3/P4 + default config = BR-03; api: config get/put + RBAC |
| R6 | Alert center + escalation | api: alerts created on P1/P2 triage + status (lifecycle); web: mockFlow alerts |
| R7 | Investigation, notes, status transitions | shared: STATUS_TRANSITIONS; api: notes + status + illegal transition 422 |
| R8 | Resolution/CSAT/reopen/closure | api: resolve (code+note), confirm→closed, CSAT range 422, reopen reason; web: CsatForm reject/accept |
| R9 | KPI dashboard + no-data | api: full lifecycle feeds KPI; web: mockFlow getKpi hasData; DashboardPage no-data state |
| R10 | Audit + traceability | api: lifecycle asserts audit contains created/resolved/closed |
| R11 | Integration boundaries | design/integration.md (documented contracts); channel field on intake |
| R12 | Security, input handling, safe failure | api: validation 400, RBAC 403, generic auth error, error contract with errorId; scrypt hashing |
| R13 | Privacy / data minimization | synthetic fixtures; listUsers strips password; minimal request logging serializers |
| R14 | Reliability + observability | api: /health ok; persist-before-return (intake returns id after insert); structured logs |
| R15 | Deployment readiness | docker-compose.yml + Dockerfiles + migrations up/down + seed (code-complete) |

## Critical tests (must pass before delivery)
intake, authentication, authorization, SLA state transition, alert creation, resolution, reopen, closure, audit, KPI — all covered above and passing.

## Run
- `npm run test` (root) runs shared + api + web suites.
- Per package: `npm run test -w @incident/shared | @incident/api | @incident/web`.

## Verification status
- shared, api (memory backend), web: fully automated + passing.
- PostgreSQL live round-trip: code-complete + type-checked; not executed in the build environment (Docker engine unavailable). Verify with `docker compose up -d --build`.
