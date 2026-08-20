import {
  routeSupportGroup,
  STATUS_TRANSITIONS,
  type Activity,
  type AssignRequest,
  type AuthUser,
  type Csat,
  type CsatRequest,
  type Incident,
  type IncidentDetail,
  type IncidentFilters,
  type IncidentStatus,
  type IntakeResponse,
  type ResolveRequest,
  type Suggestion,
  type TriageRequest,
} from '@incident/shared';
import { Errors } from '../lib/errors';
import { makeTicketId, uuid } from '../lib/ids';
import type { Repositories } from '../repositories/types';
import { suggest } from './aiAdapter';
import { createAlert } from './alertService';
import { writeAudit } from './auditService';
import { markResponded, startSlaTracking } from './slaService';

function now() {
  return new Date().toISOString();
}

async function userBrief(repos: Repositories, id?: string | null) {
  if (!id) return null;
  const u = await repos.findUserById(id);
  return u ? { id: u.id, displayName: u.displayName, username: u.username } : null;
}

export async function buildDetail(repos: Repositories, inc: Incident): Promise<IncidentDetail> {
  return {
    ...inc,
    reporter: await userBrief(repos, inc.reporterId),
    owner: await userBrief(repos, inc.assignedOwnerId),
    sla: await repos.findSlaByIncident(inc.id),
    activities: await repos.listActivitiesByIncident(inc.id),
    alerts: await repos.listAlertsByIncident(inc.id),
    csat: await repos.findCsatByIncident(inc.id),
  };
}

function assertViewable(inc: Incident, actor: AuthUser) {
  const onlyReporter = actor.roles.length === 1 && actor.roles[0] === 'business_user';
  if (onlyReporter && inc.reporterId !== actor.id) {
    throw Errors.forbidden('You can only view your own incidents.');
  }
}

export async function listIncidents(repos: Repositories, filters: IncidentFilters, actor: AuthUser): Promise<Incident[]> {
  // Business users are always scoped to their own incidents.
  const onlyReporter = actor.roles.length === 1 && actor.roles[0] === 'business_user';
  const effective: IncidentFilters = { ...filters };
  if (onlyReporter || filters.mine) effective.reporterId = actor.id;
  return repos.listIncidents(effective);
}

export async function getIncidentDetail(repos: Repositories, id: string, actor: AuthUser): Promise<IncidentDetail> {
  const inc = await repos.findIncidentById(id);
  if (!inc) throw Errors.notFound('Incident not found.');
  assertViewable(inc, actor);
  return buildDetail(repos, inc);
}

export async function createIncident(
  repos: Repositories,
  payload: { title: string; description: string; impact?: string; urgency?: string; channel?: string; serviceId?: string | null; category?: string | null; subcategory?: string | null },
  idempotencyKey: string | undefined,
  actor: AuthUser
): Promise<IntakeResponse> {
  const fields: Record<string, string> = {};
  if (!payload.title || payload.title.trim().length === 0) fields.title = 'Title is required.';
  if (!payload.description || payload.description.trim().length === 0) fields.description = 'Description is required.';
  if (Object.keys(fields).length > 0) throw Errors.validation('Please provide the required information.', fields);

  if (idempotencyKey) {
    const existing = await repos.findIncidentByIdempotencyKey(idempotencyKey);
    if (existing) return { id: existing.id, ticketId: existing.ticketId, duplicateWarning: 'This request was already submitted.' };
  }
  const dup = await repos.findOpenIncidentByReporterTitle(actor.id, payload.title);

  const config = await repos.getSlaConfig();
  const suggestion = await suggest({ title: payload.title, description: payload.description }, config);
  const impact = (payload.impact as any) || 'medium';
  const urgency = (payload.urgency as any) || 'medium';

  const seq = await repos.nextTicketSeq();
  // Stamp organizational context: requester BU from the reporter's profile, and the
  // service-owner BU from the selected service (kept visible even when unset).
  const reporter = await repos.findUserById(actor.id);
  let serviceOwnerBuId: string | null = null;
  if (payload.serviceId) {
    const svc = await repos.findServiceById(payload.serviceId);
    serviceOwnerBuId = svc?.ownerBuId ?? null;
  }
  const inc: Incident = {
    id: uuid(),
    ticketId: makeTicketId(seq),
    title: payload.title.trim(),
    description: payload.description.trim(),
    reporterId: actor.id,
    channel: (payload.channel as any) || 'web_portal',
    classification: null,
    classificationSuggested: suggestion.classification,
    impact: payload.impact ? (impact as any) : null,
    urgency: payload.urgency ? (urgency as any) : null,
    priority: null,
    prioritySuggested: suggestion.priority,
    aiSource: suggestion.source,
    status: 'new',
    supportGroup: null,
    assignedOwnerId: null,
    serviceId: payload.serviceId ?? null,
    category: payload.category ?? null,
    subcategory: payload.subcategory ?? null,
    requesterBuId: reporter?.buId ?? null,
    affectedBuId: reporter?.buId ?? null,
    serviceOwnerBuId,
    requestType: 'incident',
    idempotencyKey: idempotencyKey ?? null,
    createdAt: now(),
    updatedAt: now(),
  };
  await repos.insertIncident(inc);
  await writeAudit(repos, { action: 'incident.created', targetType: 'incident', targetId: inc.id, actor, detail: { ticketId: inc.ticketId } });

  return { id: inc.id, ticketId: inc.ticketId, duplicateWarning: dup ? `A similar open incident exists (${dup.ticketId}).` : undefined };
}

