-- Product Refinement v3.0 — Slice 3: Service catalog + incident service/BU dimensions.
-- Additive. New incident columns are nullable so legacy rows/tests stay valid.

CREATE TABLE IF NOT EXISTS services (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  owner_bu_id text,
  active      boolean NOT NULL DEFAULT true
);

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS service_id          text;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS category            text;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS subcategory         text;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS requester_bu_id     text;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS affected_bu_id      text;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS service_owner_bu_id text;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS request_type        text;
CREATE INDEX IF NOT EXISTS incidents_requester_bu_idx ON incidents (requester_bu_id);
CREATE INDEX IF NOT EXISTS incidents_service_idx ON incidents (service_id);
