import type {
  Activity,
  Alert,
  AuditEvent,
  Csat,
  Incident,
  IncidentFilters,
  SlaConfig,
  SlaRecord,
  User,
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
  };
}
function stripUser(u: StoredUser): User {
  const { passwordHash, passwordSalt, ...rest } = u;
  return rest;
}
function iso(v: any): string {
  return v instanceof Date ? v.toISOString() : v;
}
function mapIncident(r: any): Incident {
  return {
    id: r.id, ticketId: r.ticket_id, title: r.title, description: r.description,
    reporterId: r.reporter_id, channel: r.channel,
    classification: r.classification, classificationSuggested: r.classification_suggested,
    impact: r.impact, urgency: r.urgency, priority: r.priority, prioritySuggested: r.priority_suggested,
    aiSource: r.ai_source, status: r.status, supportGroup: r.support_group, assignedOwnerId: r.assigned_owner_id,
    resolutionCode: r.resolution_code, resolutionNote: r.resolution_note, reopenReason: r.reopen_reason,
    idempotencyKey: r.idempotency_key,
    createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
    resolvedAt: r.resolved_at ? iso(r.resolved_at) : null, closedAt: r.closed_at ? iso(r.closed_at) : null,
  };
}
function mapActivity(r: any): Activity {
  return { id: r.id, incidentId: r.incident_id, type: r.type, authorId: r.author_id, note: r.note, fromStatus: r.from_status, toStatus: r.to_status, createdAt: iso(r.created_at) };
}
function mapSla(r: any): SlaRecord {
  return { id: r.id, incidentId: r.incident_id, priority: r.priority, responseTargetAt: iso(r.response_target_at), resolutionTargetAt: iso(r.resolution_target_at), responseAt: r.response_at ? iso(r.response_at) : null, responseState: r.response_state, resolutionState: r.resolution_state, startedAt: iso(r.started_at) };
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

    async insertIncident(inc) {
      await q(
        `INSERT INTO incidents (id, ticket_id, title, description, reporter_id, channel, classification, classification_suggested, impact, urgency, priority, priority_suggested, ai_source, status, support_group, assigned_owner_id, resolution_code, resolution_note, reopen_reason, idempotency_key, created_at, updated_at, resolved_at, closed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
        [inc.id, inc.ticketId, inc.title, inc.description, inc.reporterId, inc.channel, inc.classification, inc.classificationSuggested, inc.impact, inc.urgency, inc.priority, inc.prioritySuggested, inc.aiSource, inc.status, inc.supportGroup, inc.assignedOwnerId, inc.resolutionCode, inc.resolutionNote, inc.reopenReason, inc.idempotencyKey, inc.createdAt, inc.updatedAt, inc.resolvedAt, inc.closedAt]
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
      const { rows } = await q(`SELECT * FROM incidents ${where} ORDER BY created_at DESC`, params);
      return rows.map(mapIncident);
    },
    async updateIncident(inc) {
      await q(
        `UPDATE incidents SET title=$2, description=$3, classification=$4, classification_suggested=$5, impact=$6, urgency=$7, priority=$8, priority_suggested=$9, ai_source=$10, status=$11, support_group=$12, assigned_owner_id=$13, resolution_code=$14, resolution_note=$15, reopen_reason=$16, updated_at=$17, resolved_at=$18, closed_at=$19 WHERE id=$1`,
        [inc.id, inc.title, inc.description, inc.classification, inc.classificationSuggested, inc.impact, inc.urgency, inc.priority, inc.prioritySuggested, inc.aiSource, inc.status, inc.supportGroup, inc.assignedOwnerId, inc.resolutionCode, inc.resolutionNote, inc.reopenReason, inc.updatedAt, inc.resolvedAt, inc.closedAt]
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
      await q('INSERT INTO sla_records (id, incident_id, priority, response_target_at, resolution_target_at, response_at, response_state, resolution_state, started_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [s.id, s.incidentId, s.priority, s.responseTargetAt, s.resolutionTargetAt, s.responseAt, s.responseState, s.resolutionState, s.startedAt]);
      return s;
    },
    async findSlaByIncident(incidentId) {
      const { rows } = await q('SELECT * FROM sla_records WHERE incident_id = $1', [incidentId]);
      return rows[0] ? mapSla(rows[0]) : null;
    },
    async updateSlaRecord(s) {
      await q('UPDATE sla_records SET response_at=$2, response_state=$3, resolution_state=$4 WHERE id=$1', [s.id, s.responseAt, s.responseState, s.resolutionState]);
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
  };
}
