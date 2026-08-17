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

// Stored user includes the password hash + salt (never sent to clients).
export interface StoredUser extends User {
  passwordHash: string;
  passwordSalt: string;
}

export interface Repositories {
  // users
  findUserByUsername(username: string): Promise<StoredUser | null>;
  findUserById(id: string): Promise<StoredUser | null>;
  listUsers(): Promise<User[]>;

  // incidents
  insertIncident(inc: Incident): Promise<Incident>;
  findIncidentById(id: string): Promise<Incident | null>;
  findIncidentByIdempotencyKey(key: string): Promise<Incident | null>;
  findOpenIncidentByReporterTitle(reporterId: string, title: string): Promise<Incident | null>;
  listIncidents(filters: IncidentFilters): Promise<Incident[]>;
  updateIncident(inc: Incident): Promise<Incident>;
  nextTicketSeq(): Promise<number>;

  // activities
  insertActivity(a: Activity): Promise<Activity>;
  listActivitiesByIncident(incidentId: string): Promise<Activity[]>;

  // sla
  insertSlaRecord(s: SlaRecord): Promise<SlaRecord>;
  findSlaByIncident(incidentId: string): Promise<SlaRecord | null>;
  updateSlaRecord(s: SlaRecord): Promise<SlaRecord>;
  listSlaRecords(): Promise<SlaRecord[]>;

  // alerts
  insertAlert(a: Alert): Promise<Alert>;
  findAlertById(id: string): Promise<Alert | null>;
  updateAlert(a: Alert): Promise<Alert>;
  listAlerts(): Promise<Alert[]>;
  listAlertsByIncident(incidentId: string): Promise<Alert[]>;

  // csat
  insertCsat(c: Csat): Promise<Csat>;
  findCsatByIncident(incidentId: string): Promise<Csat | null>;
  updateCsat(c: Csat): Promise<Csat>;
  listCsats(): Promise<Csat[]>;

  // audit
  insertAudit(e: AuditEvent): Promise<AuditEvent>;
  listAuditByIncident(incidentId: string): Promise<AuditEvent[]>;

  // config
  getSlaConfig(): Promise<SlaConfig>;
  updateSlaConfig(config: SlaConfig): Promise<SlaConfig>;
}
