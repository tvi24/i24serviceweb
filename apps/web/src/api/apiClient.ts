import type {
  Alert,
  AssignRequest,
  AuthUser,
  BusinessCalendar,
  BusinessUnit,
  CsatRequest,
  Department,
  EmailAccount,
  EmailMessage,
  Incident,
  IncidentDetail,
  IncidentFilters,
  IncidentStatus,
  KpiSummary,
  Location,
  LoginResponse,
  MySlaSummary,
  Organization,
  ResolveRequest,
  Service,
  SlaConfig,
  SlaPolicy,
  Suggestion,
  TriageRequest,
  User,
  UserEmail,
} from '@incident/shared';
import * as mock from './mockBackend';

const MODE = (import.meta.env.VITE_DATA_MODE ?? 'mock') as 'mock' | 'http';
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

// Unified error surfaced to the UI regardless of transport.
export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  errorId?: string;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>, errorId?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.errorId = errorId;
  }
}

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

// ---- mock latency helper ----
function delay<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (e) {
        if (e instanceof mock.MockApiError) {
          reject(new ApiError(e.status, e.code, e.message, e.fields));
        } else {
          reject(e);
        }
      }
    }, 120);
  });
}

// ---- http helper (Phase 2) ----
async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = body?.error ?? { code: 'error', message: 'Request failed' };
    throw new ApiError(res.status, err.code, err.message, err.fields, err.errorId);
  }
  return body as T;
}

function actor(): AuthUser {
  try {
    return mock.resolveActor(authToken);
  } catch (e) {
    if (e instanceof mock.MockApiError) throw new ApiError(e.status, e.code, e.message);
    throw e;
  }
}

