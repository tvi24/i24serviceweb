import type { AuthUser, EmailMessage, EmailThread, Incident } from '@incident/shared';
import { Errors } from '../lib/errors';
import { uuid } from '../lib/ids';
import type { Repositories } from '../repositories/types';
import { writeAudit } from './auditService';
import { getEmailAdapter } from './emailAdapter';
import { buildDetail, createIncident } from './incidentService';

function now() {
  return new Date().toISOString();
}

// Extract a ticket reference like INC-2026-001007 from a subject/body for thread matching.
function extractTicketRef(text: string): string | null {
  const m = text.match(/INC-\d{4}-\d{6}/i);
  return m ? m[0].toUpperCase() : null;
}

function render(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? vars[k] : `{${k}}`));
}

async function sendAcknowledgement(repos: Repositories, inc: Incident, thread: EmailThread, toAddr: string): Promise<void> {
  const account = (await repos.listEmailAccounts()).find((a) => a.active && a.direction !== 'inbound') ?? (await repos.listEmailAccounts())[0];
  if (!account) return;
  const tpl = await repos.findEmailTemplateByKey('acknowledgement');
  const sla = await repos.findSlaByIncident(inc.id);
  const vars = {
    ticketId: inc.ticketId,
    title: inc.title,
    status: inc.status,
    priority: inc.priority ?? inc.prioritySuggested ?? 'P4',
    slaSummary: sla ? `Response due ${sla.responseTargetAt}, resolution due ${sla.resolutionTargetAt}` : 'SLA will start once triaged.',
    supportName: account.displayName,
  };
  const subject = tpl ? render(tpl.subject, vars) : `[${inc.ticketId}] We received your request`;
  const body = tpl ? render(tpl.body, vars) : `Your incident ${inc.ticketId} has been logged.`;
  await sendOutbound(repos, { threadId: thread.id, incidentId: inc.id, fromAddr: account.address, toAddr, subject, body, visibility: 'public' }, account.id);
}

async function sendOutbound(
  repos: Repositories,
  msg: { threadId: string; incidentId: string; fromAddr: string; toAddr: string; subject: string; body: string; visibility: 'public' | 'internal' },
  accountId: string
): Promise<EmailMessage> {
  const account = await repos.findEmailAccountById(accountId);
  const record: EmailMessage = {
    id: `em-${uuid()}`,
    threadId: msg.threadId,
    incidentId: msg.incidentId,
    direction: 'outbound',
    fromAddr: msg.fromAddr,
    toAddr: msg.toAddr,
    cc: null,
    subject: msg.subject,
    body: msg.body,
    visibility: msg.visibility,
    deliveryState: 'pending',
    processingState: 'linked',
    errorState: null,
    createdAt: now(),
  };
  // Internal notes are never emailed out.
  if (msg.visibility === 'internal') {
    record.deliveryState = 'sent';
    await repos.insertEmailMessage(record);
    return record;
  }
  const adapter = getEmailAdapter(account);
  const result = await adapter.send({ from: msg.fromAddr, to: msg.toAddr, subject: msg.subject, body: msg.body });
  record.deliveryState = result.ok ? 'delivered' : 'failed';
  record.errorState = result.ok ? null : result.error ?? 'send failed';
  await repos.insertEmailMessage(record);
  if (account) {
    account.lastOutboundAt = now();
    await repos.updateEmailAccount(account);
  }
  return record;
}

// Inbound ingestion: match a verified user, then reply-to-ticket (thread match) OR create
// a new incident, acknowledge, and record the whole exchange in the timeline + audit.
export async function ingestInbound(
  repos: Repositories,
  input: { from: string; subject: string; body: string },
  actor?: AuthUser
): Promise<{ action: 'linked' | 'created'; incidentId: string; ticketId: string }> {
  const fromAddr = input.from.trim().toLowerCase();
  const emails = await repos.listUserEmails();
  const match = emails.find((e) => e.isVerified && e.active && e.emailAddress.toLowerCase() === fromAddr);
  if (!match) throw Errors.validation('Sender is not a verified user.', { from: 'No verified user for this email address.' });
  const user = await repos.findUserById(match.userId);
  if (!user) throw Errors.validation('Sender is not a verified user.', { from: 'No user for this email.' });
  const senderActor: AuthUser = actor ?? { id: user.id, username: user.username, displayName: user.displayName, roles: user.roles, supportGroup: user.supportGroup };

  const ref = extractTicketRef(`${input.subject} ${input.body}`);
  const account = (await repos.listEmailAccounts()).find((a) => a.active) ?? null;

  // Reply-to-ticket: reliable thread match on ticket reference.
  if (ref) {
    const thread = await repos.findEmailThreadByReference(ref);
    if (thread?.incidentId) {
      const inc = await repos.findIncidentById(thread.incidentId);
      if (inc) {
        const inbound: EmailMessage = {
          id: `em-${uuid()}`, threadId: thread.id, incidentId: inc.id, direction: 'inbound',
          fromAddr, toAddr: account?.address ?? 'support@mgc.demo', cc: null, subject: input.subject, body: input.body,
          visibility: 'public', deliveryState: 'received', processingState: 'linked', errorState: null, createdAt: now(),
        };
        await repos.insertEmailMessage(inbound);
        await repos.insertActivity({ id: uuid(), incidentId: inc.id, type: 'work_note', authorId: user.id, note: `Email reply from ${fromAddr}: ${input.subject}`, createdAt: now() });
        if (account) { account.lastInboundAt = now(); await repos.updateEmailAccount(account); }
        await writeAudit(repos, { action: 'email.inbound.linked', targetType: 'incident', targetId: inc.id, actor: senderActor, detail: { ref, from: fromAddr } });
        return { action: 'linked', incidentId: inc.id, ticketId: inc.ticketId };
      }
    }
  }

  // New incident from email.
  const created = await createIncident(repos, { title: input.subject || '(no subject)', description: input.body, channel: 'mail' }, undefined, senderActor);
  const thread: EmailThread = { id: `eth-${uuid()}`, incidentId: created.id, reference: created.ticketId, subject: input.subject, createdAt: now() };
  await repos.insertEmailThread(thread);
  const inbound: EmailMessage = {
    id: `em-${uuid()}`, threadId: thread.id, incidentId: created.id, direction: 'inbound',
    fromAddr, toAddr: account?.address ?? 'support@mgc.demo', cc: null, subject: input.subject, body: input.body,
    visibility: 'public', deliveryState: 'received', processingState: 'created_incident', errorState: null, createdAt: now(),
  };
  await repos.insertEmailMessage(inbound);
  if (account) { account.lastInboundAt = now(); await repos.updateEmailAccount(account); }
  await writeAudit(repos, { action: 'email.inbound.created', targetType: 'incident', targetId: created.id, actor: senderActor, detail: { from: fromAddr, ticketId: created.ticketId } });

  const inc = await repos.findIncidentById(created.id);
  if (inc) await sendAcknowledgement(repos, inc, thread, fromAddr);
  return { action: 'created', incidentId: created.id, ticketId: created.ticketId };
}

