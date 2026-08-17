import {
  classifyByKeywords,
  computeSlaTargets,
  evaluateSlaState,
  inferImpactUrgency,
  priorityFromMatrix,
  routeSupportGroup,
  STATUS_TRANSITIONS,
  type Activity,
  type Alert,
  type AssignRequest,
  type AuthUser,
  type Csat,
  type CsatRequest,
  type Incident,
  type IncidentDetail,
  type IncidentFilters,
  type IncidentStatus,
  type KpiSummary,
  type LoginResponse,
  type ResolveRequest,
  type SlaConfig,
  type SlaRecord,
  type Suggestion,
  type TriageRequest,
  type User,
} from '@incident/shared';
import { seedData, WORKSHOP_PASSWORDS } from '@incident/shared/fixtures';

// ---- Error type mirroring the API error contract ----
export class MockApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

interface Store {
  users: User[];
  incidents: Incident[];
  activities: Activity[];
  slaRecords: SlaRecord[];
  alerts: Alert[];
  csats: Csat[];
  auditEvents: ReturnType<typeof seedData>['auditEvents'];
  slaConfig: SlaConfig;
}

const store: Store = seedData();
let seq = 1006;
let idCounter = 100000;

function nid(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}
function nowIso() {
  return new Date().toISOString();
}
function ticketId() {
  seq += 1;
  return `INC-2026-${String(seq).padStart(6, '0')}`;
}

function audit(action: string, targetType: 'incident' | 'alert' | 'config' | 'auth', targetId: string | null, actor: AuthUser | null, detail?: Record<string, unknown>) {
  store.auditEvents.push({
    id: nid('ae'),
    actorId: actor?.id ?? null,
    actorLabel: actor?.displayName ?? 'system',
    action,
    targetType,
    targetId,
    detail: detail ?? null,
    createdAt: nowIso(),
  });
}

function toAuthUser(u: User): AuthUser {
  return { id: u.id, username: u.username, displayName: u.displayName, roles: u.roles, supportGroup: u.supportGroup };
}

function pushAlert(a: Omit<Alert, 'id' | 'createdAt'>) {
  const alert: Alert = { ...a, id: nid('al'), createdAt: nowIso() };
  store.alerts.push(alert);
  audit('alert.created', 'alert', alert.id, null, { type: alert.type });
  return alert;
}

function userBrief(id?: string | null) {
  if (!id) return null;
  const u = store.users.find((x) => x.id === id);
  return u ? { id: u.id, displayName: u.displayName, username: u.username } : null;
}

// ---- Auth ----
export function login(username: string, password: string): LoginResponse {
  const user = store.users.find((u) => u.username === username && u.isActive);
  const expected = WORKSHOP_PASSWORDS[username];
  if (!user || !expected || expected !== password) {
    throw new MockApiError(401, 'unauthenticated', 'Invalid username or password.');
  }
  audit('auth.login', 'auth', user.id, toAuthUser(user));
  // Mock token is a base64 of the user id (Phase 2 replaces with real JWT).
  const token = `mock.${btoa(user.id)}`;
  return { token, user: toAuthUser(user) };
}

