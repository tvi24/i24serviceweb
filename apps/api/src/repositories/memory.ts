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
import { seedData, WORKSHOP_PASSWORDS } from '@incident/shared/fixtures';
import { hashPassword } from '../lib/crypto';
import type { Repositories, StoredUser } from './types';

export function createMemoryRepositories(): Repositories {
  const data = seedData();

  // Build stored users with hashed passwords (plaintext never persisted).
  const users: StoredUser[] = data.users.map((u: User) => {
    const pw = WORKSHOP_PASSWORDS[u.username] ?? 'Passw0rd!';
    const { hash, salt } = hashPassword(pw);
    return { ...u, passwordHash: hash, passwordSalt: salt };
  });

  const incidents: Incident[] = data.incidents;
  const activities: Activity[] = data.activities;
  const slaRecords: SlaRecord[] = data.slaRecords;
  const alerts: Alert[] = data.alerts;
  const csats: Csat[] = data.csats;
  const auditEvents: AuditEvent[] = data.auditEvents;
  let slaConfig: SlaConfig = data.slaConfig;
  let ticketSeq = 1006;

  const clone = <T>(v: T): T => structuredClone(v);

  return {
    async findUserByUsername(username) {
      return users.find((u) => u.username === username) ?? null;
    },
    async findUserById(id) {
      return users.find((u) => u.id === id) ?? null;
    },
    async listUsers() {
      return users.map(({ passwordHash, passwordSalt, ...rest }) => rest);
    },

    async insertIncident(inc) {
      incidents.push(clone(inc));
      return inc;
    },
    async findIncidentById(id) {
      const found = incidents.find((i) => i.id === id);
      return found ? clone(found) : null;
    },
    async findIncidentByIdempotencyKey(key) {
      const found = incidents.find((i) => i.idempotencyKey === key);
      return found ? clone(found) : null;
    },
    async findOpenIncidentByReporterTitle(reporterId, title) {
      const found = incidents.find(
        (i) => i.reporterId === reporterId && i.title.trim().toLowerCase() === title.trim().toLowerCase() && i.status !== 'closed'
      );
      return found ? clone(found) : null;
    },
    async listIncidents(filters: IncidentFilters) {
      let list = [...incidents];
      if (filters.status) list = list.filter((i) => i.status === filters.status);
      if (filters.priority) list = list.filter((i) => i.priority === filters.priority);
      if (filters.supportGroup) list = list.filter((i) => i.supportGroup === filters.supportGroup);
      if (filters.assignedOwnerId) list = list.filter((i) => i.assignedOwnerId === filters.assignedOwnerId);
      if (filters.reporterId) list = list.filter((i) => i.reporterId === filters.reporterId);
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(clone);
    },
    async updateIncident(inc) {
      const idx = incidents.findIndex((i) => i.id === inc.id);
      if (idx >= 0) incidents[idx] = clone(inc);
      return inc;
    },
    async nextTicketSeq() {
      ticketSeq += 1;
      return ticketSeq;
    },

    async insertActivity(a) {
      activities.push(clone(a));
      return a;
    },
    async listActivitiesByIncident(incidentId) {
      return activities.filter((a) => a.incidentId === incidentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(clone);
    },

    async insertSlaRecord(s) {
      slaRecords.push(clone(s));
      return s;
    },
    async findSlaByIncident(incidentId) {
      const found = slaRecords.find((s) => s.incidentId === incidentId);
      return found ? clone(found) : null;
    },
    async updateSlaRecord(s) {
      const idx = slaRecords.findIndex((x) => x.id === s.id);
      if (idx >= 0) slaRecords[idx] = clone(s);
      return s;
    },
    async listSlaRecords() {
      return slaRecords.map(clone);
    },

    async insertAlert(a) {
      alerts.push(clone(a));
      return a;
    },
    async findAlertById(id) {
      const found = alerts.find((a) => a.id === id);
      return found ? clone(found) : null;
    },
    async updateAlert(a) {
      const idx = alerts.findIndex((x) => x.id === a.id);
      if (idx >= 0) alerts[idx] = clone(a);
      return a;
    },
    async listAlerts() {
      return alerts.map(clone);
    },
    async listAlertsByIncident(incidentId) {
      return alerts.filter((a) => a.incidentId === incidentId).map(clone);
    },

    async insertCsat(c) {
      csats.push(clone(c));
      return c;
    },
    async findCsatByIncident(incidentId) {
      const found = csats.find((c) => c.incidentId === incidentId);
      return found ? clone(found) : null;
    },
    async updateCsat(c) {
      const idx = csats.findIndex((x) => x.id === c.id);
      if (idx >= 0) csats[idx] = clone(c);
      return c;
    },
    async listCsats() {
      return csats.map(clone);
    },

    async insertAudit(e) {
      auditEvents.push(clone(e));
      return e;
    },
    async listAuditByIncident(incidentId) {
      return auditEvents
        .filter((e) => e.targetType === 'incident' && e.targetId === incidentId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map(clone);
    },

    async getSlaConfig() {
      return clone(slaConfig);
    },
    async updateSlaConfig(next) {
      slaConfig = clone(next);
      return clone(slaConfig);
    },
  };
}