// Agent reply: public reply emails the requester; internal note is timeline-only.
export async function agentReply(
  repos: Repositories,
  incidentId: string,
  input: { body: string; visibility: 'public' | 'internal' },
  actor: AuthUser
): Promise<EmailMessage> {
  const inc = await repos.findIncidentById(incidentId);
  if (!inc) throw Errors.notFound('Incident not found.');
  if (!input.body?.trim()) throw Errors.validation('Message body is required.', { body: 'Required.' });

  let thread = await repos.findEmailThreadByIncident(incidentId);
  const account = (await repos.listEmailAccounts()).find((a) => a.active) ?? null;
  if (!thread) {
    thread = { id: `eth-${uuid()}`, incidentId, reference: inc.ticketId, subject: inc.title, createdAt: now() };
    await repos.insertEmailThread(thread);
  }
  const reporter = await repos.findUserById(inc.reporterId);
  const reporterEmails = reporter ? await repos.listUserEmailsByUser(reporter.id) : [];
  const toAddr = reporterEmails.find((e) => e.isPrimary)?.emailAddress ?? reporterEmails[0]?.emailAddress ?? 'reporter@mgc.demo';

  const msg = await sendOutbound(
    repos,
    { threadId: thread.id, incidentId, fromAddr: account?.address ?? 'support@mgc.demo', toAddr, subject: `[${inc.ticketId}] ${inc.title}`, body: input.body.trim(), visibility: input.visibility },
    account?.id ?? 'mail-support'
  );
  await repos.insertActivity({ id: uuid(), incidentId, type: 'work_note', authorId: actor.id, note: `${input.visibility === 'internal' ? 'Internal note' : 'Public reply'}: ${input.body.trim().slice(0, 200)}`, createdAt: now() });
  await writeAudit(repos, { action: input.visibility === 'internal' ? 'email.internal_note' : 'email.public_reply', targetType: 'incident', targetId: incidentId, actor, detail: { deliveryState: msg.deliveryState } });
  return msg;
}

export async function listIncidentEmails(repos: Repositories, incidentId: string): Promise<EmailMessage[]> {
  return repos.listEmailMessagesByIncident(incidentId);
}

// ---- Email account console ----
export async function listEmailAccounts(repos: Repositories) {
  return repos.listEmailAccounts();
}

export async function testConnection(repos: Repositories, accountId: string, actor: AuthUser) {
  const account = await repos.findEmailAccountById(accountId);
  if (!account) throw Errors.notFound('Email account not found.');
  const result = await getEmailAdapter(account).testConnection();
  account.status = result.ok ? 'connected' : 'error';
  await repos.updateEmailAccount(account);
  await writeAudit(repos, { action: 'email.account.test', targetType: 'config', targetId: accountId, actor, detail: { ok: result.ok } });
  return { ok: result.ok, status: account.status };
}

export async function sendTestEmail(repos: Repositories, accountId: string, toAddr: string, actor: AuthUser) {
  const account = await repos.findEmailAccountById(accountId);
  if (!account) throw Errors.notFound('Email account not found.');
  if (!toAddr?.trim()) throw Errors.validation('Recipient is required.', { to: 'Required.' });
  const result = await getEmailAdapter(account).send({ from: account.address, to: toAddr.trim(), subject: 'Test email', body: 'This is a test email from the Incident Management platform.' });
  account.lastOutboundAt = now();
  account.status = result.ok ? 'connected' : 'error';
  await repos.updateEmailAccount(account);
  await writeAudit(repos, { action: 'email.account.send_test', targetType: 'config', targetId: accountId, actor, detail: { ok: result.ok, to: toAddr.trim() } });
  return { ok: result.ok };
}

// re-export for detail rebuilds if needed
export { buildDetail };
