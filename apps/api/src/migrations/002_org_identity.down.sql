-- Rollback Slice 1 org & identity.
ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;
ALTER TABLE users DROP COLUMN IF EXISTS preferred_channel;
ALTER TABLE users DROP COLUMN IF EXISTS preferred_language;
ALTER TABLE users DROP COLUMN IF EXISTS time_zone;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE users DROP COLUMN IF EXISTS location_id;
ALTER TABLE users DROP COLUMN IF EXISTS manager_id;
ALTER TABLE users DROP COLUMN IF EXISTS department_id;
ALTER TABLE users DROP COLUMN IF EXISTS bu_id;
ALTER TABLE users DROP COLUMN IF EXISTS job_title;

DROP TABLE IF EXISTS user_emails;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS business_units;
DROP TABLE IF EXISTS organizations;
