# API Specification

Base path: `/api`. All request/response bodies are JSON. All timestamps ISO-8601 UTC.

## Authentication

- `POST /api/auth/login` → `{ token, user }`. Body `{ username, password }`.
- JWT sent as `Authorization: Bearer <token>` on every protected request.
- Token claims: `sub` (user id), `username`, `roles[]`, `support_group?`, `exp` (short-lived, e.g. 8h workshop).
- `GET /api/auth/me` → current user profile (from token). Protected.

### Middleware order (protected routes)
`authenticate` → `authorize(roles/permission)` → `validate(zod schema)` → handler → `errorHandler`.

## Error contract

All errors return:
```json
{ "error": { "code": "string", "message": "non-technical", "errorId": "uuid", "fields": { "field": "reason" } } }
```
- `400 validation_error`, `401 unauthenticated`, `403 forbidden`, `404 not_found`, `409 duplicate` / `conflict`, `422 business_rule`, `500 internal_error`.
- `500` never leaks stack traces; `errorId` is logged with the stack server-side for tracing.

## Endpoints

### Incidents / Intake
| Method | Path | Roles | Purpose | Req |
|---|---|---|---|---|
| POST | /api/incidents | business_user, service_desk | Create ticket (intake). Header `Idempotency-Key` optional. Returns `{ ticketId, id, duplicateWarning? }` | R1, R14 |
| GET | /api/incidents | service_desk, support, manager, management | List/filter (status, priority, group, owner, mine) | R1, R7 |
| GET | /api/incidents/mine | business_user | Reporter's own cases only | R1 |
| GET | /api/incidents/:id | authorized viewer of that case | Case detail incl. sla, activities, alerts | R7 |

### Triage / Classification / Priority
| Method | Path | Roles | Purpose | Req |
|---|---|---|---|---|
| GET | /api/incidents/:id/suggestions | service_desk | AI/rules classification+priority recommendation (labeled) | R3 |
| PATCH | /api/incidents/:id/triage | service_desk | Confirm/override classification, impact, urgency, priority | R3 |

### Assignment
| Method | Path | Roles | Purpose | Req |
|---|---|---|---|---|
| POST | /api/incidents/:id/assign | service_desk, manager | Assign support_group / owner (auto by rules or manual). Fallback recorded | R4 |

### Workflow / Investigation
| Method | Path | Roles | Purpose | Req |
|---|---|---|---|---|
| POST | /api/incidents/:id/notes | assigned support, manager | Add work note | R7 |
| PATCH | /api/incidents/:id/status | assigned support, manager | Permitted status transition | R7 |

### Resolution / CSAT / Reopen / Closure
| Method | Path | Roles | Purpose | Req |
|---|---|---|---|---|
| POST | /api/incidents/:id/resolve | assigned support, manager | Requires resolution_code + resolution_note | R8 |
| POST | /api/incidents/:id/confirm | reporter | Reporter confirms resolution | R8 |
| POST | /api/incidents/:id/csat | reporter | Submit rating 1–5 (+comment) | R8 |
| POST | /api/incidents/:id/reopen | reporter | Requires reason; returns case to active workflow | R8 |
| POST | /api/incidents/:id/close | service_desk, manager | Close when conditions met | R8 |

### Alerts (Central Alert Center)
| Method | Path | Roles | Purpose | Req |
|---|---|---|---|---|
| GET | /api/alerts | authenticated (scoped to recipient) | List alerts for current user/role | R6 |
| POST | /api/alerts/:id/ack | recipient | Acknowledge alert | R6 |

### KPI
| Method | Path | Roles | Purpose | Req |
|---|---|---|---|---|
| GET | /api/kpi/summary | manager, management | Counts by status/priority, SLA compliance/breach, aging, reopen, avg CSAT, recurring, trend. Query filters. Returns no-data state when empty | R9 |

### Config (SLA / rules)
| Method | Path | Roles | Purpose | Req |
|---|---|---|---|---|
| GET | /api/config/sla | manager, service_desk | Read editable SLA/priority/routing config | R5 |
| PUT | /api/config/sla | manager | Update config (audited) | R5 |

### Audit
| Method | Path | Roles | Purpose | Req |
|---|---|---|---|---|
| GET | /api/incidents/:id/audit | manager, service_desk, auditor roles | Chronological audit events for a case | R10 |

### System
| Method | Path | Roles | Purpose | Req |
|---|---|---|---|---|
| GET | /api/health | public | Liveness/readiness, no sensitive detail | R14, R15 |

## Validation (zod) highlights
- Intake: `title` 1–200, `description` 1–5000, required; unknown fields stripped.
- CSAT rating: integer 1–5 (reject otherwise → 422).
- Resolve: `resolution_code` in configured set, `resolution_note` non-empty.
- Reopen: `reason` non-empty.
- Status transitions validated against an allowed-transition map; invalid → 422 with non-technical message.

## RBAC matrix (summary)
- business_user: create incident, view own, confirm/csat/reopen own.
- service_desk: view all, triage, assign, close, read config/audit.
- application_support / infrastructure_support: view assigned-group cases, notes, status, resolve.
- manager: all support ops + assign + config write + KPI + audit.
- management: KPI read-only.
Every protected handler re-checks resource ownership/group, not just role.
