import type { EmailAccount, EmailTemplate } from '../types.js';

// Synthetic email accounts. Provider 'mock' = local in-memory adapter (no external
// connection, no secrets). Real providers (smtp/graph/ses) are env-gated boundaries.
export const emailAccounts: EmailAccount[] = [
  {
    id: 'mail-support',
    name: 'Support Mailbox',
    address: 'support@mgc.demo',
    displayName: 'MGC Service Desk',
    provider: 'mock',
    direction: 'both',
    authType: 'none',
    status: 'connected',
    lastInboundAt: null,
    lastOutboundAt: null,
    active: true,
  },
];

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'tpl-ack',
    key: 'acknowledgement',
    subject: '[{ticketId}] We received your request: {title}',
    body: 'Hello,\n\nYour incident has been logged as {ticketId} ({title}).\nStatus: {status} | Priority: {priority}\n{slaSummary}\n\nYou can track it in the portal. Please reply to this email to add information.\n\n— {supportName}',
  },
  {
    id: 'tpl-resolved',
    key: 'resolved',
    subject: '[{ticketId}] Your request has been resolved',
    body: 'Hello,\n\nIncident {ticketId} ({title}) has been marked resolved.\nPlease confirm the resolution or reply to reopen.\n\n— {supportName}',
  },
];
