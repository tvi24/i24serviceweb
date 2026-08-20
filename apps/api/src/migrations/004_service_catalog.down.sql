-- Rollback Slice 3 service catalog + incident dimensions.
ALTER TABLE incidents DROP COLUMN IF EXISTS request_type;
ALTER TABLE incidents DROP COLUMN IF EXISTS service_owner_bu_id;
ALTER TABLE incidents DROP COLUMN IF EXISTS affected_bu_id;
ALTER TABLE incidents DROP COLUMN IF EXISTS requester_bu_id;
ALTER TABLE incidents DROP COLUMN IF EXISTS subcategory;
ALTER TABLE incidents DROP COLUMN IF EXISTS category;
ALTER TABLE incidents DROP COLUMN IF EXISTS service_id;
DROP TABLE IF EXISTS services;
