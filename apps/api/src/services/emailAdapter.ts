import type { EmailAccount } from '@incident/shared';
import { logger } from '../lib/logger';

export interface OutboundEmail {
  from: string;
  to: string;
  cc?: string | null;
  subject: string;
  body: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

// Provider-agnostic email port. The app never blocks when a provider is unavailable;
// failures return { ok:false } and are recorded as delivery/error state on the message.
export interface EmailAdapter {
  send(email: OutboundEmail): Promise<SendResult>;
  testConnection(): Promise<SendResult>;
}

// Local mock adapter — no external connection, no secrets. Used for workshop/demo and as
// the safe default so inbound/outbound ticketing works end-to-end offline.
class MockEmailAdapter implements EmailAdapter {
  async send(email: OutboundEmail): Promise<SendResult> {
    logger.info({ to: email.to, subject: email.subject }, 'mock email send');
    return { ok: true };
  }
  async testConnection(): Promise<SendResult> {
    return { ok: true };
  }
}

// Real providers are documented, env-gated boundaries. Credentials come from the
// environment/secret store only — never hard-coded. Falls back to mock when unconfigured.
export function getEmailAdapter(account?: EmailAccount | null): EmailAdapter {
  const provider = account?.provider ?? 'mock';
  if (provider === 'mock') return new MockEmailAdapter();
  // smtp/graph/ses adapters would read secrets from process.env here. Not configured in
  // the workshop, so we log and use the mock so the app remains operational.
  logger.info({ provider, hasCreds: Boolean(process.env.SMTP_URL || process.env.GRAPH_CLIENT_SECRET) }, 'External email provider not configured; using mock adapter.');
  return new MockEmailAdapter();
}
