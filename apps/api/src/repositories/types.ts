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
  updateUser(user: User): Promise<User>;

  // organization (v3.0)
  listOrganizations(): Promise<Organization[]>;
  insertOrganization(o: Organization): Promise<Organization>;
  updateOrganization(o: Organization): Promise<Organization>;
  findOrganizationById(id: string): Promise<Organization | null>;
  listBusinessUnits(): Promise<BusinessUnit[]>;
  insertBusinessUnit(b: BusinessUnit): Promise<BusinessUnit>;
  updateBusinessUnit(b: BusinessUnit): Promise<BusinessUnit>;
  findBusinessUnitById(id: string): Promise<BusinessUnit | null>;
  listDepartments(): Promise<Department[]>;
  insertDepartment(d: Department): Promise<Department>;
  updateDepartment(d: Department): Promise<Department>;
  findDepartmentById(id: string): Promise<Department | null>;
  listLocations(): Promise<Location[]>;
  insertLocation(l: Location): Promise<Location>;
  updateLocation(l: Location): Promise<Location>;
  findLocationById(id: string): Promise<Location | null>;

  // email identity (v3.0)
  listUserEmails(): Promise<UserEmail[]>;
  listUserEmailsByUser(userId: string): Promise<UserEmail[]>;
  insertUserEmail(e: UserEmail): Promise<UserEmail>;
  updateUserEmail(e: UserEmail): Promise<UserEmail>;
  findUserEmailById(id: string): Promise<UserEmail | null>;

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

  // email ticketing (v3.0)
  listEmailAccounts(): Promise<EmailAccount[]>;
  findEmailAccountById(id: string): Promise<EmailAccount | null>;
  updateEmailAccount(a: EmailAccount): Promise<EmailAccount>;
  listEmailTemplates(): Promise<EmailTemplate[]>;
  findEmailTemplateByKey(key: string): Promise<EmailTemplate | null>;
  insertEmailThread(t: EmailThread): Promise<EmailThread>;
  findEmailThreadByReference(reference: string): Promise<EmailThread | null>;
  findEmailThreadByIncident(incidentId: string): Promise<EmailThread | null>;
  updateEmailThread(t: EmailThread): Promise<EmailThread>;
  insertEmailMessage(m: EmailMessage): Promise<EmailMessage>;
  updateEmailMessage(m: EmailMessage): Promise<EmailMessage>;
  listEmailMessagesByIncident(incidentId: string): Promise<EmailMessage[]>;
  listEmailMessages(): Promise<EmailMessage[]>;

  // service catalog (v3.0)
  listServices(): Promise<Service[]>;
  findServiceById(id: string): Promise<Service | null>;
  insertService(s: Service): Promise<Service>;
  updateService(s: Service): Promise<Service>;

  // SLA policy engine (v3.0)
  listSlaPolicies(): Promise<SlaPolicy[]>;
  findSlaPolicyById(id: string): Promise<SlaPolicy | null>;
  insertSlaPolicy(p: SlaPolicy): Promise<SlaPolicy>;
  updateSlaPolicy(p: SlaPolicy): Promise<SlaPolicy>;
  listBusinessCalendars(): Promise<BusinessCalendar[]>;
  findBusinessCalendarById(id: string): Promise<BusinessCalendar | null>;
  insertBusinessCalendar(c: BusinessCalendar): Promise<BusinessCalendar>;
  updateBusinessCalendar(c: BusinessCalendar): Promise<BusinessCalendar>;
}
