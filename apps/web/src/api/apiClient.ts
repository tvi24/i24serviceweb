import type {
  Alert,
  AssignRequest,
  AuthUser,
  CsatRequest,
  Incident,
  IncidentDetail,
  IncidentFilters,
  IncidentStatus,
  KpiSummary,
  LoginResponse,
  ResolveRequest,
  SlaConfig,
  Suggestion,
  TriageRequest,
  User,
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
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString();
    return http<Incident[]>(`/incidents${qs ? `?${qs}` : ''}`);
  },

  getIncident(id: string): Promise<IncidentDetail> {
    if (MODE === 'mock') return delay(() => mock.getIncident(id, actor()));
    return http<IncidentDetail>(`/incidents/${id}`);
  },

  createIncident(payload: { title: string; description: string; impact?: string; urgency?: string }, idempotencyKey?: string) {
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

  getKpi(): Promise<KpiSummary> {
    if (MODE === 'mock') return delay(() => mock.getKpi());
    return http<KpiSummary>('/kpi/summary');
  },

  getSlaConfig(): Promise<SlaConfig> {
    if (MODE === 'mock') return delay(() => mock.getSlaConfig());
    return http<SlaConfig>('/config/sla');
  },

  updateSlaConfig(config: SlaConfig): Promise<SlaConfig> {
    if (MODE === 'mock') return delay(() => mock.updateSlaConfig(config, actor()));
    return http<SlaConfig>('/config/sla', { method: 'PUT', body: JSON.stringify(config) });
  },

  getAudit(id: string) {
    if (MODE === 'mock') return delay(() => mock.getAudit(id));
    return http(`/incidents/${id}/audit`);
  },

  listUsers(): Promise<User[]> {
    if (MODE === 'mock') return delay(() => mock.listUsers());
    return http<User[]>('/users');
  },
};

export { MODE as DATA_MODE };