// ---- Incidents ----
function detail(inc: Incident): IncidentDetail {
  return {
    ...inc,
    reporter: userBrief(inc.reporterId),
    owner: userBrief(inc.assignedOwnerId),
    sla: store.slaRecords.find((s) => s.incidentId === inc.id) ?? null,
    activities: store.activities.filter((a) => a.incidentId === inc.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    alerts: store.alerts.filter((a) => a.incidentId === inc.id),
    csat: store.csats.find((c) => c.incidentId === inc.id) ?? null,
  };
}

export function listIncidents(filters: IncidentFilters, actor: AuthUser): Incident[] {
  let list = [...store.incidents];
  if (filters.mine) list = list.filter((i) => i.reporterId === actor.id);
  if (filters.status) list = list.filter((i) => i.status === filters.status);
  if (filters.priority) list = list.filter((i) => i.priority === filters.priority);
  if (filters.supportGroup) list = list.filter((i) => i.supportGroup === filters.supportGroup);
  if (filters.assignedOwnerId) list = list.filter((i) => i.assignedOwnerId === filters.assignedOwnerId);
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getIncident(id: string, actor: AuthUser): IncidentDetail {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  // Reporter may only view own incidents.
  if (actor.roles.length === 1 && actor.roles[0] === 'business_user' && inc.reporterId !== actor.id) {
    throw new MockApiError(403, 'forbidden', 'You can only view your own incidents.');
  }
  return detail(inc);
}

export function createIncident(
  payload: { title: string; description: string; impact?: string; urgency?: string },
  idempotencyKey: string | undefined,
  actor: AuthUser
): { id: string; ticketId: string; duplicateWarning?: string } {
  const fields: Record<string, string> = {};
  if (!payload.title || payload.title.trim().length === 0) fields.title = 'Title is required.';
  if (!payload.description || payload.description.trim().length === 0) fields.description = 'Description is required.';
  if (Object.keys(fields).length > 0) {
    throw new MockApiError(400, 'validation_error', 'Please provide the required information.', fields);
  }

  if (idempotencyKey) {
    const existing = store.incidents.find((i) => i.idempotencyKey === idempotencyKey);
    if (existing) {
      return { id: existing.id, ticketId: existing.ticketId, duplicateWarning: 'This request was already submitted.' };
    }
  }
  // Duplicate-criteria: same reporter + same title still open.
  const dup = store.incidents.find(
    (i) => i.reporterId === actor.id && i.title.trim().toLowerCase() === payload.title.trim().toLowerCase() && i.status !== 'closed'
  );

  const suggestedClass = classifyByKeywords(`${payload.title} ${payload.description}`);
  const inferred = inferImpactUrgency(`${payload.title} ${payload.description}`);
  const impact = (payload.impact as any) || inferred.impact;
  const urgency = (payload.urgency as any) || inferred.urgency;
  const suggestedPriority = priorityFromMatrix(impact, urgency, store.slaConfig);

  const inc: Incident = {
    id: nid('i'),
    ticketId: ticketId(),
    title: payload.title.trim(),
    description: payload.description.trim(),
    reporterId: actor.id,
    channel: 'web_portal',
    classification: null,
    classificationSuggested: suggestedClass,
    impact,
    urgency,
    priority: null,
    prioritySuggested: suggestedPriority,
    aiSource: 'rules',
    status: 'new',
    supportGroup: null,
    assignedOwnerId: null,
    idempotencyKey: idempotencyKey ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  store.incidents.push(inc);
  audit('incident.created', 'incident', inc.id, actor, { ticketId: inc.ticketId });

  return {
    id: inc.id,
    ticketId: inc.ticketId,
    duplicateWarning: dup ? `A similar open incident exists (${dup.ticketId}).` : undefined,
  };
}

export function getSuggestions(id: string): Suggestion {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  const classification = inc.classificationSuggested ?? classifyByKeywords(`${inc.title} ${inc.description}`);
  const priority = inc.prioritySuggested ?? 'P4';
  return { classification, priority, source: 'rules', label: 'AI recommendation — review before applying' };
}

export function triage(id: string, req: TriageRequest, actor: AuthUser): IncidentDetail {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  const overrode = inc.prioritySuggested && inc.prioritySuggested !== req.priority;
  inc.classification = req.classification;
  inc.impact = req.impact;
  inc.urgency = req.urgency;
  inc.priority = req.priority;
  if (inc.status === 'new') inc.status = 'triaged';
  inc.updatedAt = nowIso();
  audit('incident.triaged', 'incident', inc.id, actor, {
    classification: req.classification,
    priority: req.priority,
    override: !!overrode,
    recommended: inc.prioritySuggested,
  });
  if (req.priority === 'P1' || req.priority === 'P2') {
    pushAlert({
      incidentId: inc.id,
      type: 'priority',
      severity: req.priority === 'P1' ? 'danger' : 'warning',
      message: `${req.priority} incident: ${inc.title}`,
      recipientRole: 'manager',
      recipientId: null,
    });
  }
  return detail(inc);
}

export function assign(id: string, req: AssignRequest, actor: AuthUser): IncidentDetail {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  let group = req.supportGroup;
  if (!group && inc.classification) {
    group = routeSupportGroup(inc.classification, store.slaConfig) ?? undefined;
  }
  if (!group) {
    inc.status = 'fallback';
    inc.updatedAt = nowIso();
    audit('incident.fallback', 'incident', inc.id, actor, { reason: 'no matching support group' });
    store.activities.push({ id: nid('a'), incidentId: inc.id, type: 'assignment', authorId: actor.id, note: 'Routed to Service Desk fallback queue.', createdAt: nowIso() });
    return detail(inc);
  }
  inc.supportGroup = group;
  inc.assignedOwnerId = req.ownerId ?? inc.assignedOwnerId ?? null;
  if (inc.status === 'triaged' || inc.status === 'new' || inc.status === 'fallback') inc.status = 'assigned';
  inc.updatedAt = nowIso();
  store.activities.push({ id: nid('a'), incidentId: inc.id, type: 'assignment', authorId: actor.id, note: `Assigned to ${group}${req.ownerId ? ' / owner set' : ''}.`, createdAt: nowIso() });
  audit('incident.assigned', 'incident', inc.id, actor, { supportGroup: group, owner: inc.assignedOwnerId });

  // Start SLA tracking when priority + assignment present.
  if (inc.priority && !store.slaRecords.find((s) => s.incidentId === inc.id)) {
    const started = new Date();
    const { responseTargetAt, resolutionTargetAt } = computeSlaTargets(inc.priority, started, store.slaConfig);
    store.slaRecords.push({
      id: nid('s'),
      incidentId: inc.id,
      priority: inc.priority,
      responseTargetAt: responseTargetAt.toISOString(),
      resolutionTargetAt: resolutionTargetAt.toISOString(),
      responseAt: null,
      responseState: 'within_target',
      resolutionState: 'within_target',
      startedAt: started.toISOString(),
    });
  }
  return detail(inc);
}

export function addNote(id: string, note: string, actor: AuthUser): IncidentDetail {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  if (!note || note.trim().length === 0) throw new MockApiError(400, 'validation_error', 'Note is required.', { note: 'Note is required.' });
  store.activities.push({ id: nid('a'), incidentId: inc.id, type: 'work_note', authorId: actor.id, note: note.trim(), createdAt: nowIso() });
  // First work note satisfies response SLA.
  const sla = store.slaRecords.find((s) => s.incidentId === inc.id);
  if (sla && !sla.responseAt) sla.responseAt = nowIso();
  inc.updatedAt = nowIso();
  audit('incident.note_added', 'incident', inc.id, actor);
  return detail(inc);
}

export function changeStatus(id: string, to: IncidentStatus, actor: AuthUser): IncidentDetail {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  const allowed = STATUS_TRANSITIONS[inc.status] ?? [];
  if (!allowed.includes(to)) {
    throw new MockApiError(422, 'business_rule', `Cannot change status from ${inc.status} to ${to}.`);
  }
  const from = inc.status;
  inc.status = to;
  inc.updatedAt = nowIso();
  store.activities.push({ id: nid('a'), incidentId: inc.id, type: 'status_change', authorId: actor.id, fromStatus: from, toStatus: to, createdAt: nowIso() });
  audit('incident.status_changed', 'incident', inc.id, actor, { from, to });
  pushAlert({ incidentId: inc.id, type: 'status', severity: 'info', message: `Status changed to ${to}: ${inc.title}`, recipientRole: 'manager', recipientId: inc.assignedOwnerId });
  return detail(inc);
}

export function resolve(id: string, req: ResolveRequest, actor: AuthUser): IncidentDetail {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  const fields: Record<string, string> = {};
  if (!req.resolutionCode) fields.resolutionCode = 'Resolution code is required.';
  if (!req.resolutionNote || req.resolutionNote.trim().length === 0) fields.resolutionNote = 'Resolution note is required.';
  if (Object.keys(fields).length > 0) throw new MockApiError(422, 'business_rule', 'Resolution requires a code and a note.', fields);
  inc.resolutionCode = req.resolutionCode;
  inc.resolutionNote = req.resolutionNote.trim();
  inc.status = 'resolved';
  inc.resolvedAt = nowIso();
  inc.updatedAt = nowIso();
  store.activities.push({ id: nid('a'), incidentId: inc.id, type: 'resolution', authorId: actor.id, note: req.resolutionNote.trim(), createdAt: nowIso() });
  // Confirmation + CSAT request placeholder
  let csat = store.csats.find((c) => c.incidentId === inc.id);
  if (!csat) {
    csat = { id: nid('c'), incidentId: inc.id, confirmedAt: null, rating: null, comment: null, reminderCount: 0, lastReminderAt: null, submittedAt: null };
    store.csats.push(csat);
  }
  audit('incident.resolved', 'incident', inc.id, actor, { code: req.resolutionCode });
  pushAlert({ incidentId: inc.id, type: 'status', severity: 'info', message: `Resolved, awaiting confirmation: ${inc.title}`, recipientRole: null, recipientId: inc.reporterId });
  return detail(inc);
}

export function confirm(id: string, actor: AuthUser): IncidentDetail {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  let csat = store.csats.find((c) => c.incidentId === inc.id);
  if (!csat) {
    csat = { id: nid('c'), incidentId: inc.id, confirmedAt: null, rating: null, comment: null, reminderCount: 0, lastReminderAt: null, submittedAt: null };
    store.csats.push(csat);
  }
  csat.confirmedAt = nowIso();
  // Close on confirm (closure condition satisfied).
  inc.status = 'closed';
  inc.closedAt = nowIso();
  inc.updatedAt = nowIso();
  audit('incident.confirmed', 'incident', inc.id, actor);
  audit('incident.closed', 'incident', inc.id, actor, { reason: 'reporter confirmed' });
  return detail(inc);
}

export function submitCsat(id: string, req: CsatRequest, actor: AuthUser): IncidentDetail {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  if (!Number.isInteger(req.rating) || req.rating < 1 || req.rating > 5) {
    throw new MockApiError(422, 'business_rule', 'CSAT rating must be an integer from 1 to 5.', { rating: 'Rating must be 1–5.' });
  }
  let csat = store.csats.find((c) => c.incidentId === inc.id);
  if (!csat) {
    csat = { id: nid('c'), incidentId: inc.id, confirmedAt: null, rating: null, comment: null, reminderCount: 0, lastReminderAt: null, submittedAt: null };
    store.csats.push(csat);
  }
  csat.rating = req.rating;
  csat.comment = req.comment ?? null;
  csat.submittedAt = nowIso();
  audit('incident.csat_submitted', 'incident', inc.id, actor, { rating: req.rating });
  return detail(inc);
}

export function reopen(id: string, reason: string, actor: AuthUser): IncidentDetail {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  if (!reason || reason.trim().length === 0) {
    throw new MockApiError(422, 'business_rule', 'A reopen reason is required.', { reason: 'Reason is required.' });
  }
  if (inc.status !== 'resolved') {
    throw new MockApiError(422, 'business_rule', 'Only resolved incidents can be reopened.');
  }
  inc.status = 'reopened';
  inc.reopenReason = reason.trim();
  inc.resolvedAt = null;
  inc.updatedAt = nowIso();
  store.activities.push({ id: nid('a'), incidentId: inc.id, type: 'reopen', authorId: actor.id, note: reason.trim(), createdAt: nowIso() });
  audit('incident.reopened', 'incident', inc.id, actor, { reason: reason.trim() });
  pushAlert({ incidentId: inc.id, type: 'status', severity: 'warning', message: `Reopened: ${inc.title}`, recipientRole: 'manager', recipientId: inc.assignedOwnerId });
  return detail(inc);
}

export function closeIncident(id: string, actor: AuthUser): IncidentDetail {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  if (inc.status !== 'resolved') throw new MockApiError(422, 'business_rule', 'Only resolved incidents can be closed.');
  inc.status = 'closed';
  inc.closedAt = nowIso();
  inc.updatedAt = nowIso();
  audit('incident.closed', 'incident', inc.id, actor);
  return detail(inc);
}

// ---- Alerts ----
export function listAlerts(actor: AuthUser): Alert[] {
  return store.alerts
    .filter((a) => {
      if (a.recipientId === actor.id) return true;
      if (a.recipientRole && actor.roles.includes(a.recipientRole)) return true;
      if (actor.roles.includes('manager') || actor.roles.includes('service_desk')) return true;
      return false;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ackAlert(id: string, actor: AuthUser): Alert {
  const alert = store.alerts.find((a) => a.id === id);
  if (!alert) throw new MockApiError(404, 'not_found', 'Alert not found.');
  alert.acknowledgedAt = nowIso();
  alert.acknowledgedBy = actor.id;
  audit('alert.acknowledged', 'alert', alert.id, actor);
  return alert;
}

// ---- KPI ----
export function getKpi(): KpiSummary {
  const incidents = store.incidents;
  const countsByStatus: Record<string, number> = {};
  const countsByPriority: Record<string, number> = {};
  for (const i of incidents) {
    countsByStatus[i.status] = (countsByStatus[i.status] ?? 0) + 1;
    if (i.priority) countsByPriority[i.priority] = (countsByPriority[i.priority] ?? 0) + 1;
  }
  const slas = store.slaRecords;
  const breach = slas.filter((s) => s.responseState === 'breached' || s.resolutionState === 'breached').length;
  const compliance = slas.length === 0 ? 100 : Math.round(((slas.length - breach) / slas.length) * 100);

  const now = Date.now();
  const agingBuckets: Record<string, number> = { '<1d': 0, '1-3d': 0, '>3d': 0 };
  for (const i of incidents.filter((x) => x.status !== 'closed')) {
    const ageDays = (now - new Date(i.createdAt).getTime()) / 86400000;
    if (ageDays < 1) agingBuckets['<1d'] += 1;
    else if (ageDays <= 3) agingBuckets['1-3d'] += 1;
    else agingBuckets['>3d'] += 1;
  }
  const reopenCount = store.activities.filter((a) => a.type === 'reopen').length;
  const ratings = store.csats.filter((c) => typeof c.rating === 'number').map((c) => c.rating as number);
  const avgCsat = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

  const byClass: Record<string, number> = {};
  for (const i of incidents) {
    const c = i.classification ?? i.classificationSuggested ?? 'other';
    byClass[c] = (byClass[c] ?? 0) + 1;
  }
  const recurring = Object.entries(byClass)
    .map(([classification, count]) => ({ classification, count }))
    .sort((a, b) => b.count - a.count);

  const byDate: Record<string, number> = {};
  for (const i of incidents) {
    const d = i.createdAt.slice(0, 10);
    byDate[d] = (byDate[d] ?? 0) + 1;
  }
  const trend = Object.entries(byDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    countsByStatus,
    countsByPriority,
    slaCompliancePct: compliance,
    slaBreachCount: breach,
    agingBuckets,
    reopenCount,
    avgCsat,
    recurring,
    trend,
    hasData: incidents.length > 0,
  };
}

// ---- Config ----
export function getSlaConfig(): SlaConfig {
  return structuredClone(store.slaConfig);
}
export function updateSlaConfig(next: SlaConfig, actor: AuthUser): SlaConfig {
  store.slaConfig = { ...next, updatedAt: nowIso(), updatedBy: actor.id };
  audit('config.sla_updated', 'config', 'sla', actor);
  return structuredClone(store.slaConfig);
}

// ---- Audit ----
export function getAudit(incidentId: string) {
  return store.auditEvents
    .filter((e) => e.targetType === 'incident' && e.targetId === incidentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function listUsers(): User[] {
  return store.users;
}

export function resolveActor(token: string | null): AuthUser {
  if (!token || !token.startsWith('mock.')) throw new MockApiError(401, 'unauthenticated', 'Not authenticated.');
  let userId: string;
  try {
    userId = atob(token.slice('mock.'.length));
  } catch {
    throw new MockApiError(401, 'unauthenticated', 'Invalid session.');
  }
  const user = store.users.find((u) => u.id === userId);
  if (!user) throw new MockApiError(401, 'unauthenticated', 'Invalid session.');
  return toAuthUser(user);
}
