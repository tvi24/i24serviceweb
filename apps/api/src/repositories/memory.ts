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
  const organizations: Organization[] = data.organizations;
  const businessUnits: BusinessUnit[] = data.businessUnits;
  const departments: Department[] = data.departments;
  const locations: Location[] = data.locations;
  const userEmails: UserEmail[] = data.userEmails;
  const slaPolicies: SlaPolicy[] = data.slaPolicies;
  const businessCalendars: BusinessCalendar[] = data.businessCalendars;
  const services: Service[] = data.services;
  const emailAccounts: EmailAccount[] = data.emailAccounts;
  const emailTemplates: EmailTemplate[] = data.emailTemplates;
  const emailThreads: EmailThread[] = data.emailThreads;
  const emailMessages: EmailMessage[] = data.emailMessages;
  let ticketSeq = 1006;

  const clone = <T>(v: T): T => structuredClone(v);
  const stripUser = ({ passwordHash, passwordSalt, ...rest }: StoredUser): User => rest;

  return {
    async findUserByUsername(username) {
      return users.find((u) => u.username === username) ?? null;
    },
    async findUserById(id) {
      return users.find((u) => u.id === id) ?? null;
    },
    async listUsers() {
      return users.map(stripUser).map(clone);
    },
    async updateUser(user) {
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx >= 0) users[idx] = { ...users[idx], ...user };
      return clone(stripUser(users[idx]));
    },

    async listOrganizations() {
      return organizations.map(clone);
    },
    async insertOrganization(o) {
      organizations.push(clone(o));
      return o;
    },
    async updateOrganization(o) {
      const idx = organizations.findIndex((x) => x.id === o.id);
      if (idx >= 0) organizations[idx] = clone(o);
      return o;
    },
    async findOrganizationById(id) {
      const f = organizations.find((o) => o.id === id);
      return f ? clone(f) : null;
    },
    async listBusinessUnits() {
      return businessUnits.map(clone);
    },
    async insertBusinessUnit(b) {
      businessUnits.push(clone(b));
      return b;
    },
    async updateBusinessUnit(b) {
      const idx = businessUnits.findIndex((x) => x.id === b.id);
      if (idx >= 0) businessUnits[idx] = clone(b);
      return b;
    },
    async findBusinessUnitById(id) {
      const f = businessUnits.find((b) => b.id === id);
      return f ? clone(f) : null;
    },
    async listDepartments() {
      return departments.map(clone);
    },
    async insertDepartment(d) {
      departments.push(clone(d));
      return d;
    },
    async updateDepartment(d) {
      const idx = departments.findIndex((x) => x.id === d.id);
      if (idx >= 0) departments[idx] = clone(d);
      return d;
    },
    async findDepartmentById(id) {
      const f = departments.find((d) => d.id === id);
      return f ? clone(f) : null;
    },
    async listLocations() {
      return locations.map(clone);
    },
    async insertLocation(l) {
      locations.push(clone(l));
      return l;
    },
    async updateLocation(l) {
      const idx = locations.findIndex((x) => x.id === l.id);
      if (idx >= 0) locations[idx] = clone(l);
      return l;
    },
    async findLocationById(id) {
      const f = locations.find((l) => l.id === id);
      return f ? clone(f) : null;
    },

    async listUserEmails() {
      return userEmails.map(clone);
    },
    async listUserEmailsByUser(userId) {
      return userEmails.filter((e) => e.userId === userId).map(clone);
    },
    async insertUserEmail(e) {
      userEmails.push(clone(e));
      return e;
    },
    async updateUserEmail(e) {
      const idx = userEmails.findIndex((x) => x.id === e.id);
      if (idx >= 0) userEmails[idx] = clone(e);
      return e;
    },
    async findUserEmailById(id) {
      const found = userEmails.find((e) => e.id === id);
      return found ? clone(found) : null;
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
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((i) => {
        const s = slaRecords.find((r) => r.incidentId === i.id);
        const slaState = s ? (s.responseState === 'breached' || s.resolutionState === 'breached' ? 'breached' : s.responseState === 'at_risk' || s.resolutionState === 'at_risk' ? 'at_risk' : 'within_target') : null;
        return clone({ ...i, slaState });
      });
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

    async listEmailAccounts() {
      return emailAccounts.map(clone);
    },
    async findEmailAccountById(id) {
      const f = emailAccounts.find((a) => a.id === id);
      return f ? clone(f) : null;
    },
    async updateEmailAccount(a) {
      const idx = emailAccounts.findIndex((x) => x.id === a.id);
      if (idx >= 0) emailAccounts[idx] = clone(a);
      return a;
    },
    async listEmailTemplates() {
      return emailTemplates.map(clone);
    },
    async findEmailTemplateByKey(key) {
      const f = emailTemplates.find((t) => t.key === key);
      return f ? clone(f) : null;
    },
    async insertEmailThread(th) {
      emailThreads.push(clone(th));
      return th;
    },
    async findEmailThreadByReference(reference) {
      const f = emailThreads.find((t) => t.reference === reference);
      return f ? clone(f) : null;
    },
    async findEmailThreadByIncident(incidentId) {
      const f = emailThreads.find((t) => t.incidentId === incidentId);
      return f ? clone(f) : null;
    },
    async updateEmailThread(th) {
      const idx = emailThreads.findIndex((x) => x.id === th.id);
      if (idx >= 0) emailThreads[idx] = clone(th);
      return th;
    },
    async insertEmailMessage(m) {
      emailMessages.push(clone(m));
      return m;
    },
    async updateEmailMessage(m) {
      const idx = emailMessages.findIndex((x) => x.id === m.id);
      if (idx >= 0) emailMessages[idx] = clone(m);
      return m;
    },
    async listEmailMessagesByIncident(incidentId) {
      return emailMessages.filter((m) => m.incidentId === incidentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(clone);
    },
    async listEmailMessages() {
      return emailMessages.map(clone);
    },

    async listServices() {
      return services.map(clone);
    },
    async findServiceById(id) {
      const f = services.find((s) => s.id === id);
      return f ? clone(f) : null;
    },
    async insertService(s) {
      services.push(clone(s));
      return s;
    },
    async updateService(s) {
      const idx = services.findIndex((x) => x.id === s.id);
      if (idx >= 0) services[idx] = clone(s);
      return s;
    },

    async listSlaPolicies() {
      return slaPolicies.map(clone);
    },
    async findSlaPolicyById(id) {
      const f = slaPolicies.find((p) => p.id === id);
      return f ? clone(f) : null;
    },
    async insertSlaPolicy(p) {
      slaPolicies.push(clone(p));
      return p;
    },
    async updateSlaPolicy(p) {
      const idx = slaPolicies.findIndex((x) => x.id === p.id);
      if (idx >= 0) slaPolicies[idx] = clone(p);
      return p;
    },
    async listBusinessCalendars() {
      return businessCalendars.map(clone);
    },
    async findBusinessCalendarById(id) {
      const f = businessCalendars.find((c) => c.id === id);
      return f ? clone(f) : null;
    },
    async insertBusinessCalendar(c) {
      businessCalendars.push(clone(c));
      return c;
    },
    async updateBusinessCalendar(c) {
      const idx = businessCalendars.findIndex((x) => x.id === c.id);
      if (idx >= 0) businessCalendars[idx] = clone(c);
      return c;
    },
  };
}
