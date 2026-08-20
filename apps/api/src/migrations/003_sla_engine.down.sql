-- Rollback Slice 2 SLA engine.
ALTER TABLE sla_records DROP COLUMN IF EXISTS resolution_met_at;
ALTER TABLE sla_records DROP COLUMN IF EXISTS calendar_id;
ALTER TABLE sla_records DROP COLUMN IF EXISTS policy_name;
ALTER TABLE sla_records DROP COLUMN IF EXISTS policy_id;
DROP TABLE IF EXISTS sla_policies;
DROP TABLE IF EXISTS business_calendars;