export async function getMySlaSummary(repos: Repositories, actor: AuthUser) {
  const mine = await repos.listIncidents({ reporterId: actor.id });
  let withinTarget = 0;
  let atRisk = 0;
  let breached = 0;
  let open = 0;
  let tracked = 0;
  for (const inc of mine) {
    if (inc.status !== 'closed' && inc.status !== 'resolved') open += 1;
    const sla = await repos.findSlaByIncident(inc.id);
    if (!sla) continue;
    tracked += 1;
    const worst = sla.resolutionState === 'breached' || sla.responseState === 'breached'
      ? 'breached'
      : sla.resolutionState === 'at_risk' || sla.responseState === 'at_risk'
        ? 'at_risk'
        : 'within_target';
    if (worst === 'breached') breached += 1;
    else if (worst === 'at_risk') atRisk += 1;
    else withinTarget += 1;
  }
  const withinPct = tracked === 0 ? null : Math.round((withinTarget / tracked) * 100);
  return { total: mine.length, open, withinTarget, atRisk, breached, withinPct };
}

export async function getSuggestion(repos: Repositories, id: string): Promise<Suggestion> {
  const inc = await repos.findIncidentById(id);
  if (!inc) throw Errors.notFound('Incident not found.');
  const config = await repos.getSlaConfig();
  return suggest({ title: inc.title, description: inc.description }, config);
}

export async function triageIncident(repos: Repositories, id: string, req: TriageRequest, actor: AuthUser): Promise<IncidentDetail> {
  const inc = await repos.findIncidentById(id);
  if (!inc) throw Errors.notFound('Incident not found.');
  const overrode = !!inc.prioritySuggested && inc.prioritySuggested !== req.priority;
  // BR-11: overriding the recommended priority requires a mandatory reason.
  if (overrode && (!req.overrideReason || req.overrideReason.trim().length === 0)) {
    throw Errors.validation('An override reason is required when changing the recommended priority.', {
      overrideReason: 'Please provide a reason for overriding the recommended priority.',
    });
  }
  const previousPriority = inc.priority;
  inc.classification = req.classification;
  inc.impact = req.impact;
  inc.urgency = req.urgency;
  inc.priority = req.priority;
  if (req.serviceId !== undefined) inc.serviceId = req.serviceId;
  if (req.category !== undefined) inc.category = req.category;
  if (req.subcategory !== undefined) inc.subcategory = req.subcategory;
  if (inc.status === 'new') inc.status = 'triaged';
  inc.updatedAt = now();
  await repos.updateIncident(inc);
  await writeAudit(repos, { action: 'incident.triaged', targetType: 'incident', targetId: inc.id, actor, detail: { classification: req.classification, priority: req.priority, override: overrode, recommended: inc.prioritySuggested, previousPriority, overrideReason: overrode ? req.overrideReason!.trim() : null } });
  if (req.priority === 'P1' || req.priority === 'P2') {
    await createAlert(repos, { incidentId: inc.id, type: 'priority', severity: req.priority === 'P1' ? 'danger' : 'warning', message: `${req.priority} incident: ${inc.title}`, recipientRole: 'manager', recipientId: null });
  }
  return buildDetail(repos, inc);
}

