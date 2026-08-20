-- Product Refinement v3.0 — Slice 2: Configurable SLA policy engine + business calendars.
-- Additive. New sla_records columns are nullable so legacy records/tests stay valid.

CREATE TABLE IF NOT EXISTS business_calendars (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  time_zone  text NOT NULL DEFAULT 'Asia/Bangkok',
  mode       text NOT NULL DEFAULT '24x7',      -- business_hours | 24x7
  work_days  int[] NOT NULL DEFAULT '{1,2,3,4,5}',
  work_start text NOT NULL DEFAULT '09:00',
  work_end   text NOT NULL DEFAULT '18:00',
  holidays   text[] NOT NULL DEFAULT '{}',
  active     boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS sla_policies (
  id                  text PRIMARY KEY,
  name                text NOT NULL,
  bu_id               text,
  service_id          text,
  priority            text,
  request_type        text,
  response_target_min int NOT NULL,
  resolution_min      int,
  resolution_bd       int,
  calendar_id         text REFERENCES business_calendars(id),
  warning_pct         int NOT NULL DEFAULT 80,
  effective_from      timestamptz,
  effective_to        timestamptz,
  active              boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS sla_policies_match_idx ON sla_policies (priority, bu_id, service_id);

-- Enrich the SLA instance record.
ALTER TABLE sla_records ADD COLUMN IF NOT EXISTS policy_id         text;
ALTER TABLE sla_records ADD COLUMN IF NOT EXISTS policy_name       text;
ALTER TABLE sla_records ADD COLUMN IF NOT EXISTS calendar_id       text;
ALTER TABLE sla_records ADD COLUMN IF NOT EXISTS resolution_met_at timestamptz;
