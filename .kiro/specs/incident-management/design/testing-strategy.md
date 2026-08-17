# Testing Strategy

Approach: **example-based unit tests for critical rules** (D3-8), plus API integration tests (Supertest) and key component tests (React Testing Library). Runner: **Vitest** across the monorepo. Tests use the in-memory repository and seeded synthetic fixtures. (R14.6/14.7)

## Critical rules under test (unit)

| Area | Cases |
|---|---|
| Priority matrix | impact×urgency → correct P1..P4 for all 9 combinations |
| SLA targets | response/resolution target computation incl. business-day math for P3/P4 |
| SLA state | within_target → at_risk (at threshold %) → breached transitions |
| Assignment routing | classification → support_group; unknown → fallback queue |
| Status transitions | allowed transitions accepted, illegal rejected (422) |
| Resolution | missing code/note rejected; valid → resolved |
| CSAT | rating 1–5 accepted; 0/6/non-int rejected |
| Reopen | requires reason; returns to active workflow |
| RBAC | each role allowed/denied on representative endpoints; reporter sees only own cases |
| Idempotency/duplicate | repeated idempotency key → existing ticket, no new record |

## API integration (Supertest)

- Auth: login success/failure (generic error), protected route without token → 401, wrong role → 403.
- Intake: create → 201 with ticketId; missing fields → 400; duplicate → existing id.
- Full lifecycle: create → triage → assign → note → status → resolve → confirm → csat → close, asserting audit events appended at each step.
- KPI summary returns aggregates and a no-data state for empty filters.
- Config PUT updates SLA and writes audit.

## Component (RTL)

- IntakePage: validation errors shown, ticket id displayed on success.
- IncidentWorkspace: role-gated controls render/omit correctly.
- CsatForm: rejects out-of-range, submits valid rating.
- AlertCenter: lists alerts, acknowledge updates state.
- Empty/loading/error states render for list and dashboard.

## Requirement coverage

Every requirement group R1–R15 maps to at least one test above (critical-rule unit, API integration, or component). A coverage table is maintained in `apps/api/test/coverage-map.md` / `apps/web/test` describing which test asserts each requirement. Critical tests (intake, auth, authorization, SLA transition, alert creation, resolution, reopen, closure, audit, KPI) must pass before delivery is accepted.

## Commands

- `npm run test` (root) → runs api + web + shared test projects once.
- `npm run test -w apps/api`, `-w apps/web` for scoped runs.
- CI-friendly single run (no watch).
