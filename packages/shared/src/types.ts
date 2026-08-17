// Shared domain types for the Incident Management system.
// Single source of truth consumed by both the API (memory + pg repos) and the web app.

export type Role =
  | 'business_user'
  | 'service_desk'
  | 'application_support'
  | 'infrastructure_support'
  | 'manager'
  | 'management';

export type SupportGroup =
  | 'service_desk'
  | 'application_support'
  | 'infrastructure_support';

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export type ImpactUrgency = 'high' | 'medium' | 'low';

export type IncidentStatus =
  | 'new'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'pending'
  | 'resolved'
  | 'reopened'
  | 'closed'
  | 'fallback';

export type SlaState = 'within_target' | 'at_risk' | 'breached';

export type Channel = 'web_portal' | 'mail' | 'line' | 'phone';

export type AiSource = 'rules' | 'bedrock';

export interface User {
  id: string;
  username: string;
  displayName: string;
  roles: Role[];
  supportGroup?: SupportGroup | null;
  isActive: boolean;
  createdAt: string;
}

export interface Incident {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  reporterId: string;
  channel: Channel;
  classification?: string | null;
  classificationSuggested?: string | null;
  impact?: ImpactUrgency | null;
  urgency?: ImpactUrgency | null;
  priority?: Priority | null;
  prioritySuggested?: Priority | null;
  aiSource?: AiSource | null;
  status: IncidentStatus;
  supportGroup?: SupportGroup | null;
  assignedOwnerId?: string | null;
  resolutionCode?: string | null;
  resolutionNote?: string | null;
  reopenReason?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export type ActivityType =
  | 'work_note'
  | 'status_change'
  | 'assignment'
  | 'resolution'
  | 'reopen';

export interface Activity {
  id: string;
  incidentId: string;
  type: ActivityType;
  authorId: string;
  note?: string | null;
  fromStatus?: IncidentStatus | null;
  toStatus?: IncidentStatus | null;
  createdAt: string;
}

export interface SlaRecord {
  id: string;
  incidentId: string;
  priority: Priority;
  responseTargetAt: string;
  resolutionTargetAt: string;
  responseAt?: string | null;
  responseState: SlaState;
  resolutionState: SlaState;
  startedAt: string;
}

export type AlertType =
  | 'priority'
  | 'sla_at_risk'
  | 'sla_breach'
  | 'status'
  | 'escalation';

export type AlertSeverity = 'info' | 'warning' | 'danger';

export interface Alert {
  id: string;
  incidentId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  recipientRole?: Role | null;
  recipientId?: string | null;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  createdAt: string;
}

export interface Csat {
  id: string;
  incidentId: string;
  confirmedAt?: string | null;
  rating?: number | null;
  comment?: string | null;
  reminderCount: number;
  lastReminderAt?: string | null;
  submittedAt?: string | null;
}

export interface AuditEvent {
  id: string;
  actorId?: string | null;
  actorLabel: string;
  action: string;
  targetType: 'incident' | 'alert' | 'config' | 'auth';
  targetId?: string | null;
  detail?: Record<string, unknown> | null;
  createdAt: string;
}

export interface SlaTarget {
  responseMin: number;
  // Either resolutionMin (minutes) OR resolutionBd (business days).
  resolutionMin?: number;
  resolutionBd?: number;
}

export interface SlaConfig {
  targets: Record<Priority, SlaTarget>;
  atRiskPct: number;
  priorityMatrix: Record<string, Priority>;
  routingRules: Record<string, SupportGroup>;
  closureGraceHours: number;
  reminderMax: number;
  updatedAt?: string;
  updatedBy?: string | null;
}

// ---- API DTOs ----

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  roles: Role[];
  supportGroup?: SupportGroup | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface IntakeRequest {
  title: string;
  description: string;
  impact?: ImpactUrgency;
  urgency?: ImpactUrgency;
}

export interface IntakeResponse {
  id: string;
  ticketId: string;
  duplicateWarning?: string;
}

export interface Suggestion {
  classification: string;
  priority: Priority;
  source: AiSource;
  label: string;
}

export interface IncidentDetail extends Incident {
  reporter?: Pick<User, 'id' | 'displayName' | 'username'> | null;
  owner?: Pick<User, 'id' | 'displayName' | 'username'> | null;
  sla?: SlaRecord | null;
  activities: Activity[];
  alerts: Alert[];
  csat?: Csat | null;
}

export interface IncidentFilters {
  status?: IncidentStatus;
  priority?: Priority;
  supportGroup?: SupportGroup;
  assignedOwnerId?: string;
  reporterId?: string;
  mine?: boolean;
}

export interface TriageRequest {
  classification: string;
  impact: ImpactUrgency;
  urgency: ImpactUrgency;
  priority: Priority;
}

export interface AssignRequest {
  supportGroup?: SupportGroup;
  ownerId?: string | null;
}

export interface ResolveRequest {
  resolutionCode: string;
  resolutionNote: string;
}

export interface CsatRequest {
  rating: number;
  comment?: string;
}

export interface KpiSummary {
  countsByStatus: Record<string, number>;
  countsByPriority: Record<string, number>;
  slaCompliancePct: number;
  slaBreachCount: number;
  agingBuckets: Record<string, number>;
  reopenCount: number;
  avgCsat: number | null;
  recurring: Array<{ classification: string; count: number }>;
  trend: Array<{ date: string; count: number }>;
  hasData: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    errorId: string;
    fields?: Record<string, string>;
  };
}
