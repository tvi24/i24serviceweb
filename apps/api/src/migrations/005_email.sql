-- Product Refinement v3.0 — Slice 4: Email ticketing (adapter-based, provider-agnostic).
-- Secrets are never stored here; provider credentials come from environment only.

CREATE TABLE IF NOT EXISTS email_accounts (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  address         text NOT NULL,
  display_name    text NOT NULL,
  provider        text NOT NULL DEFAULT 'mock',
  direction       text NOT NULL DEFAULT 'both',
  auth_type       text NOT NULL DEFAULT 'none',
  status          text NOT NULL DEFAULT 'connected',
  last_inbound_at  timestamptz,
  last_outbound_at timestamptz,
  active          boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS email_templates (
  id      text PRIMARY KEY,
  key     text UNIQUE NOT NULL,
  subject text NOT NULL,
  body    text NOT NULL
);

CREATE TABLE IF NOT EXISTS email_threads (
  id          text PRIMARY KEY,
  incident_id text REFERENCES incidents(id) ON DELETE SET NULL,
  reference   text NOT NULL,
  subject     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_threads_ref_idx ON email_threads (reference);
CREATE INDEX IF NOT EXISTS email_threads_incident_idx ON email_threads (incident_id);

CREATE TABLE IF NOT EXISTS email_messages (
  id               text PRIMARY KEY,
  thread_id        text NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
  incident_id      text REFERENCES incidents(id) ON DELETE SET NULL,
  direction        text NOT NULL,
  from_addr        text NOT NULL,
  to_addr          text NOT NULL,
  cc               text,
  subject          text NOT NULL,
  body             text NOT NULL,
  visibility       text NOT NULL DEFAULT 'public',
  delivery_state   text NOT NULL DEFAULT 'pending',
  processing_state text NOT NULL DEFAULT 'new',
  error_state      text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_messages_incident_idx ON email_messages (incident_id);
CREATE INDEX IF NOT EXISTS email_messages_thread_idx ON email_messages (thread_id);
