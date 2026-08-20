import {
  classifyByKeywords,
  computeSlaTargets,
  computeSlaTargetsFromPolicy,
  evaluateSlaState,
  inferImpactUrgency,
  priorityFromMatrix,
  resolveSlaPolicy,
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
  type BusinessUnit,
  type Department,
  type Location,
  type Organization,
  type Role,
  type UserEmail,
  type BusinessCalendar,
  type SlaPolicy,
  type Service,
  type EmailAccount,
  type EmailMessage,
  type EmailTemplate,
  type EmailThread,
} from '@incident/shared';
import { ROLES } from '@incident/shared';
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
  organizations: Organization[];
  businessUnits: BusinessUnit[];
  departments: Department[];
  locations: Location[];
  userEmails: UserEmail[];
  slaPolicies: SlaPolicy[];
  businessCalendars: BusinessCalendar[];
  services: Service[];
  emailAccounts: EmailAccount[];
  emailTemplates: EmailTemplate[];
  emailThreads: EmailThread[];
  emailMessages: EmailMessage[];
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
  return list
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((i) => {
      const s = store.slaRecords.find((r) => r.incidentId === i.id);
      const slaState = s ? (kpiWorst(s) === 'breached' ? 'breached' : kpiWorst(s) === 'at_risk' ? 'at_risk' : 'within_target') : null;
      return { ...i, slaState } as Incident;
    });
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
  payload: { title: string; description: string; impact?: string; urgency?: string; channel?: string; serviceId?: string | null; category?: string | null; subcategory?: string | null },
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

  const reporter = store.users.find((u) => u.id === actor.id);
  const svc = payload.serviceId ? store.services.find((s) => s.id === payload.serviceId) : null;
  const inc: Incident = {
    id: nid('i'),
    ticketId: ticketId(),
    title: payload.title.trim(),
    description: payload.description.trim(),
    reporterId: actor.id,
    channel: (payload.channel as any) || 'web_portal',
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
    serviceId: payload.serviceId ?? null,
    category: payload.category ?? null,
    subcategory: payload.subcategory ?? null,
    requesterBuId: reporter?.buId ?? null,
    affectedBuId: reporter?.buId ?? null,
    serviceOwnerBuId: svc?.ownerBuId ?? null,
    requestType: 'incident',
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
  const overrode = !!inc.prioritySuggested && inc.prioritySuggested !== req.priority;
  // BR-11: overriding the recommended priority requires a mandatory reason.
  if (overrode && (!req.overrideReason || req.overrideReason.trim().length === 0)) {
    throw new MockApiError(400, 'validation_error', 'An override reason is required when changing the recommended priority.', { overrideReason: 'Please provide a reason for overriding the recommended priority.' });
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
  inc.updatedAt = nowIso();
  audit('incident.triaged', 'incident', inc.id, actor, {
    classification: req.classification,
    priority: req.priority,
    override: overrode,
    recommended: inc.prioritySuggested,
    previousPriority,
    overrideReason: overrode ? req.overrideReason!.trim() : null,
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
  // v3.0: resolve applicable SLA policy (BU + priority) with calendar-aware clock; fall back to global config.
  if (inc.priority && !store.slaRecords.find((s) => s.incidentId === inc.id)) {
    const started = new Date();
    const reporter = store.users.find((u) => u.id === inc.reporterId);
    const buId = reporter?.buId ?? null;
    const policy = resolveSlaPolicy(store.slaPolicies, { buId, serviceId: null, priority: inc.priority, requestType: 'incident' }, started);
    let responseTargetAt: Date;
    let resolutionTargetAt: Date;
    let policyId: string | null = null;
    let policyName: string | null = null;
    let calendarId: string | null = null;
    if (policy) {
      const calendar = policy.calendarId ? store.businessCalendars.find((c) => c.id === policy.calendarId) ?? null : null;
      ({ responseTargetAt, resolutionTargetAt } = computeSlaTargetsFromPolicy(policy, started, calendar));
      policyId = policy.id; policyName = policy.name; calendarId = policy.calendarId ?? null;
    } else {
      ({ responseTargetAt, resolutionTargetAt } = computeSlaTargets(inc.priority, started, store.slaConfig));
    }
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
      policyId,
      policyName,
      calendarId,
      resolutionMetAt: null,
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
  const slaRec = store.slaRecords.find((s) => s.incidentId === inc.id);
  if (slaRec && !slaRec.resolutionMetAt) { slaRec.resolutionMetAt = nowIso(); if (!slaRec.responseAt) slaRec.responseAt = nowIso(); }
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
function kpiWorst(s?: SlaRecord | null): 'breached' | 'at_risk' | 'within' | 'none' {
  if (!s) return 'none';
  if (s.responseState === 'breached' || s.resolutionState === 'breached') return 'breached';
  if (s.responseState === 'at_risk' || s.resolutionState === 'at_risk') return 'at_risk';
  return 'within';
}
function kpiDimension(incidents: Incident[], slaBy: Map<string, SlaRecord>, keyOf: (i: Incident) => string | null, labelOf: (k: string) => string) {
  const map = new Map<string, { key: string; label: string; total: number; open: number; breached: number; atRisk: number }>();
  for (const i of incidents) {
    const key = keyOf(i) ?? 'unset';
    const row = map.get(key) ?? { key, label: labelOf(key), total: 0, open: 0, breached: 0, atRisk: 0 };
    row.total += 1;
    if (i.status !== 'closed' && i.status !== 'resolved') row.open += 1;
    const w = kpiWorst(slaBy.get(i.id));
    if (w === 'breached') row.breached += 1; else if (w === 'at_risk') row.atRisk += 1;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function kpiRangeCutoff(range: string): number {
  const now = new Date();
  switch (range) {
    case '7d': return now.getTime() - 7 * 86400000;
    case '30d': return now.getTime() - 30 * 86400000;
    case 'qtd': { const q = Math.floor(now.getUTCMonth() / 3) * 3; return Date.UTC(now.getUTCFullYear(), q, 1); }
    case 'ytd': return Date.UTC(now.getUTCFullYear(), 0, 1);
    default: return 0;
  }
}

export function getKpi(range: string = 'all'): KpiSummary {
  const cutoff = kpiRangeCutoff(range);
  const incidents = cutoff === 0 ? store.incidents : store.incidents.filter((i) => new Date(i.createdAt).getTime() >= cutoff);
  const incidentIds = new Set(incidents.map((i) => i.id));
  const slas = store.slaRecords.filter((s) => incidentIds.has(s.incidentId));
  const slaBy = new Map(slas.map((s) => [s.incidentId, s]));
  const buCode = new Map(store.businessUnits.map((b) => [b.id, b.code]));
  const svcName = new Map(store.services.map((s) => [s.id, s.name]));
  const userBu = new Map(store.users.map((u) => [u.id, u.buId ?? null]));

  const countsByStatus: Record<string, number> = {};
  const countsByPriority: Record<string, number> = {};
  for (const i of incidents) {
    countsByStatus[i.status] = (countsByStatus[i.status] ?? 0) + 1;
    if (i.priority) countsByPriority[i.priority] = (countsByPriority[i.priority] ?? 0) + 1;
  }
  const slaEligible = slas.length;
  const breachedCount = slas.filter((s) => kpiWorst(s) === 'breached').length;
  const atRiskCount = slas.filter((s) => kpiWorst(s) === 'at_risk').length;
  const slaMet = slaEligible - breachedCount;
  const compliance = slaEligible === 0 ? 100 : Math.round((slaMet / slaEligible) * 100);

  const now = Date.now();
  const agingBuckets: Record<string, number> = { '<1d': 0, '1-3d': 0, '>3d': 0 };
  for (const i of incidents.filter((x) => x.status !== 'closed' && x.status !== 'resolved')) {
    const ageDays = (now - new Date(i.createdAt).getTime()) / 86400000;
    if (ageDays < 1) agingBuckets['<1d'] += 1;
    else if (ageDays <= 3) agingBuckets['1-3d'] += 1;
    else agingBuckets['>3d'] += 1;
  }
  const mttaVals = slas.filter((s) => s.responseAt).map((s) => (new Date(s.responseAt as string).getTime() - new Date(s.startedAt).getTime()) / 60000);
  const mttrVals = incidents.filter((i) => i.resolvedAt).map((i) => (new Date(i.resolvedAt as string).getTime() - new Date(i.createdAt).getTime()) / 60000);
  const mean = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

  const reopenCount = store.activities.filter((a) => a.type === 'reopen' && incidentIds.has(a.incidentId)).length;
  const resolvedOrClosed = incidents.filter((i) => i.status === 'resolved' || i.status === 'closed' || i.resolvedAt).length;
  const reopenRate = resolvedOrClosed === 0 ? null : Math.round((reopenCount / resolvedOrClosed) * 100);
  const ratings = store.csats.filter((c) => typeof c.rating === 'number' && incidentIds.has(c.incidentId)).map((c) => c.rating as number);
  const avgCsat = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

  const byClass: Record<string, number> = {};
  for (const i of incidents) {
    const c = i.classification ?? i.classificationSuggested ?? 'other';
    byClass[c] = (byClass[c] ?? 0) + 1;
  }
  const recurring = Object.entries(byClass).map(([classification, count]) => ({ classification, count })).sort((a, b) => b.count - a.count);
  const byDate: Record<string, number> = {};
  for (const i of incidents) { const d = i.createdAt.slice(0, 10); byDate[d] = (byDate[d] ?? 0) + 1; }
  const trend = Object.entries(byDate).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

  return {
    countsByStatus,
    countsByPriority,
    slaCompliancePct: compliance,
    slaBreachCount: breachedCount,
    agingBuckets,
    reopenCount,
    avgCsat,
    recurring,
    trend,
    hasData: incidents.length > 0,
    lastRefreshedAt: new Date().toISOString(),
    slaEligible,
    slaMet,
    atRiskCount,
    breachedCount,
    p1Count: countsByPriority['P1'] ?? 0,
    p2Count: countsByPriority['P2'] ?? 0,
    untriagedCount: incidents.filter((i) => i.status === 'new' || i.status === 'triaged' || !i.priority).length,
    mttaMinutes: mean(mttaVals),
    mttrMinutes: mean(mttrVals),
    reopenRate,
    csatCount: ratings.length,
    byBu: kpiDimension(incidents, slaBy, (i) => i.requesterBuId ?? userBu.get(i.reporterId) ?? null, (k) => (k === 'unset' ? 'Unset' : buCode.get(k) ?? k)),
    byService: kpiDimension(incidents, slaBy, (i) => i.serviceId ?? null, (k) => (k === 'unset' ? 'Unset' : svcName.get(k) ?? k)),
    bySupportGroup: kpiDimension(incidents, slaBy, (i) => i.supportGroup ?? null, (k) => k),
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

// ---- Organization master (v3.0) ----
export function getOrgOverview() {
  return {
    organizations: structuredClone(store.organizations),
    businessUnits: structuredClone(store.businessUnits),
    departments: structuredClone(store.departments),
    locations: structuredClone(store.locations),
  };
}

export function createOrganization(payload: { name: string; type?: Organization['type']; parentId?: string | null }, actor: AuthUser): Organization {
  if (!payload.name?.trim()) throw new MockApiError(400, 'validation_error', 'Name is required.', { name: 'Name is required.' });
  const org: Organization = { id: nid('org'), name: payload.name.trim(), type: payload.type ?? 'company', parentId: payload.parentId ?? null, active: true };
  store.organizations.push(org);
  audit('org.created', 'config', org.id, actor, { name: org.name });
  return org;
}

export function createBusinessUnit(payload: { orgId: string; code: string; name: string; managerId?: string | null }, actor: AuthUser): BusinessUnit {
  const fields: Record<string, string> = {};
  if (!payload.orgId) fields.orgId = 'Organization is required.';
  if (!payload.code?.trim()) fields.code = 'Code is required.';
  if (!payload.name?.trim()) fields.name = 'Name is required.';
  if (Object.keys(fields).length) throw new MockApiError(400, 'validation_error', 'Please complete the business unit.', fields);
  if (!store.organizations.some((o) => o.id === payload.orgId)) throw new MockApiError(400, 'validation_error', 'Unknown organization.', { orgId: 'Not found.' });
  const bu: BusinessUnit = { id: nid('bu'), orgId: payload.orgId, code: payload.code.trim(), name: payload.name.trim(), managerId: payload.managerId ?? null, active: true };
  store.businessUnits.push(bu);
  audit('org.bu.created', 'config', bu.id, actor, { code: bu.code });
  return bu;
}

export function createDepartment(payload: { buId: string; name: string }, actor: AuthUser): Department {
  const fields: Record<string, string> = {};
  if (!payload.buId) fields.buId = 'Business unit is required.';
  if (!payload.name?.trim()) fields.name = 'Name is required.';
  if (Object.keys(fields).length) throw new MockApiError(400, 'validation_error', 'Please complete the department.', fields);
  if (!store.businessUnits.some((b) => b.id === payload.buId)) throw new MockApiError(400, 'validation_error', 'Unknown business unit.', { buId: 'Not found.' });
  const dept: Department = { id: nid('dep'), buId: payload.buId, name: payload.name.trim(), active: true };
  store.departments.push(dept);
  audit('org.department.created', 'config', dept.id, actor, { name: dept.name });
  return dept;
}

export function createLocation(payload: { name: string; timeZone: string }, actor: AuthUser): Location {
  const fields: Record<string, string> = {};
  if (!payload.name?.trim()) fields.name = 'Name is required.';
  if (!payload.timeZone?.trim()) fields.timeZone = 'Time zone is required.';
  if (Object.keys(fields).length) throw new MockApiError(400, 'validation_error', 'Please complete the location.', fields);
  const loc: Location = { id: nid('loc'), name: payload.name.trim(), timeZone: payload.timeZone.trim(), active: true };
  store.locations.push(loc);
  audit('org.location.created', 'config', loc.id, actor, { name: loc.name });
  return loc;
}

export function updateOrganization(id: string, patch: Partial<Organization>, actor: AuthUser): Organization {
  const o = store.organizations.find((x) => x.id === id);
  if (!o) throw new MockApiError(404, 'not_found', 'Organization not found.');
  if (patch.name !== undefined && !patch.name.trim()) throw new MockApiError(400, 'validation_error', 'Name is required.', { name: 'Name is required.' });
  Object.assign(o, patch);
  audit('org.updated', 'config', o.id, actor, { active: o.active });
  return structuredClone(o);
}

export function updateBusinessUnit(id: string, patch: Partial<BusinessUnit>, actor: AuthUser): BusinessUnit {
  const b = store.businessUnits.find((x) => x.id === id);
  if (!b) throw new MockApiError(404, 'not_found', 'Business unit not found.');
  if (patch.orgId && !store.organizations.some((o) => o.id === patch.orgId)) throw new MockApiError(400, 'validation_error', 'Unknown organization.', { orgId: 'Not found.' });
  Object.assign(b, patch);
  audit('org.bu.updated', 'config', b.id, actor, { code: b.code, active: b.active });
  return structuredClone(b);
}

export function updateDepartment(id: string, patch: Partial<Department>, actor: AuthUser): Department {
  const d = store.departments.find((x) => x.id === id);
  if (!d) throw new MockApiError(404, 'not_found', 'Department not found.');
  if (patch.buId && !store.businessUnits.some((b) => b.id === patch.buId)) throw new MockApiError(400, 'validation_error', 'Unknown business unit.', { buId: 'Not found.' });
  Object.assign(d, patch);
  audit('org.department.updated', 'config', d.id, actor, { name: d.name, active: d.active });
  return structuredClone(d);
}

export function updateLocation(id: string, patch: Partial<Location>, actor: AuthUser): Location {
  const l = store.locations.find((x) => x.id === id);
  if (!l) throw new MockApiError(404, 'not_found', 'Location not found.');
  Object.assign(l, patch);
  audit('org.location.updated', 'config', l.id, actor, { name: l.name, active: l.active });
  return structuredClone(l);
}

export function adminUpdateUser(id: string, patch: Partial<User>, actor: AuthUser): User {
  const u = store.users.find((x) => x.id === id);
  if (!u) throw new MockApiError(404, 'not_found', 'User not found.');
  if (patch.roles) {
    if (patch.roles.length === 0) throw new MockApiError(400, 'validation_error', 'At least one role is required.', { roles: 'required' });
    const bad = patch.roles.filter((r) => !ROLES.includes(r as Role));
    if (bad.length) throw new MockApiError(400, 'validation_error', 'Unknown role.', { roles: bad.join(', ') });
  }
  const before = { roles: [...u.roles], buId: u.buId, isActive: u.isActive };
  Object.assign(u, patch);
  audit('user.updated', 'config', u.id, actor, { before, after: { roles: u.roles, buId: u.buId, isActive: u.isActive } });
  return structuredClone(u);
}

// ---- Profile self-service (v3.0) ----
export function getMyProfile(actor: AuthUser) {
  const u = store.users.find((x) => x.id === actor.id);
  if (!u) throw new MockApiError(404, 'not_found', 'User not found.');
  return { user: structuredClone(u), emails: store.userEmails.filter((e) => e.userId === actor.id).map((e) => structuredClone(e)) };
}

const AVATAR_MAX = 512 * 1024;
export function updateMyProfile(actor: AuthUser, patch: Partial<User>): User {
  const u = store.users.find((x) => x.id === actor.id);
  if (!u) throw new MockApiError(404, 'not_found', 'User not found.');
  if (patch.avatarUrl) {
    if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(patch.avatarUrl)) throw new MockApiError(400, 'validation_error', 'Unsupported avatar format.', { avatarUrl: 'Must be a PNG/JPEG/WEBP/GIF image.' });
    if (patch.avatarUrl.length > AVATAR_MAX) throw new MockApiError(400, 'validation_error', 'Avatar is too large.', { avatarUrl: 'Max ~512KB.' });
  }
  Object.assign(u, patch);
  audit('profile.updated', 'auth', u.id, actor, { fields: Object.keys(patch) });
  return structuredClone(u);
}

export function addMyEmail(actor: AuthUser, payload: { emailAddress: string; emailType?: UserEmail['emailType'] }): UserEmail {
  const addr = payload.emailAddress?.trim().toLowerCase();
  if (!addr || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) throw new MockApiError(400, 'validation_error', 'Invalid email address.', { emailAddress: 'Enter a valid email.' });
  if (store.userEmails.some((e) => e.isVerified && e.emailAddress.toLowerCase() === addr)) throw new MockApiError(400, 'validation_error', 'This email is already verified for another identity.', { emailAddress: 'Already in use.' });
  const email: UserEmail = { id: nid('em'), userId: actor.id, emailAddress: addr, emailType: payload.emailType ?? 'alternate', isPrimary: false, isVerified: false, verifiedAt: null, active: true };
  store.userEmails.push(email);
  audit('email.added', 'auth', actor.id, actor, { emailType: email.emailType });
  return structuredClone(email);
}

export function getMySlaSummary(actor: AuthUser) {
  const mine = store.incidents.filter((i) => i.reporterId === actor.id);
  let withinTarget = 0, atRisk = 0, breached = 0, open = 0, tracked = 0;
  for (const inc of mine) {
    if (inc.status !== 'closed' && inc.status !== 'resolved') open += 1;
    const sla = store.slaRecords.find((s) => s.incidentId === inc.id);
    if (!sla) continue;
    tracked += 1;
    const worst = sla.resolutionState === 'breached' || sla.responseState === 'breached' ? 'breached' : sla.resolutionState === 'at_risk' || sla.responseState === 'at_risk' ? 'at_risk' : 'within_target';
    if (worst === 'breached') breached += 1; else if (worst === 'at_risk') atRisk += 1; else withinTarget += 1;
  }
  return { total: mine.length, open, withinTarget, atRisk, breached, withinPct: tracked === 0 ? null : Math.round((withinTarget / tracked) * 100) };
}

// ---- Email ticketing (v3.0) ----
function extractTicketRef(text: string): string | null {
  const m = text.match(/INC-\d{4}-\d{6}/i);
  return m ? m[0].toUpperCase() : null;
}
function renderTpl(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? vars[k] : `{${k}}`));
}

export function ingestInbound(input: { from: string; subject: string; body: string }, actor: AuthUser): { action: 'linked' | 'created'; incidentId: string; ticketId: string } {
  const fromAddr = input.from.trim().toLowerCase();
  const match = store.userEmails.find((e) => e.isVerified && e.active && e.emailAddress.toLowerCase() === fromAddr);
  if (!match) throw new MockApiError(400, 'validation_error', 'Sender is not a verified user.', { from: 'No verified user for this email address.' });
  const user = store.users.find((u) => u.id === match.userId);
  if (!user) throw new MockApiError(400, 'validation_error', 'Sender is not a verified user.', { from: 'No user for this email.' });
  const senderActor: AuthUser = toAuthUser(user);
  const account = store.emailAccounts.find((a) => a.active) ?? null;
  const ref = extractTicketRef(`${input.subject} ${input.body}`);

  if (ref) {
    const thread = store.emailThreads.find((t) => t.reference === ref);
    if (thread?.incidentId) {
      const inc = store.incidents.find((i) => i.id === thread.incidentId);
      if (inc) {
        store.emailMessages.push({ id: nid('em'), threadId: thread.id, incidentId: inc.id, direction: 'inbound', fromAddr, toAddr: account?.address ?? 'support@mgc.demo', cc: null, subject: input.subject, body: input.body, visibility: 'public', deliveryState: 'received', processingState: 'linked', errorState: null, createdAt: nowIso() });
        store.activities.push({ id: nid('a'), incidentId: inc.id, type: 'work_note', authorId: user.id, note: `Email reply from ${fromAddr}: ${input.subject}`, createdAt: nowIso() });
        if (account) account.lastInboundAt = nowIso();
        audit('email.inbound.linked', 'incident', inc.id, senderActor, { ref, from: fromAddr });
        return { action: 'linked', incidentId: inc.id, ticketId: inc.ticketId };
      }
    }
  }

  const created = createIncident({ title: input.subject || '(no subject)', description: input.body, channel: 'mail' }, undefined, senderActor);
  const thread: EmailThread = { id: nid('eth'), incidentId: created.id, reference: created.ticketId, subject: input.subject, createdAt: nowIso() };
  store.emailThreads.push(thread);
  store.emailMessages.push({ id: nid('em'), threadId: thread.id, incidentId: created.id, direction: 'inbound', fromAddr, toAddr: account?.address ?? 'support@mgc.demo', cc: null, subject: input.subject, body: input.body, visibility: 'public', deliveryState: 'received', processingState: 'created_incident', errorState: null, createdAt: nowIso() });
  if (account) account.lastInboundAt = nowIso();
  audit('email.inbound.created', 'incident', created.id, senderActor, { from: fromAddr, ticketId: created.ticketId });

  // acknowledgement
  const inc = store.incidents.find((i) => i.id === created.id)!;
  const tpl = store.emailTemplates.find((t) => t.key === 'acknowledgement');
  const sla = store.slaRecords.find((s) => s.incidentId === inc.id);
  const vars = { ticketId: inc.ticketId, title: inc.title, status: inc.status, priority: inc.priority ?? inc.prioritySuggested ?? 'P4', slaSummary: sla ? `Response due ${sla.responseTargetAt}` : 'SLA will start once triaged.', supportName: account?.displayName ?? 'Service Desk' };
  store.emailMessages.push({ id: nid('em'), threadId: thread.id, incidentId: inc.id, direction: 'outbound', fromAddr: account?.address ?? 'support@mgc.demo', toAddr: fromAddr, cc: null, subject: tpl ? renderTpl(tpl.subject, vars) : `[${inc.ticketId}] received`, body: tpl ? renderTpl(tpl.body, vars) : 'Received.', visibility: 'public', deliveryState: 'delivered', processingState: 'linked', errorState: null, createdAt: nowIso() });
  if (account) account.lastOutboundAt = nowIso();
  return { action: 'created', incidentId: created.id, ticketId: created.ticketId };
}

export function agentReply(incidentId: string, input: { body: string; visibility: 'public' | 'internal' }, actor: AuthUser): EmailMessage {
  const inc = store.incidents.find((i) => i.id === incidentId);
  if (!inc) throw new MockApiError(404, 'not_found', 'Incident not found.');
  if (!input.body?.trim()) throw new MockApiError(400, 'validation_error', 'Message body is required.', { body: 'Required.' });
  let thread = store.emailThreads.find((t) => t.incidentId === incidentId);
  const account = store.emailAccounts.find((a) => a.active) ?? null;
  if (!thread) { thread = { id: nid('eth'), incidentId, reference: inc.ticketId, subject: inc.title, createdAt: nowIso() }; store.emailThreads.push(thread); }
  const reporterEmails = store.userEmails.filter((e) => e.userId === inc.reporterId);
  const toAddr = reporterEmails.find((e) => e.isPrimary)?.emailAddress ?? reporterEmails[0]?.emailAddress ?? 'reporter@mgc.demo';
  const msg: EmailMessage = { id: nid('em'), threadId: thread.id, incidentId, direction: 'outbound', fromAddr: account?.address ?? 'support@mgc.demo', toAddr, cc: null, subject: `[${inc.ticketId}] ${inc.title}`, body: input.body.trim(), visibility: input.visibility, deliveryState: input.visibility === 'internal' ? 'sent' : 'delivered', processingState: 'linked', errorState: null, createdAt: nowIso() };
  store.emailMessages.push(msg);
  if (input.visibility === 'public' && account) account.lastOutboundAt = nowIso();
  store.activities.push({ id: nid('a'), incidentId, type: 'work_note', authorId: actor.id, note: `${input.visibility === 'internal' ? 'Internal note' : 'Public reply'}: ${input.body.trim().slice(0, 200)}`, createdAt: nowIso() });
  audit(input.visibility === 'internal' ? 'email.internal_note' : 'email.public_reply', 'incident', incidentId, actor, { deliveryState: msg.deliveryState });
  return structuredClone(msg);
}

export function listIncidentEmails(incidentId: string): EmailMessage[] {
  return store.emailMessages.filter((m) => m.incidentId === incidentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((m) => structuredClone(m));
}
export function listEmailAccounts(): EmailAccount[] {
  return store.emailAccounts.map((a) => structuredClone(a));
}
export function testConnection(accountId: string, actor: AuthUser) {
  const a = store.emailAccounts.find((x) => x.id === accountId);
  if (!a) throw new MockApiError(404, 'not_found', 'Email account not found.');
  a.status = 'connected';
  audit('email.account.test', 'config', accountId, actor, { ok: true });
  return { ok: true, status: a.status };
}
export function sendTestEmail(accountId: string, toAddr: string, actor: AuthUser) {
  const a = store.emailAccounts.find((x) => x.id === accountId);
  if (!a) throw new MockApiError(404, 'not_found', 'Email account not found.');
  if (!toAddr?.trim()) throw new MockApiError(400, 'validation_error', 'Recipient is required.', { to: 'Required.' });
  a.lastOutboundAt = nowIso();
  audit('email.account.send_test', 'config', accountId, actor, { ok: true, to: toAddr.trim() });
  return { ok: true };
}

// ---- Service catalog (v3.0) ----
export function listServices(): Service[] {
  return store.services.map((s) => structuredClone(s));
}
export function createService(payload: { name: string; ownerBuId?: string | null }, actor: AuthUser): Service {
  if (!payload.name?.trim()) throw new MockApiError(400, 'validation_error', 'Name is required.', { name: 'Name is required.' });
  const svc: Service = { id: nid('svc'), name: payload.name.trim(), ownerBuId: payload.ownerBuId ?? null, active: true };
  store.services.push(svc);
  audit('service.created', 'config', svc.id, actor, { name: svc.name });
  return structuredClone(svc);
}
export function updateService(id: string, patch: Partial<Service>, actor: AuthUser): Service {
  const svc = store.services.find((s) => s.id === id);
  if (!svc) throw new MockApiError(404, 'not_found', 'Service not found.');
  Object.assign(svc, patch, { id: svc.id });
  audit('service.updated', 'config', svc.id, actor, { name: svc.name, active: svc.active });
  return structuredClone(svc);
}

// ---- SLA policy engine (v3.0) ----
export function listSlaEngine() {
  return { policies: store.slaPolicies.map((p) => structuredClone(p)), calendars: store.businessCalendars.map((c) => structuredClone(c)) };
}
function validatePolicyMock(p: Partial<SlaPolicy>) {
  const fields: Record<string, string> = {};
  if (!p.name?.trim()) fields.name = 'Name is required.';
  if (p.responseTargetMin == null || p.responseTargetMin <= 0) fields.responseTargetMin = 'Response target (min) must be positive.';
  if ((p.resolutionMin == null || p.resolutionMin <= 0) && (p.resolutionBd == null || p.resolutionBd <= 0)) fields.resolution = 'Provide a resolution target in minutes or business days.';
  if (Object.keys(fields).length) throw new MockApiError(400, 'validation_error', 'Please complete the SLA policy.', fields);
}
export function createSlaPolicy(body: Partial<SlaPolicy>, actor: AuthUser): SlaPolicy {
  validatePolicyMock(body);
  const p: SlaPolicy = { id: nid('pol'), name: body.name!.trim(), buId: body.buId ?? null, serviceId: body.serviceId ?? null, priority: body.priority ?? null, requestType: body.requestType ?? null, responseTargetMin: body.responseTargetMin!, resolutionMin: body.resolutionMin ?? null, resolutionBd: body.resolutionBd ?? null, calendarId: body.calendarId ?? null, warningPct: body.warningPct ?? 80, effectiveFrom: body.effectiveFrom ?? null, effectiveTo: body.effectiveTo ?? null, active: body.active ?? true };
  store.slaPolicies.push(p);
  audit('sla.policy.created', 'config', p.id, actor, { name: p.name, priority: p.priority, buId: p.buId });
  return structuredClone(p);
}
export function updateSlaPolicy(id: string, patch: Partial<SlaPolicy>, actor: AuthUser): SlaPolicy {
  const p = store.slaPolicies.find((x) => x.id === id);
  if (!p) throw new MockApiError(404, 'not_found', 'SLA policy not found.');
  Object.assign(p, patch, { id: p.id });
  validatePolicyMock(p);
  audit('sla.policy.updated', 'config', p.id, actor, { name: p.name, active: p.active });
  return structuredClone(p);
}
function validateCalendarMock(c: Partial<BusinessCalendar>) {
  const fields: Record<string, string> = {};
  if (!c.name?.trim()) fields.name = 'Name is required.';
  if (!c.timeZone?.trim()) fields.timeZone = 'Time zone is required.';
  if (Object.keys(fields).length) throw new MockApiError(400, 'validation_error', 'Please complete the calendar.', fields);
}
export function createBusinessCalendar(body: Partial<BusinessCalendar>, actor: AuthUser): BusinessCalendar {
  validateCalendarMock(body);
  const c: BusinessCalendar = { id: nid('cal'), name: body.name!.trim(), timeZone: body.timeZone!.trim(), mode: body.mode ?? '24x7', workDays: body.workDays ?? [1, 2, 3, 4, 5], workStart: body.workStart ?? '09:00', workEnd: body.workEnd ?? '18:00', holidays: body.holidays ?? [], active: body.active ?? true };
  store.businessCalendars.push(c);
  audit('sla.calendar.created', 'config', c.id, actor, { name: c.name, mode: c.mode });
  return structuredClone(c);
}
export function updateBusinessCalendar(id: string, patch: Partial<BusinessCalendar>, actor: AuthUser): BusinessCalendar {
  const c = store.businessCalendars.find((x) => x.id === id);
  if (!c) throw new MockApiError(404, 'not_found', 'Business calendar not found.');
  Object.assign(c, patch, { id: c.id });
  validateCalendarMock(c);
  audit('sla.calendar.updated', 'config', c.id, actor, { name: c.name, active: c.active });
  return structuredClone(c);
}

export function verifyMyEmail(actor: AuthUser, emailId: string): UserEmail {
  const email = store.userEmails.find((e) => e.id === emailId && e.userId === actor.id);
  if (!email) throw new MockApiError(404, 'not_found', 'Email not found.');
  if (store.userEmails.some((e) => e.id !== email.id && e.isVerified && e.emailAddress.toLowerCase() === email.emailAddress.toLowerCase())) {
    throw new MockApiError(400, 'validation_error', 'This email is already verified for another identity.', { emailAddress: 'Already in use.' });
  }
  email.isVerified = true;
  email.verifiedAt = nowIso();
  audit('email.verified', 'auth', actor.id, actor, { emailId });
  return structuredClone(email);
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
