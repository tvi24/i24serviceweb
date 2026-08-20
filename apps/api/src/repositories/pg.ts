import type {
  Activity,
  Alert,
  AuditEvent,
  BusinessCalendar,
  BusinessUnit,
  Csat,
  Department,
  EmailAccount,
  EmailMessage,
  EmailTemplate,
  EmailThread,
  Incident,
  IncidentFilters,
  Location,
  Organization,
  Service,
  SlaConfig,
  SlaPolicy,
  SlaRecord,
  User,
  UserEmail,
} from '@incident/shared';
import { DEFAULT_SLA_CONFIG } from '@incident/shared';
import type { Pool } from 'pg';
import { getPool } from '../db/pool';
import type { Repositories, StoredUser } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapUser(r: any): StoredUser {
  return {
    id: r.id, username: r.username, displayName: r.display_name,
    passwordHash: r.password_hash, passwordSalt: r.password_salt,
    roles: r.roles, supportGroup: r.support_group, isActive: r.is_active, createdAt: iso(r.created_at),
    jobTitle: r.job_title ?? null, buId: r.bu_id ?? null, departmentId: r.department_id ?? null,
    managerId: r.manager_id ?? null, locationId: r.location_id ?? null, avatarUrl: r.avatar_url ?? null,
    timeZone: r.time_zone ?? null, preferredLanguage: r.preferred_language ?? null,
    preferredChannel: r.preferred_channel ?? null, lastLoginAt: r.last_login_at ? iso(r.last_login_at) : null,
  };
}
function stripUser(u: StoredUser): User {
  const { passwordHash, passwordSalt, ...rest } = u;
  return rest;
}
function iso(v: any): string {
  return v instanceof Date ? v.toISOString() : v;
}
function mapOrg(r: any): Organization {
  return { id: r.id, name: r.name, type: r.type, parentId: r.parent_id, active: r.active };
}
function mapBu(r: any): BusinessUnit {
  return { id: r.id, orgId: r.org_id, code: r.code, name: r.name, managerId: r.manager_id, active: r.active };
}
function mapDept(r: any): Department {
  return { id: r.id, buId: r.bu_id, name: r.name, active: r.active };
}
function mapLocation(r: any): Location {
  return { id: r.id, name: r.name, timeZone: r.time_zone, active: r.active };
}
function mapEmail(r: any): UserEmail {
  return { id: r.id, userId: r.user_id, emailAddress: r.email_address, emailType: r.email_type, isPrimary: r.is_primary, isVerified: r.is_verified, verifiedAt: r.verified_at ? iso(r.verified_at) : null, active: r.active };
}
function mapIncident(r: any): Incident {
  return {
    id: r.id, ticketId: r.ticket_id, title: r.title, description: r.description,
    reporterId: r.reporter_id, channel: r.channel,
    classification: r.classification, classificationSuggested: r.classification_suggested,
    impact: r.impact, urgency: r.urgency, priority: r.priority, prioritySuggested: r.priority_suggested,
    aiSource: r.ai_source, status: r.status, supportGroup: r.support_group, assignedOwnerId: r.assigned_owner_id,
    serviceId: r.service_id ?? null, category: r.category ?? null, subcategory: r.subcategory ?? null,
    requesterBuId: r.requester_bu_id ?? null, affectedBuId: r.affected_bu_id ?? null, serviceOwnerBuId: r.service_owner_bu_id ?? null,
    requestType: r.request_type ?? null,
    resolutionCode: r.resolution_code, resolutionNote: r.resolution_note, reopenReason: r.reopen_reason,
    idempotencyKey: r.idempotency_key,
    createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
    resolvedAt: r.resolved_at ? iso(r.resolved_at) : null, closedAt: r.closed_at ? iso(r.closed_at) : null,
  };
}
function mapService(r: any): Service {
  return { id: r.id, name: r.name, ownerBuId: r.owner_bu_id, active: r.active };
}
function mapEmailAccount(r: any): EmailAccount {
  return { id: r.id, name: r.name, address: r.address, displayName: r.display_name, provider: r.provider, direction: r.direction, authType: r.auth_type, status: r.status, lastInboundAt: r.last_inbound_at ? iso(r.last_inbound_at) : null, lastOutboundAt: r.last_outbound_at ? iso(r.last_outbound_at) : null, active: r.active };
}
function mapEmailTemplate(r: any): EmailTemplate {
  return { id: r.id, key: r.key, subject: r.subject, body: r.body };
}
function mapEmailThread(r: any): EmailThread {
  return { id: r.id, incidentId: r.incident_id, reference: r.reference, subject: r.subject, createdAt: iso(r.created_at) };
}
function mapEmailMessage(r: any): EmailMessage {
  return { id: r.id, threadId: r.thread_id, incidentId: r.incident_id, direction: r.direction, fromAddr: r.from_addr, toAddr: r.to_addr, cc: r.cc, subject: r.subject, body: r.body, visibility: r.visibility, deliveryState: r.delivery_state, processingState: r.processing_state, errorState: r.error_state, createdAt: iso(r.created_at) };
}
function mapActivity(r: any): Activity {
  return { id: r.id, incidentId: r.incident_id, type: r.type, authorId: r.author_id, note: r.note, fromStatus: r.from_status, toStatus: r.to_status, createdAt: iso(r.created_at) };
}
function mapSla(r: any): SlaRecord {
  return { id: r.id, incidentId: r.incident_id, priority: r.priority, responseTargetAt: iso(r.response_target_at), resolutionTargetAt: iso(r.resolution_target_at), responseAt: r.response_at ? iso(r.response_at) : null, responseState: r.response_state, resolutionState: r.resolution_state, startedAt: iso(r.started_at), policyId: r.policy_id ?? null, policyName: r.policy_name ?? null, calendarId: r.calendar_id ?? null, resolutionMetAt: r.resolution_met_at ? iso(r.resolution_met_at) : null };
}
function mapPolicy(r: any): SlaPolicy {
  return { id: r.id, name: r.name, buId: r.bu_id, serviceId: r.service_id, priority: r.priority, requestType: r.request_type, responseTargetMin: r.response_target_min, resolutionMin: r.resolution_min, resolutionBd: r.resolution_bd, calendarId: r.calendar_id, warningPct: r.warning_pct, effectiveFrom: r.effective_from ? iso(r.effective_from) : null, effectiveTo: r.effective_to ? iso(r.effective_to) : null, active: r.active };
}
function mapCalendar(r: any): BusinessCalendar {
  return { id: r.id, name: r.name, timeZone: r.time_zone, mode: r.mode, workDays: r.work_days, workStart: r.work_start, workEnd: r.work_end, holidays: r.holidays, active: r.active };
}
function mapAlert(r: any): Alert {
  return { id: r.id, incidentId: r.incident_id, type: r.type, severity: r.severity, message: r.message, recipientRole: r.recipient_role, recipientId: r.recipient_id, acknowledgedAt: r.acknowledged_at ? iso(r.acknowledged_at) : null, acknowledgedBy: r.acknowledged_by, createdAt: iso(r.created_at) };
}
function mapCsat(r: any): Csat {
  return { id: r.id, incidentId: r.incident_id, confirmedAt: r.confirmed_at ? iso(r.confirmed_at) : null, rating: r.rating, comment: r.comment, reminderCount: r.reminder_count, lastReminderAt: r.last_reminder_at ? iso(r.last_reminder_at) : null, submittedAt: r.submitted_at ? iso(r.submitted_at) : null };
}
function mapAudit(r: any): AuditEvent {
  return { id: r.id, actorId: r.actor_id, actorLabel: r.actor_label, action: r.action, targetType: r.target_type, targetId: r.target_id, detail: r.detail, createdAt: iso(r.created_at) };
}
function mapConfig(r: any): SlaConfig {
  return { targets: r.targets, atRiskPct: r.at_risk_pct, priorityMatrix: r.priority_matrix, routingRules: r.routing_rules, closureGraceHours: r.closure_grace_hours, reminderMax: r.reminder_max, updatedAt: iso(r.updated_at), updatedBy: r.updated_by };
}

