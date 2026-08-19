-- Incident Management schema (PostgreSQL 18)
-- Note: application IDs are opaque strings (e.g. 'u-emma', 'i-1001', or a UUID from
-- randomUUID()). Columns holding these IDs are `text`, not `uuid`, so both the
-- synthetic seed IDs and runtime-generated IDs are valid.

CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY,
  username      text UNIQUE NOT NULL,
  display_name  text NOT NULL,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  roles         text[] NOT NULL,
  support_group text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id                      text PRIMARY KEY,
  ticket_id               text UNIQUE NOT NULL,
  title                   text NOT NULL,
  description             text NOT NULL,
  reporter_id             text NOT NULL REFERENCES users(id),
  channel                 text NOT NULL DEFAULT 'web_portal',
  classification          text,
  classification_suggested text,
  impact                  text,
  urgency                 text,
  priority                text,
  priority_suggested      text,
  ai_source               text,
  status                  text NOT NULL DEFAULT 'new',
  support_group           text,
  assigned_owner_id       text REFERENCES users(id),
  resolution_code         text,
  resolution_note         text,
  reopen_reason           text,
  idempotency_key         text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  resolved_at             timestamptz,
  closed_at               timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS incidents_idempotency_key_uq ON incidents (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS incidents_status_idx ON incidents (status);
CREATE INDEX IF NOT EXISTS incidents_reporter_idx ON incidents (reporter_id);

CREATE TABLE IF NOT EXISTS activities (
  id          text PRIMARY KEY,
  incident_id text NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  type        text NOT NULL,
  author_id   text NOT NULL REFERENCES users(id),
  note        text,
  from_status text,
  to_status   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activities_incident_idx ON activities (incident_id);

CREATE TABLE IF NOT EXISTS sla_records (
  id                    text PRIMARY KEY,
  incident_id           text UNIQUE NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  priority              text NOT NULL,
  response_target_at    timestamptz NOT NULL,
  resolution_target_at  timestamptz NOT NULL,
  response_at           timestamptz,
  response_state        text NOT NULL DEFAULT 'within_target',
  resolution_state      text NOT NULL DEFAULT 'within_target',
  started_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id              text PRIMARY KEY,
  incident_id     text NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  type            text NOT NULL,
  severity        text NOT NULL,
  message         text NOT NULL,
  recipient_role  text,
  recipient_id    text REFERENCES users(id),
  acknowledged_at timestamptz,
  acknowledged_by text REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS alerts_incident_idx ON alerts (incident_id);

CREATE TABLE IF NOT EXISTS csat (
  id             text PRIMARY KEY,
  incident_id    text UNIQUE NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  confirmed_at   timestamptz,
  rating         int CHECK (rating BETWEEN 1 AND 5),
  comment        text,
  reminder_count int NOT NULL DEFAULT 0,
  last_reminder_at timestamptz,
  submitted_at   timestamptz
);

CREATE TABLE IF NOT EXISTS audit_events (
  id          text PRIMARY KEY,
  actor_id    text,
  actor_label text NOT NULL,
  action      text NOT NULL,
  target_type text NOT NULL,
  target_id   text,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_target_idx ON audit_events (target_type, target_id);

CREATE TABLE IF NOT EXISTS sla_config (
  id                 int PRIMARY KEY DEFAULT 1,
  targets            jsonb NOT NULL,
  at_risk_pct        int NOT NULL DEFAULT 80,
  priority_matrix    jsonb NOT NULL,
  routing_rules      jsonb NOT NULL,
  closure_grace_hours int NOT NULL DEFAULT 72,
  reminder_max       int NOT NULL DEFAULT 3,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  updated_by         text,
  CONSTRAINT sla_config_singleton CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS ticket_seq (
  id  int PRIMARY KEY DEFAULT 1,
  val int NOT NULL DEFAULT 1006,
  CONSTRAINT ticket_seq_singleton CHECK (id = 1)
);