export async function assignIncident(repos: Repositories, id: string, req: AssignRequest, actor: AuthUser): Promise<IncidentDetail> {
  const inc = await repos.findIncidentById(id);
  if (!inc) throw Errors.notFound('Incident not found.');
  const config = await repos.getSlaConfig();
  let group = req.supportGroup;
  if (!group && inc.classification) group = routeSupportGroup(inc.classification, config) ?? undefined;

  if (!group) {
    inc.status = 'fallback';
    inc.updatedAt = now();
    await repos.updateIncident(inc);
    await repos.insertActivity({ id: uuid(), incidentId: inc.id, type: 'assignment', authorId: actor.id, note: 'Routed to Service Desk fallback queue.', createdAt: now() });
    await writeAudit(repos, { action: 'incident.fallback', targetType: 'incident', targetId: inc.id, actor, detail: { reason: 'no matching support group' } });
    return buildDetail(repos, inc);
  }

  inc.supportGroup = group;
  inc.assignedOwnerId = req.ownerId ?? inc.assignedOwnerId ?? null;
  if (inc.status === 'triaged' || inc.status === 'new' || inc.status === 'fallback') inc.status = 'assigned';
  inc.updatedAt = now();
  await repos.updateIncident(inc);
  await repos.insertActivity({ id: uuid(), incidentId: inc.id, type: 'assignment', authorId: actor.id, note: `Assigned to ${group}${req.ownerId ? ' / owner set' : ''}.`, createdAt: now() });
  await writeAudit(repos, { action: 'incident.assigned', targetType: 'incident', targetId: inc.id, actor, detail: { supportGroup: group, owner: inc.assignedOwnerId } });
  await startSlaTracking(repos, inc);
  return buildDetail(repos, inc);
}

export async function addNote(repos: Repositories, id: string, note: string, actor: AuthUser): Promise<IncidentDetail> {
  const inc = await repos.findIncidentById(id);
  if (!inc) throw Errors.notFound('Incident not found.');
  if (!note || note.trim().length === 0) throw Errors.validation('Note is required.', { note: 'Note is required.' });
  await repos.insertActivity({ id: uuid(), incidentId: inc.id, type: 'work_note', authorId: actor.id, note: note.trim(), createdAt: now() });
  await markResponded(repos, inc.id);
  inc.updatedAt = now();
  await repos.updateIncident(inc);
  await writeAudit(repos, { action: 'incident.note_added', targetType: 'incident', targetId: inc.id, actor });
  return buildDetail(repos, inc);
}

export async function changeStatus(repos: Repositories, id: string, to: IncidentStatus, actor: AuthUser): Promise<IncidentDetail> {
  const inc = await repos.findIncidentById(id);
  if (!inc) throw Errors.notFound('Incident not found.');
  const allowed = STATUS_TRANSITIONS[inc.status] ?? [];
  if (!allowed.includes(to)) throw Errors.businessRule(`Cannot change status from ${inc.status} to ${to}.`);
  const from = inc.status;
  inc.status = to;
  inc.updatedAt = now();
  await repos.updateIncident(inc);
  await repos.insertActivity({ id: uuid(), incidentId: inc.id, type: 'status_change', authorId: actor.id, fromStatus: from, toStatus: to, createdAt: now() });
  await writeAudit(repos, { action: 'incident.status_changed', targetType: 'incident', targetId: inc.id, actor, detail: { from, to } });
  await createAlert(repos, { incidentId: inc.id, type: 'status', severity: 'info', message: `Status changed to ${to}: ${inc.title}`, recipientRole: 'manager', recipientId: inc.assignedOwnerId ?? null });
  return buildDetail(repos, inc);
}

async function ensureCsat(repos: Repositories, incidentId: string): Promise<Csat> {
  let csat = await repos.findCsatByIncident(incidentId);
  if (!csat) {
    csat = { id: uuid(), incidentId, confirmedAt: null, rating: null, comment: null, reminderCount: 0, lastReminderAt: null, submittedAt: null };
    await repos.insertCsat(csat);
  }
  return csat;
}

export async function resolveIncident(repos: Repositories, id: string, req: ResolveRequest, actor: AuthUser): Promise<IncidentDetail> {
  const inc = await repos.findIncidentById(id);
  if (!inc) throw Errors.notFound('Incident not found.');
  const fields: Record<string, string> = {};
  if (!req.resolutionCode) fields.resolutionCode = 'Resolution code is required.';
  if (!req.resolutionNote || req.resolutionNote.trim().length === 0) fields.resolutionNote = 'Resolution note is required.';
  if (Object.keys(fields).length > 0) throw Errors.businessRule('Resolution requires a code and a note.', fields);

  inc.resolutionCode = req.resolutionCode;
  inc.resolutionNote = req.resolutionNote.trim();
  inc.status = 'resolved';
  inc.resolvedAt = now();
  inc.updatedAt = now();
  await repos.updateIncident(inc);
  await repos.insertActivity({ id: uuid(), incidentId: inc.id, type: 'resolution', authorId: actor.id, note: req.resolutionNote.trim(), createdAt: now() });
  // Mark the SLA instance resolution as met (drives the 'met' instance state).
  const sla = await repos.findSlaByIncident(inc.id);
  if (sla && !sla.resolutionMetAt) {
    sla.resolutionMetAt = now();
    if (!sla.responseAt) sla.responseAt = now();
    await repos.updateSlaRecord(sla);
  }
  await ensureCsat(repos, inc.id);
  await writeAudit(repos, { action: 'incident.resolved', targetType: 'incident', targetId: inc.id, actor, detail: { code: req.resolutionCode } });
  await createAlert(repos, { incidentId: inc.id, type: 'status', severity: 'info', message: `Resolved, awaiting confirmation: ${inc.title}`, recipientRole: null, recipientId: inc.reporterId });
  return buildDetail(repos, inc);
}

