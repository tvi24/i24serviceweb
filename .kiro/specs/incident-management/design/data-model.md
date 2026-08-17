# Data Model

All identifiers are UUID v4 unless noted. Timestamps are `timestamptz` (UTC). Monetary/time SLA values are stored in seconds/minutes as noted. No real personal data — all seed data is synthetic.

## Entities

### users
Predefined synthetic accounts. Passwords stored as salted scrypt hashes (`hash` + `salt`), never plaintext.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| username | text UNIQUE NOT NULL | login id |
| display_name | text NOT NULL | |
| password_hash | text NOT NULL | scrypt derived key (hex) |
| password_salt | text NOT NULL | random salt (hex) |
| roles | text[] NOT NULL | subset of {business_user, service_desk, application_support, infrastructure_support, manager, management} |
| support_group | text NULL | for support roles (application / infrastructure) |
| is_active | boolean NOT NULL default true | |
| created_at | timestamptz NOT NULL default now() | |

### incidents
The Ticket / Case record.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| ticket_id | text UNIQUE NOT NULL | human id, e.g. `INC-2026-000123` |
| title | text NOT NULL | |
| description | text NOT NULL | |
| reporter_id | uuid FK→users(id) NOT NULL | |
| channel | text NOT NULL default 'web_portal' | future: mail/line/phone |
| classification | text NULL | authorized value |
| classification_suggested | text NULL | AI/rules recommendation |
| impact | text NULL | high/medium/low |
| urgency | text NULL | high/medium/low |
| priority | text NULL | P1..P4 authorized value |
| priority_suggested | text NULL | recommendation |
| ai_source | text NULL | rules \| bedrock |
| status | text NOT NULL default 'new' | see status enum below |
| support_group | text NULL | assigned group |
| assigned_owner_id | uuid FK→users(id) NULL | |
| resolution_code | text NULL | required to resolve |
| resolution_note | text NULL | required to resolve |
| reopen_reason | text NULL | last reopen reason |
| idempotency_key | text NULL | dedupe intake |
| created_at | timestamptz NOT NULL default now() | |
| updated_at | timestamptz NOT NULL default now() | |
| resolved_at | timestamptz NULL | |
| closed_at | timestamptz NULL | |

Status enum: `new`, `triaged`, `assigned`, `in_progress`, `pending`, `resolved`, `reopened`, `closed`, `fallback`.

Unique partial index on `idempotency_key` where not null.

### activities
Work notes and status changes (Case history, chronological).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| incident_id | uuid FK→incidents(id) NOT NULL | |
| type | text NOT NULL | work_note \| status_change \| assignment \| resolution \| reopen |
| author_id | uuid FK→users(id) NOT NULL | |
| note | text NULL | |
| from_status | text NULL | |
| to_status | text NULL | |
| created_at | timestamptz NOT NULL default now() | |

### sla_records
Per-incident SLA tracking (one row per incident; response + resolution tracked in columns).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| incident_id | uuid FK→incidents(id) UNIQUE NOT NULL | |
| priority | text NOT NULL | snapshot at tracking start |
| response_target_at | timestamptz NOT NULL | |
| resolution_target_at | timestamptz NOT NULL | |
| response_at | timestamptz NULL | first work / acknowledge |
| response_state | text NOT NULL default 'within_target' | within_target \| at_risk \| breached |
| resolution_state | text NOT NULL default 'within_target' | within_target \| at_risk \| breached |
| started_at | timestamptz NOT NULL default now() | |

### alerts
Central Alert Center entries.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| incident_id | uuid FK→incidents(id) NOT NULL | |
| type | text NOT NULL | priority \| sla_at_risk \| sla_breach \| status \| escalation |
| severity | text NOT NULL | info \| warning \| danger |
| message | text NOT NULL | |
| recipient_role | text NULL | target role |
| recipient_id | uuid FK→users(id) NULL | target user (e.g. assigned owner) |
| acknowledged_at | timestamptz NULL | |
| acknowledged_by | uuid FK→users(id) NULL | |
| created_at | timestamptz NOT NULL default now() | |

### csat
Satisfaction and confirmation.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| incident_id | uuid FK→incidents(id) UNIQUE NOT NULL | |
| confirmed_at | timestamptz NULL | reporter confirmed resolution |
| rating | int NULL CHECK (rating BETWEEN 1 AND 5) | |
| comment | text NULL | |
| reminder_count | int NOT NULL default 0 | |
| last_reminder_at | timestamptz NULL | |
| submitted_at | timestamptz NULL | |

### audit_events
Append-only. No updates or deletes permitted by the application layer.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| actor_id | uuid NULL | user id or null for system |
| actor_label | text NOT NULL | masked/display label |
| action | text NOT NULL | e.g. incident.created, sla.config.changed |
| target_type | text NOT NULL | incident \| alert \| config \| auth |
| target_id | text NULL | |
| detail | jsonb NULL | non-sensitive structured detail |
| created_at | timestamptz NOT NULL default now() | |

### sla_config (single-row configuration)
Editable workshop configuration; seeded with assessment defaults.

| Column | Type | Notes |
|---|---|---|
| id | int PK default 1 (single row) | |
| targets | jsonb NOT NULL | `{ "P1": {"response_min":15,"resolution_min":240}, "P2": {...}, "P3": {"response_min":240,"resolution_bd":3}, "P4": {"response_min":480,"resolution_bd":5} }` |
| at_risk_pct | int NOT NULL default 80 | at-risk threshold as % of target elapsed |
| priority_matrix | jsonb NOT NULL | impact×urgency → P1..P4 |
| routing_rules | jsonb NOT NULL | classification → support_group |
| closure_grace_hours | int NOT NULL default 72 | auto-close window after resolved |
| reminder_max | int NOT NULL default 3 | max CSAT reminders |
| updated_at | timestamptz NOT NULL default now() | |
| updated_by | uuid NULL | |

## Relationships

- `incidents.reporter_id` → users. `incidents.assigned_owner_id` → users.
- `activities.incident_id`, `sla_records.incident_id`, `alerts.incident_id`, `csat.incident_id` → incidents (cascade on delete only in dev seed; production keeps history).
- `audit_events` references targets loosely by `target_id` (no FK) to stay append-only and decoupled.

## Default configuration seed

```json
{
  "targets": {
    "P1": { "response_min": 15,  "resolution_min": 240 },
    "P2": { "response_min": 30,  "resolution_min": 480 },
    "P3": { "response_min": 240, "resolution_bd": 3 },
    "P4": { "response_min": 480, "resolution_bd": 5 }
  },
  "at_risk_pct": 80,
  "priority_matrix": {
    "high-high": "P1", "high-medium": "P2", "high-low": "P3",
    "medium-high": "P2", "medium-medium": "P3", "medium-low": "P4",
    "low-high": "P3", "low-medium": "P4", "low-low": "P4"
  },
  "routing_rules": {
    "application": "application_support",
    "infrastructure": "infrastructure_support",
    "network": "infrastructure_support",
    "access": "service_desk"
  },
  "closure_grace_hours": 72,
  "reminder_max": 3
}
```

Business-day (`resolution_bd`) targets count only Mon–Fri working days when computing `resolution_target_at`.