export async function createPgRepositories(): Promise<Repositories> {
  const pool: Pool = getPool();
  const q = (text: string, params?: any[]) => pool.query(text, params);

  return {
    async findUserByUsername(username) {
      const { rows } = await q('SELECT * FROM users WHERE username = $1', [username]);
      return rows[0] ? mapUser(rows[0]) : null;
    },
    async findUserById(id) {
      const { rows } = await q('SELECT * FROM users WHERE id = $1', [id]);
      return rows[0] ? mapUser(rows[0]) : null;
    },
    async listUsers() {
      const { rows } = await q('SELECT * FROM users ORDER BY username');
      return rows.map(mapUser).map(stripUser);
    },
    async updateUser(user) {
      await q(
        `UPDATE users SET display_name=$2, roles=$3, support_group=$4, is_active=$5, job_title=$6, bu_id=$7, department_id=$8, manager_id=$9, location_id=$10, avatar_url=$11, time_zone=$12, preferred_language=$13, preferred_channel=$14, last_login_at=$15 WHERE id=$1`,
        [user.id, user.displayName, user.roles, user.supportGroup ?? null, user.isActive, user.jobTitle ?? null, user.buId ?? null, user.departmentId ?? null, user.managerId ?? null, user.locationId ?? null, user.avatarUrl ?? null, user.timeZone ?? null, user.preferredLanguage ?? null, user.preferredChannel ?? null, user.lastLoginAt ?? null]
      );
      return user;
    },

    async listOrganizations() {
      const { rows } = await q('SELECT * FROM organizations ORDER BY name');
      return rows.map(mapOrg);
    },
    async insertOrganization(o) {
      await q('INSERT INTO organizations (id, name, type, parent_id, active) VALUES ($1,$2,$3,$4,$5)', [o.id, o.name, o.type, o.parentId ?? null, o.active]);
      return o;
    },
    async updateOrganization(o) {
      await q('UPDATE organizations SET name=$2, type=$3, parent_id=$4, active=$5 WHERE id=$1', [o.id, o.name, o.type, o.parentId ?? null, o.active]);
      return o;
    },
    async findOrganizationById(id) {
      const { rows } = await q('SELECT * FROM organizations WHERE id = $1', [id]);
      return rows[0] ? mapOrg(rows[0]) : null;
    },
    async listBusinessUnits() {
      const { rows } = await q('SELECT * FROM business_units ORDER BY code');
      return rows.map(mapBu);
    },
    async insertBusinessUnit(b) {
      await q('INSERT INTO business_units (id, org_id, code, name, manager_id, active) VALUES ($1,$2,$3,$4,$5,$6)', [b.id, b.orgId, b.code, b.name, b.managerId ?? null, b.active]);
      return b;
    },
    async updateBusinessUnit(b) {
      await q('UPDATE business_units SET org_id=$2, code=$3, name=$4, manager_id=$5, active=$6 WHERE id=$1', [b.id, b.orgId, b.code, b.name, b.managerId ?? null, b.active]);
      return b;
    },
    async findBusinessUnitById(id) {
      const { rows } = await q('SELECT * FROM business_units WHERE id = $1', [id]);
      return rows[0] ? mapBu(rows[0]) : null;
    },
    async listDepartments() {
      const { rows } = await q('SELECT * FROM departments ORDER BY name');
      return rows.map(mapDept);
    },
    async insertDepartment(d) {
      await q('INSERT INTO departments (id, bu_id, name, active) VALUES ($1,$2,$3,$4)', [d.id, d.buId, d.name, d.active]);
      return d;
    },
    async updateDepartment(d) {
      await q('UPDATE departments SET bu_id=$2, name=$3, active=$4 WHERE id=$1', [d.id, d.buId, d.name, d.active]);
      return d;
    },
    async findDepartmentById(id) {
      const { rows } = await q('SELECT * FROM departments WHERE id = $1', [id]);
      return rows[0] ? mapDept(rows[0]) : null;
    },
    async listLocations() {
      const { rows } = await q('SELECT * FROM locations ORDER BY name');
      return rows.map(mapLocation);
    },
    async insertLocation(l) {
      await q('INSERT INTO locations (id, name, time_zone, active) VALUES ($1,$2,$3,$4)', [l.id, l.name, l.timeZone, l.active]);
      return l;
    },
    async updateLocation(l) {
      await q('UPDATE locations SET name=$2, time_zone=$3, active=$4 WHERE id=$1', [l.id, l.name, l.timeZone, l.active]);
      return l;
    },
    async findLocationById(id) {
      const { rows } = await q('SELECT * FROM locations WHERE id = $1', [id]);
      return rows[0] ? mapLocation(rows[0]) : null;
    },

    async listUserEmails() {
      const { rows } = await q('SELECT * FROM user_emails ORDER BY user_id');
      return rows.map(mapEmail);
    },
    async listUserEmailsByUser(userId) {
      const { rows } = await q('SELECT * FROM user_emails WHERE user_id = $1 ORDER BY is_primary DESC', [userId]);
      return rows.map(mapEmail);
    },
    async insertUserEmail(e) {
      await q('INSERT INTO user_emails (id, user_id, email_address, email_type, is_primary, is_verified, verified_at, active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [e.id, e.userId, e.emailAddress, e.emailType, e.isPrimary, e.isVerified, e.verifiedAt ?? null, e.active]);
      return e;
    },
    async updateUserEmail(e) {
      await q('UPDATE user_emails SET email_address=$2, email_type=$3, is_primary=$4, is_verified=$5, verified_at=$6, active=$7 WHERE id=$1', [e.id, e.emailAddress, e.emailType, e.isPrimary, e.isVerified, e.verifiedAt ?? null, e.active]);
      return e;
    },
    async findUserEmailById(id) {
      const { rows } = await q('SELECT * FROM user_emails WHERE id = $1', [id]);
      return rows[0] ? mapEmail(rows[0]) : null;
    },

    async insertIncident(inc) {
      await q(
        `INSERT INTO incidents (id, ticket_id, title, description, reporter_id, channel, classification, classification_suggested, impact, urgency, priority, priority_suggested, ai_source, status, support_group, assigned_owner_id, resolution_code, resolution_note, reopen_reason, idempotency_key, created_at, updated_at, resolved_at, closed_at, service_id, category, subcategory, requester_bu_id, affected_bu_id, service_owner_bu_id, request_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)`,
        [inc.id, inc.ticketId, inc.title, inc.description, inc.reporterId, inc.channel, inc.classification, inc.classificationSuggested, inc.impact, inc.urgency, inc.priority, inc.prioritySuggested, inc.aiSource, inc.status, inc.supportGroup, inc.assignedOwnerId, inc.resolutionCode, inc.resolutionNote, inc.reopenReason, inc.idempotencyKey, inc.createdAt, inc.updatedAt, inc.resolvedAt, inc.closedAt, inc.serviceId ?? null, inc.category ?? null, inc.subcategory ?? null, inc.requesterBuId ?? null, inc.affectedBuId ?? null, inc.serviceOwnerBuId ?? null, inc.requestType ?? null]
      );
      return inc;
    },
    async findIncidentById(id) {
      const { rows } = await q('SELECT * FROM incidents WHERE id = $1', [id]);
      return rows[0] ? mapIncident(rows[0]) : null;
    },
    async findIncidentByIdempotencyKey(key) {
      const { rows } = await q('SELECT * FROM incidents WHERE idempotency_key = $1', [key]);
      return rows[0] ? mapIncident(rows[0]) : null;
    },
    async findOpenIncidentByReporterTitle(reporterId, title) {
      const { rows } = await q("SELECT * FROM incidents WHERE reporter_id = $1 AND lower(trim(title)) = lower(trim($2)) AND status <> 'closed' LIMIT 1", [reporterId, title]);
      return rows[0] ? mapIncident(rows[0]) : null;
    },
    async listIncidents(filters: IncidentFilters) {
      const clauses: string[] = [];
      const params: any[] = [];
      const add = (cond: string, val: any) => { params.push(val); clauses.push(`${cond} $${params.length}`); };
      if (filters.status) add('status =', filters.status);
      if (filters.priority) add('priority =', filters.priority);
      if (filters.supportGroup) add('support_group =', filters.supportGroup);
      if (filters.assignedOwnerId) add('assigned_owner_id =', filters.assignedOwnerId);
      if (filters.reporterId) add('reporter_id =', filters.reporterId);
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const { rows } = await q(
        `SELECT i.*,
                CASE WHEN s.response_state = 'breached' OR s.resolution_state = 'breached' THEN 'breached'
                     WHEN s.response_state = 'at_risk'  OR s.resolution_state = 'at_risk'  THEN 'at_risk'
                     WHEN s.incident_id IS NOT NULL THEN 'within_target'
                     ELSE NULL END AS sla_state
         FROM incidents i LEFT JOIN sla_records s ON s.incident_id = i.id ${where.replace(/\b(status|priority|support_group|assigned_owner_id|reporter_id)\b/g, 'i.$1')} ORDER BY i.created_at DESC`,
        params
      );
      return rows.map((r) => ({ ...mapIncident(r), slaState: r.sla_state ?? null }));
    },
    async updateIncident(inc) {
      await q(
        `UPDATE incidents SET title=$2, description=$3, classification=$4, classification_suggested=$5, impact=$6, urgency=$7, priority=$8, priority_suggested=$9, ai_source=$10, status=$11, support_group=$12, assigned_owner_id=$13, resolution_code=$14, resolution_note=$15, reopen_reason=$16, updated_at=$17, resolved_at=$18, closed_at=$19, service_id=$20, category=$21, subcategory=$22, requester_bu_id=$23, affected_bu_id=$24, service_owner_bu_id=$25, request_type=$26 WHERE id=$1`,
        [inc.id, inc.title, inc.description, inc.classification, inc.classificationSuggested, inc.impact, inc.urgency, inc.priority, inc.prioritySuggested, inc.aiSource, inc.status, inc.supportGroup, inc.assignedOwnerId, inc.resolutionCode, inc.resolutionNote, inc.reopenReason, inc.updatedAt, inc.resolvedAt, inc.closedAt, inc.serviceId ?? null, inc.category ?? null, inc.subcategory ?? null, inc.requesterBuId ?? null, inc.affectedBuId ?? null, inc.serviceOwnerBuId ?? null, inc.requestType ?? null]
      );
      return inc;
    },
    async nextTicketSeq() {
      const { rows } = await q('UPDATE ticket_seq SET val = val + 1 WHERE id = 1 RETURNING val');
      return rows[0].val as number;
    },

    async insertActivity(a) {
      await q('INSERT INTO activities (id, incident_id, type, author_id, note, from_status, to_status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [a.id, a.incidentId, a.type, a.authorId, a.note, a.fromStatus, a.toStatus, a.createdAt]);
      return a;
    },
    async listActivitiesByIncident(incidentId) {
      const { rows } = await q('SELECT * FROM activities WHERE incident_id = $1 ORDER BY created_at ASC', [incidentId]);
      return rows.map(mapActivity);
    },

    async insertSlaRecord(s) {
      await q('INSERT INTO sla_records (id, incident_id, priority, response_target_at, resolution_target_at, response_at, response_state, resolution_state, started_at, policy_id, policy_name, calendar_id, resolution_met_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)', [s.id, s.incidentId, s.priority, s.responseTargetAt, s.resolutionTargetAt, s.responseAt, s.responseState, s.resolutionState, s.startedAt, s.policyId ?? null, s.policyName ?? null, s.calendarId ?? null, s.resolutionMetAt ?? null]);
      return s;
    },
    async findSlaByIncident(incidentId) {
      const { rows } = await q('SELECT * FROM sla_records WHERE incident_id = $1', [incidentId]);
      return rows[0] ? mapSla(rows[0]) : null;
    },
    async updateSlaRecord(s) {
      await q('UPDATE sla_records SET response_at=$2, response_state=$3, resolution_state=$4, resolution_met_at=$5 WHERE id=$1', [s.id, s.responseAt, s.responseState, s.resolutionState, s.resolutionMetAt ?? null]);
      return s;
    },
    async listSlaRecords() {
      const { rows } = await q('SELECT * FROM sla_records');
      return rows.map(mapSla);
    },

    async insertAlert(a) {
      await q('INSERT INTO alerts (id, incident_id, type, severity, message, recipient_role, recipient_id, acknowledged_at, acknowledged_by, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [a.id, a.incidentId, a.type, a.severity, a.message, a.recipientRole, a.recipientId, a.acknowledgedAt, a.acknowledgedBy, a.createdAt]);
      return a;
    },
    async findAlertById(id) {
      const { rows } = await q('SELECT * FROM alerts WHERE id = $1', [id]);
      return rows[0] ? mapAlert(rows[0]) : null;
    },
    async updateAlert(a) {
      await q('UPDATE alerts SET acknowledged_at=$2, acknowledged_by=$3 WHERE id=$1', [a.id, a.acknowledgedAt, a.acknowledgedBy]);
      return a;
    },
    async listAlerts() {
      const { rows } = await q('SELECT * FROM alerts ORDER BY created_at DESC');
      return rows.map(mapAlert);
    },
    async listAlertsByIncident(incidentId) {
      const { rows } = await q('SELECT * FROM alerts WHERE incident_id = $1 ORDER BY created_at DESC', [incidentId]);
      return rows.map(mapAlert);
    },

    async insertCsat(c) {
      await q('INSERT INTO csat (id, incident_id, confirmed_at, rating, comment, reminder_count, last_reminder_at, submitted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [c.id, c.incidentId, c.confirmedAt, c.rating, c.comment, c.reminderCount, c.lastReminderAt, c.submittedAt]);
      return c;
    },
    async findCsatByIncident(incidentId) {
      const { rows } = await q('SELECT * FROM csat WHERE incident_id = $1', [incidentId]);
      return rows[0] ? mapCsat(rows[0]) : null;
    },
    async updateCsat(c) {
      await q('UPDATE csat SET confirmed_at=$2, rating=$3, comment=$4, reminder_count=$5, last_reminder_at=$6, submitted_at=$7 WHERE id=$1', [c.id, c.confirmedAt, c.rating, c.comment, c.reminderCount, c.lastReminderAt, c.submittedAt]);
      return c;
    },
    async listCsats() {
      const { rows } = await q('SELECT * FROM csat');
      return rows.map(mapCsat);
    },

    async insertAudit(e) {
      await q('INSERT INTO audit_events (id, actor_id, actor_label, action, target_type, target_id, detail, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [e.id, e.actorId, e.actorLabel, e.action, e.targetType, e.targetId, e.detail ? JSON.stringify(e.detail) : null, e.createdAt]);
      return e;
    },
    async listAuditByIncident(incidentId) {
      const { rows } = await q("SELECT * FROM audit_events WHERE target_type = 'incident' AND target_id = $1 ORDER BY created_at ASC", [incidentId]);
      return rows.map(mapAudit);
    },

    async getSlaConfig() {
      const { rows } = await q('SELECT * FROM sla_config WHERE id = 1');
      return rows[0] ? mapConfig(rows[0]) : { ...DEFAULT_SLA_CONFIG };
    },
    async updateSlaConfig(next) {
      await q(
        `INSERT INTO sla_config (id, targets, at_risk_pct, priority_matrix, routing_rules, closure_grace_hours, reminder_max, updated_at, updated_by)
         VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET targets=$1, at_risk_pct=$2, priority_matrix=$3, routing_rules=$4, closure_grace_hours=$5, reminder_max=$6, updated_at=$7, updated_by=$8`,
        [JSON.stringify(next.targets), next.atRiskPct, JSON.stringify(next.priorityMatrix), JSON.stringify(next.routingRules), next.closureGraceHours, next.reminderMax, next.updatedAt ?? new Date().toISOString(), next.updatedBy ?? null]
      );
      return next;
    },

    async listEmailAccounts() {
      const { rows } = await q('SELECT * FROM email_accounts ORDER BY name');
      return rows.map(mapEmailAccount);
    },
    async findEmailAccountById(id) {
      const { rows } = await q('SELECT * FROM email_accounts WHERE id = $1', [id]);
      return rows[0] ? mapEmailAccount(rows[0]) : null;
    },
    async updateEmailAccount(a) {
      await q('UPDATE email_accounts SET name=$2, address=$3, display_name=$4, provider=$5, direction=$6, auth_type=$7, status=$8, last_inbound_at=$9, last_outbound_at=$10, active=$11 WHERE id=$1', [a.id, a.name, a.address, a.displayName, a.provider, a.direction, a.authType, a.status, a.lastInboundAt ?? null, a.lastOutboundAt ?? null, a.active]);
      return a;
    },
    async listEmailTemplates() {
      const { rows } = await q('SELECT * FROM email_templates ORDER BY key');
      return rows.map(mapEmailTemplate);
    },
    async findEmailTemplateByKey(key) {
      const { rows } = await q('SELECT * FROM email_templates WHERE key = $1', [key]);
      return rows[0] ? mapEmailTemplate(rows[0]) : null;
    },
    async insertEmailThread(th) {
      await q('INSERT INTO email_threads (id, incident_id, reference, subject, created_at) VALUES ($1,$2,$3,$4,$5)', [th.id, th.incidentId ?? null, th.reference, th.subject, th.createdAt]);
      return th;
    },
    async findEmailThreadByReference(reference) {
      const { rows } = await q('SELECT * FROM email_threads WHERE reference = $1', [reference]);
      return rows[0] ? mapEmailThread(rows[0]) : null;
    },
    async findEmailThreadByIncident(incidentId) {
      const { rows } = await q('SELECT * FROM email_threads WHERE incident_id = $1 LIMIT 1', [incidentId]);
      return rows[0] ? mapEmailThread(rows[0]) : null;
    },
    async updateEmailThread(th) {
      await q('UPDATE email_threads SET incident_id=$2, reference=$3, subject=$4 WHERE id=$1', [th.id, th.incidentId ?? null, th.reference, th.subject]);
      return th;
    },
    async insertEmailMessage(m) {
      await q('INSERT INTO email_messages (id, thread_id, incident_id, direction, from_addr, to_addr, cc, subject, body, visibility, delivery_state, processing_state, error_state, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', [m.id, m.threadId, m.incidentId ?? null, m.direction, m.fromAddr, m.toAddr, m.cc ?? null, m.subject, m.body, m.visibility, m.deliveryState, m.processingState, m.errorState ?? null, m.createdAt]);
      return m;
    },
    async updateEmailMessage(m) {
      await q('UPDATE email_messages SET incident_id=$2, delivery_state=$3, processing_state=$4, error_state=$5 WHERE id=$1', [m.id, m.incidentId ?? null, m.deliveryState, m.processingState, m.errorState ?? null]);
      return m;
    },
    async listEmailMessagesByIncident(incidentId) {
      const { rows } = await q('SELECT * FROM email_messages WHERE incident_id = $1 ORDER BY created_at ASC', [incidentId]);
      return rows.map(mapEmailMessage);
    },
    async listEmailMessages() {
      const { rows } = await q('SELECT * FROM email_messages ORDER BY created_at DESC');
      return rows.map(mapEmailMessage);
    },

    async listServices() {
      const { rows } = await q('SELECT * FROM services ORDER BY name');
      return rows.map(mapService);
    },
    async findServiceById(id) {
      const { rows } = await q('SELECT * FROM services WHERE id = $1', [id]);
      return rows[0] ? mapService(rows[0]) : null;
    },
    async insertService(s) {
      await q('INSERT INTO services (id, name, owner_bu_id, active) VALUES ($1,$2,$3,$4)', [s.id, s.name, s.ownerBuId ?? null, s.active]);
      return s;
    },
    async updateService(s) {
      await q('UPDATE services SET name=$2, owner_bu_id=$3, active=$4 WHERE id=$1', [s.id, s.name, s.ownerBuId ?? null, s.active]);
      return s;
    },

    async listSlaPolicies() {
      const { rows } = await q('SELECT * FROM sla_policies ORDER BY name');
      return rows.map(mapPolicy);
    },
    async findSlaPolicyById(id) {
      const { rows } = await q('SELECT * FROM sla_policies WHERE id = $1', [id]);
      return rows[0] ? mapPolicy(rows[0]) : null;
    },
    async insertSlaPolicy(p) {
      await q('INSERT INTO sla_policies (id, name, bu_id, service_id, priority, request_type, response_target_min, resolution_min, resolution_bd, calendar_id, warning_pct, effective_from, effective_to, active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', [p.id, p.name, p.buId ?? null, p.serviceId ?? null, p.priority ?? null, p.requestType ?? null, p.responseTargetMin, p.resolutionMin ?? null, p.resolutionBd ?? null, p.calendarId ?? null, p.warningPct, p.effectiveFrom ?? null, p.effectiveTo ?? null, p.active]);
      return p;
    },
    async updateSlaPolicy(p) {
      await q('UPDATE sla_policies SET name=$2, bu_id=$3, service_id=$4, priority=$5, request_type=$6, response_target_min=$7, resolution_min=$8, resolution_bd=$9, calendar_id=$10, warning_pct=$11, effective_from=$12, effective_to=$13, active=$14 WHERE id=$1', [p.id, p.name, p.buId ?? null, p.serviceId ?? null, p.priority ?? null, p.requestType ?? null, p.responseTargetMin, p.resolutionMin ?? null, p.resolutionBd ?? null, p.calendarId ?? null, p.warningPct, p.effectiveFrom ?? null, p.effectiveTo ?? null, p.active]);
      return p;
    },
    async listBusinessCalendars() {
      const { rows } = await q('SELECT * FROM business_calendars ORDER BY name');
      return rows.map(mapCalendar);
    },
    async findBusinessCalendarById(id) {
      const { rows } = await q('SELECT * FROM business_calendars WHERE id = $1', [id]);
      return rows[0] ? mapCalendar(rows[0]) : null;
    },
    async insertBusinessCalendar(c) {
      await q('INSERT INTO business_calendars (id, name, time_zone, mode, work_days, work_start, work_end, holidays, active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [c.id, c.name, c.timeZone, c.mode, c.workDays, c.workStart, c.workEnd, c.holidays, c.active]);
      return c;
    },
    async updateBusinessCalendar(c) {
      await q('UPDATE business_calendars SET name=$2, time_zone=$3, mode=$4, work_days=$5, work_start=$6, work_end=$7, holidays=$8, active=$9 WHERE id=$1', [c.id, c.name, c.timeZone, c.mode, c.workDays, c.workStart, c.workEnd, c.holidays, c.active]);
      return c;
    },
  };
}