export async function confirmResolution(repos: Repositories, id: string, actor: AuthUser): Promise<IncidentDetail> {
  const inc = await repos.findIncidentById(id);
  if (!inc) throw Errors.notFound('Incident not found.');
  if (inc.reporterId !== actor.id) throw Errors.forbidden('Only the reporter can confirm.');
  const csat = await ensureCsat(repos, inc.id);
  csat.confirmedAt = now();
  await repos.updateCsat(csat);
  inc.status = 'closed';
  inc.closedAt = now();
  inc.updatedAt = now();
  await repos.updateIncident(inc);
  await writeAudit(repos, { action: 'incident.confirmed', targetType: 'incident', targetId: inc.id, actor });
  await writeAudit(repos, { action: 'incident.closed', targetType: 'incident', targetId: inc.id, actor, detail: { reason: 'reporter confirmed' } });
  return buildDetail(repos, inc);
}

export async function submitCsat(repos: Repositories, id: string, req: CsatRequest, actor: AuthUser): Promise<IncidentDetail> {
  const inc = await repos.findIncidentById(id);
  if (!inc) throw Errors.notFound('Incident not found.');
  if (inc.reporterId !== actor.id) throw Errors.forbidden('Only the reporter can rate.');
  if (!Number.isInteger(req.rating) || req.rating < 1 || req.rating > 5) {
    throw Errors.businessRule('CSAT rating must be an integer from 1 to 5.', { rating: 'Rating must be 1-5.' });
  }
  const csat = await ensureCsat(repos, inc.id);
  csat.rating = req.rating;
  csat.comment = req.comment ?? null;
  csat.submittedAt = now();
  await repos.updateCsat(csat);
  await writeAudit(repos, { action: 'incident.csat_submitted', targetType: 'incident', targetId: inc.id, actor, detail: { rating: req.rating } });
  return buildDetail(repos, inc);
}

export async function reopenIncident(repos: Repositories, id: string, reason: string, actor: AuthUser): Promise<IncidentDetail> {
  const inc = await repos.findIncidentById(id);
  if (!inc) throw Errors.notFound('Incident not found.');
  if (inc.reporterId !== actor.id) throw Errors.forbidden('Only the reporter can reopen.');
  if (!reason || reason.trim().length === 0) throw Errors.businessRule('A reopen reason is required.', { reason: 'Reason is required.' });
  if (inc.status !== 'resolved') throw Errors.businessRule('Only resolved incidents can be reopened.');
  inc.status = 'reopened';
  inc.reopenReason = reason.trim();
  inc.resolvedAt = null;
  inc.updatedAt = now();
  await repos.updateIncident(inc);
  await repos.insertActivity({ id: uuid(), incidentId: inc.id, type: 'reopen', authorId: actor.id, note: reason.trim(), createdAt: now() });
  await writeAudit(repos, { action: 'incident.reopened', targetType: 'incident', targetId: inc.id, actor, detail: { reason: reason.trim() } });
  await createAlert(repos, { incidentId: inc.id, type: 'status', severity: 'warning', message: `Reopened: ${inc.title}`, recipientRole: 'manager', recipientId: inc.assignedOwnerId ?? null });
  return buildDetail(repos, inc);
}

export async function closeIncident(repos: Repositories, id: string, actor: AuthUser): Promise<IncidentDetail> {
  const inc = await repos.findIncidentById(id);
  if (!inc) throw Errors.notFound('Incident not found.');
  if (inc.status !== 'resolved') throw Errors.businessRule('Only resolved incidents can be closed.');
  inc.status = 'closed';
  inc.closedAt = now();
  inc.updatedAt = now();
  await repos.updateIncident(inc);
  await writeAudit(repos, { action: 'incident.closed', targetType: 'incident', targetId: inc.id, actor });
  return buildDetail(repos, inc);
}