// ---- API surface ----
export const api = {
  login(username: string, password: string): Promise<LoginResponse> {
    if (MODE === 'mock') return delay(() => mock.login(username, password));
    return http<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  },

  listIncidents(filters: IncidentFilters = {}): Promise<Incident[]> {
    if (MODE === 'mock') return delay(() => mock.listIncidents(filters, actor()));
    // Reporters (business users) are not authorized for the support-scoped list; use the
    // dedicated /incidents/mine endpoint whenever the caller asks for their own incidents.
    if (filters.mine) return http<Incident[]>('/incidents/mine');
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString();
    return http<Incident[]>(`/incidents${qs ? `?${qs}` : ''}`);
  },

  getIncident(id: string): Promise<IncidentDetail> {
    if (MODE === 'mock') return delay(() => mock.getIncident(id, actor()));
    return http<IncidentDetail>(`/incidents/${id}`);
  },

  createIncident(payload: { title: string; description: string; impact?: string; urgency?: string; channel?: string; serviceId?: string | null; category?: string | null; subcategory?: string | null }, idempotencyKey?: string) {
    if (MODE === 'mock') return delay(() => mock.createIncident(payload, idempotencyKey, actor()));
    return http<{ id: string; ticketId: string; duplicateWarning?: string }>('/incidents', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      body: JSON.stringify(payload),
    });
  },

  getSuggestions(id: string): Promise<Suggestion> {
    if (MODE === 'mock') return delay(() => mock.getSuggestions(id));
    return http<Suggestion>(`/incidents/${id}/suggestions`);
  },

  triage(id: string, req: TriageRequest): Promise<IncidentDetail> {
    if (MODE === 'mock') return delay(() => mock.triage(id, req, actor()));
    return http<IncidentDetail>(`/incidents/${id}/triage`, { method: 'PATCH', body: JSON.stringify(req) });
  },

  assign(id: string, req: AssignRequest): Promise<IncidentDetail> {
    if (MODE === 'mock') return delay(() => mock.assign(id, req, actor()));
    return http<IncidentDetail>(`/incidents/${id}/assign`, { method: 'POST', body: JSON.stringify(req) });
  },

  addNote(id: string, note: string): Promise<IncidentDetail> {
    if (MODE === 'mock') return delay(() => mock.addNote(id, note, actor()));
    return http<IncidentDetail>(`/incidents/${id}/notes`, { method: 'POST', body: JSON.stringify({ note }) });
  },

  changeStatus(id: string, toStatus: IncidentStatus): Promise<IncidentDetail> {
    if (MODE === 'mock') return delay(() => mock.changeStatus(id, toStatus, actor()));
    return http<IncidentDetail>(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: toStatus }) });
  },

  resolve(id: string, req: ResolveRequest): Promise<IncidentDetail> {
    if (MODE === 'mock') return delay(() => mock.resolve(id, req, actor()));
    return http<IncidentDetail>(`/incidents/${id}/resolve`, { method: 'POST', body: JSON.stringify(req) });
  },

  confirm(id: string): Promise<IncidentDetail> {
    if (MODE === 'mock') return delay(() => mock.confirm(id, actor()));
    return http<IncidentDetail>(`/incidents/${id}/confirm`, { method: 'POST' });
  },

  submitCsat(id: string, req: CsatRequest): Promise<IncidentDetail> {
    if (MODE === 'mock') return delay(() => mock.submitCsat(id, req, actor()));
    return http<IncidentDetail>(`/incidents/${id}/csat`, { method: 'POST', body: JSON.stringify(req) });
  },

  reopen(id: string, reason: string): Promise<IncidentDetail> {
    if (MODE === 'mock') return delay(() => mock.reopen(id, reason, actor()));
    return http<IncidentDetail>(`/incidents/${id}/reopen`, { method: 'POST', body: JSON.stringify({ reason }) });
  },

  close(id: string): Promise<IncidentDetail> {
    if (MODE === 'mock') return delay(() => mock.closeIncident(id, actor()));
    return http<IncidentDetail>(`/incidents/${id}/close`, { method: 'POST' });
  },

  listAlerts(): Promise<Alert[]> {
    if (MODE === 'mock') return delay(() => mock.listAlerts(actor()));
    return http<Alert[]>('/alerts');
  },

  ackAlert(id: string): Promise<Alert> {
    if (MODE === 'mock') return delay(() => mock.ackAlert(id, actor()));
    return http<Alert>(`/alerts/${id}/ack`, { method: 'POST' });
  },

  getKpi(range: string = 'all'): Promise<KpiSummary> {
    if (MODE === 'mock') return delay(() => mock.getKpi(range));
    return http<KpiSummary>(`/kpi/summary${range && range !== 'all' ? `?range=${range}` : ''}`);
  },

  getMySlaSummary(): Promise<MySlaSummary> {
    if (MODE === 'mock') return delay(() => mock.getMySlaSummary(actor()));
    return http<MySlaSummary>('/incidents/my-sla');
  },

  getSlaConfig(): Promise<SlaConfig> {
    if (MODE === 'mock') return delay(() => mock.getSlaConfig());
    return http<SlaConfig>('/config/sla');
  },

  updateSlaConfig(config: SlaConfig): Promise<SlaConfig> {
    if (MODE === 'mock') return delay(() => mock.updateSlaConfig(config, actor()));
    return http<SlaConfig>('/config/sla', { method: 'PUT', body: JSON.stringify(config) });
  },

  // ---- SLA policy engine (v3.0) ----
  getSlaEngine(): Promise<SlaEngine> {
    if (MODE === 'mock') return delay(() => mock.listSlaEngine());
    return http<SlaEngine>('/config/sla-engine');
  },
  createSlaPolicy(body: Partial<SlaPolicy>): Promise<SlaPolicy> {
    if (MODE === 'mock') return delay(() => mock.createSlaPolicy(body, actor()));
    return http<SlaPolicy>('/config/sla-policies', { method: 'POST', body: JSON.stringify(body) });
  },
  updateSlaPolicy(id: string, patch: Partial<SlaPolicy>): Promise<SlaPolicy> {
    if (MODE === 'mock') return delay(() => mock.updateSlaPolicy(id, patch, actor()));
    return http<SlaPolicy>(`/config/sla-policies/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },
  createBusinessCalendar(body: Partial<BusinessCalendar>): Promise<BusinessCalendar> {
    if (MODE === 'mock') return delay(() => mock.createBusinessCalendar(body, actor()));
    return http<BusinessCalendar>('/config/business-calendars', { method: 'POST', body: JSON.stringify(body) });
  },
  updateBusinessCalendar(id: string, patch: Partial<BusinessCalendar>): Promise<BusinessCalendar> {
    if (MODE === 'mock') return delay(() => mock.updateBusinessCalendar(id, patch, actor()));
    return http<BusinessCalendar>(`/config/business-calendars/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },

  getAudit(id: string) {
    if (MODE === 'mock') return delay(() => mock.getAudit(id));
    return http(`/incidents/${id}/audit`);
  },

  // ---- Email ticketing (v3.0) ----
  getIncidentEmails(id: string): Promise<EmailMessage[]> {
    if (MODE === 'mock') return delay(() => mock.listIncidentEmails(id));
    return http<EmailMessage[]>(`/incidents/${id}/emails`);
  },
  replyIncident(id: string, body: string, visibility: 'public' | 'internal'): Promise<EmailMessage> {
    if (MODE === 'mock') return delay(() => mock.agentReply(id, { body, visibility }, actor()));
    return http<EmailMessage>(`/incidents/${id}/reply`, { method: 'POST', body: JSON.stringify({ body, visibility }) });
  },
  ingestInboundEmail(payload: { from: string; subject: string; body: string }): Promise<{ action: 'linked' | 'created'; incidentId: string; ticketId: string }> {
    if (MODE === 'mock') return delay(() => mock.ingestInbound(payload, actor()));
    return http('/email/inbound', { method: 'POST', body: JSON.stringify(payload) });
  },
  getEmailAccounts(): Promise<EmailAccount[]> {
    if (MODE === 'mock') return delay(() => mock.listEmailAccounts());
    return http<EmailAccount[]>('/email/accounts');
  },
  testEmailConnection(id: string): Promise<{ ok: boolean; status: string }> {
    if (MODE === 'mock') return delay(() => mock.testConnection(id, actor()));
    return http(`/email/accounts/${id}/test`, { method: 'POST' });
  },
  sendTestEmail(id: string, to: string): Promise<{ ok: boolean }> {
    if (MODE === 'mock') return delay(() => mock.sendTestEmail(id, to, actor()));
    return http(`/email/accounts/${id}/send-test`, { method: 'POST', body: JSON.stringify({ to }) });
  },

  listUsers(): Promise<User[]> {
    if (MODE === 'mock') return delay(() => mock.listUsers());
    return http<User[]>('/users');
  },

  // ---- Organization master (v3.0) ----
  getOrgOverview(): Promise<OrgOverview> {
    if (MODE === 'mock') return delay(() => mock.getOrgOverview());
    return http<OrgOverview>('/admin/org');
  },
  createOrganization(payload: { name: string; type?: Organization['type']; parentId?: string | null }): Promise<Organization> {
    if (MODE === 'mock') return delay(() => mock.createOrganization(payload, actor()));
    return http<Organization>('/admin/org/organizations', { method: 'POST', body: JSON.stringify(payload) });
  },
  createBusinessUnit(payload: { orgId: string; code: string; name: string; managerId?: string | null }): Promise<BusinessUnit> {
    if (MODE === 'mock') return delay(() => mock.createBusinessUnit(payload, actor()));
    return http<BusinessUnit>('/admin/org/business-units', { method: 'POST', body: JSON.stringify(payload) });
  },
  createDepartment(payload: { buId: string; name: string }): Promise<Department> {
    if (MODE === 'mock') return delay(() => mock.createDepartment(payload, actor()));
    return http<Department>('/admin/org/departments', { method: 'POST', body: JSON.stringify(payload) });
  },
  createLocation(payload: { name: string; timeZone: string }): Promise<Location> {
    if (MODE === 'mock') return delay(() => mock.createLocation(payload, actor()));
    return http<Location>('/admin/org/locations', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateOrganization(id: string, patch: Partial<Organization>): Promise<Organization> {
    if (MODE === 'mock') return delay(() => mock.updateOrganization(id, patch, actor()));
    return http<Organization>(`/admin/org/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },
  updateBusinessUnit(id: string, patch: Partial<BusinessUnit>): Promise<BusinessUnit> {
    if (MODE === 'mock') return delay(() => mock.updateBusinessUnit(id, patch, actor()));
    return http<BusinessUnit>(`/admin/org/business-units/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },
  updateDepartment(id: string, patch: Partial<Department>): Promise<Department> {
    if (MODE === 'mock') return delay(() => mock.updateDepartment(id, patch, actor()));
    return http<Department>(`/admin/org/departments/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },
  updateLocation(id: string, patch: Partial<Location>): Promise<Location> {
    if (MODE === 'mock') return delay(() => mock.updateLocation(id, patch, actor()));
    return http<Location>(`/admin/org/locations/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },
  adminUpdateUser(id: string, patch: Partial<User>): Promise<User> {
    if (MODE === 'mock') return delay(() => mock.adminUpdateUser(id, patch, actor()));
    return http<User>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },

  // ---- Service catalog (v3.0) ----
  getServices(): Promise<Service[]> {
    if (MODE === 'mock') return delay(() => mock.listServices());
    return http<Service[]>('/admin/services');
  },
  createService(payload: { name: string; ownerBuId?: string | null }): Promise<Service> {
    if (MODE === 'mock') return delay(() => mock.createService(payload, actor()));
    return http<Service>('/admin/services', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateService(id: string, patch: Partial<Service>): Promise<Service> {
    if (MODE === 'mock') return delay(() => mock.updateService(id, patch, actor()));
    return http<Service>(`/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },

  // ---- Profile self-service (v3.0) ----
  getMyProfile(): Promise<MyProfile> {
    if (MODE === 'mock') return delay(() => mock.getMyProfile(actor()));
    return http<MyProfile>('/profile');
  },
  updateMyProfile(patch: Partial<User>): Promise<User> {
    if (MODE === 'mock') return delay(() => mock.updateMyProfile(actor(), patch));
    return http<User>('/profile', { method: 'PATCH', body: JSON.stringify(patch) });
  },
  addMyEmail(payload: { emailAddress: string; emailType?: UserEmail['emailType'] }): Promise<UserEmail> {
    if (MODE === 'mock') return delay(() => mock.addMyEmail(actor(), payload));
    return http<UserEmail>('/profile/emails', { method: 'POST', body: JSON.stringify(payload) });
  },
  verifyMyEmail(emailId: string): Promise<UserEmail> {
    if (MODE === 'mock') return delay(() => mock.verifyMyEmail(actor(), emailId));
    return http<UserEmail>(`/profile/emails/${emailId}/verify`, { method: 'POST' });
  },
};

export interface OrgOverview {
  organizations: Organization[];
  businessUnits: BusinessUnit[];
  departments: Department[];
  locations: Location[];
}
export interface MyProfile {
  user: User;
  emails: UserEmail[];
}
export interface SlaEngine {
  policies: SlaPolicy[];
  calendars: BusinessCalendar[];
}

export { MODE as DATA_MODE };
