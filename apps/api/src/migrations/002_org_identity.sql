-- Product Refinement v3.0 — Slice 1: Organization & Identity Foundation.
-- Additive only. New columns on users are nullable so existing rows/tests stay valid.

CREATE TABLE IF NOT EXISTS organizations (
  id        text PRIMARY KEY,
  name      text NOT NULL,
  type      text NOT NULL,               -- group | company
  parent_id text REFERENCES organizations(id),
  active    boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS business_units (
  id         text PRIMARY KEY,
  org_id     text NOT NULL REFERENCES organizations(id),
  code       text NOT NULL,
  name       text NOT NULL,
  manager_id text,
  active     boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS business_units_org_idx ON business_units (org_id);

CREATE TABLE IF NOT EXISTS departments (
  id     text PRIMARY KEY,
  bu_id  text NOT NULL REFERENCES business_units(id),
  name   text NOT NULL,
  active boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS departments_bu_idx ON departments (bu_id);

CREATE TABLE IF NOT EXISTS locations (
  id        text PRIMARY KEY,
  name      text NOT NULL,
  time_zone text NOT NULL,
  active    boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_emails (
  id            text PRIMARY KEY,
  user_id       text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_address text NOT NULL,
  email_type    text NOT NULL DEFAULT 'work',   -- work | personal | alternate
  is_primary    boolean NOT NULL DEFAULT false,
  is_verified   boolean NOT NULL DEFAULT false,
  verified_at   timestamptz,
  active        boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS user_emails_user_idx ON user_emails (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_emails_verified_uq ON user_emails (lower(email_address)) WHERE is_verified;

-- Additive profile columns on users (all nullable).
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title          text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bu_id              text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id      text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id         text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_id        text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url         text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS time_zone          text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_channel  text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at      timestamptz;
