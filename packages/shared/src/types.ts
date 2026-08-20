// Shared domain types for the Incident Management system.
// Single source of truth consumed by both the API (memory + pg repos) and the web app.

export type Role =
  | 'business_user'
  | 'service_desk'
  | 'application_support'
  | 'infrastructure_support'
  | 'manager'
  | 'management'
  | 'platform_admin';

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

export type Channel = 'web_portal' | 'mail' | 'line' | 'phone' | 'monitoring';

// v3.0 service catalog entity (configurable).
export interface Service {
  id: string;
  name: string;
  ownerBuId?: string | null;
  active: boolean;
}

export type AiSource = 'rules' | 'bedrock';

export interface User {
  id: string;
  username: string;
  displayName: string;
  roles: Role[];
  supportGroup?: SupportGroup | null;
  isActive: boolean;
  createdAt: string;
  // ---- v3.0 profile (all optional; additive) ----
  jobTitle?: string | null;
  buId?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  locationId?: string | null;
  avatarUrl?: string | null;
  timeZone?: string | null;
  preferredLanguage?: 'th' | 'en' | null;
  preferredChannel?: 'email' | 'in_app' | null;
  lastLoginAt?: string | null;
}

// ---- v3.0 Organization hierarchy (configurable, not hard-coded) ----
export type OrgNodeType = 'group' | 'company';

export interface Organization {
  id: string;
  name: string;
  type: OrgNodeType;
  parentId?: string | null;
  active: boolean;
}

export interface BusinessUnit {
  id: string;
  orgId: string;
  code: string;
  name: string;
  managerId?: string | null;
  active: boolean;
}

export interface Department {
  id: string;
  buId: string;
  name: string;
  active: boolean;
}

export interface Location {
  id: string;
  name: string;
  timeZone: string;
  active: boolean;
}

// ---- v3.0 Email identity ----
export type EmailType = 'work' | 'personal' | 'alternate';

export interface UserEmail {
  id: string;
  userId: string;
  emailAddress: string;
  emailType: EmailType;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt?: string | null;
  active: boolean;
}

// ---- v3.0 Email ticketing ----
export type EmailDirection = 'inbound' | 'outbound';
export type EmailDeliveryState = 'pending' | 'sent' | 'delivered' | 'failed' | 'received';
export type EmailProcessingState = 'new' | 'linked' | 'created_incident' | 'ignored';
export type EmailAccountDirection = 'inbound' | 'outbound' | 'both';

export interface EmailAccount {
  id: string;
  name: string;
  address: string;
  displayName: string;
  provider: 'mock' | 'smtp' | 'graph' | 'ses';
  direction: EmailAccountDirection;
  authType: 'none' | 'basic' | 'oauth';
  status: 'connected' | 'disconnected' | 'error';
  lastInboundAt?: string | null;
  lastOutboundAt?: string | null;
  active: boolean;
}

export interface EmailThread {
  id: string;
  incidentId?: string | null;
  reference: string; // stable thread reference (e.g. ticket id token)
  subject: string;
  createdAt: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  incidentId?: string | null;
  direction: EmailDirection;
  fromAddr: string;
  toAddr: string;
  cc?: string | null;
  subject: string;
  body: string;
  visibility: 'public' | 'internal'; // agent internal note vs public reply
  deliveryState: EmailDeliveryState;
  processingState: EmailProcessingState;
  errorState?: string | null;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  body: string;
}

// ---- v3.0 Granular RBAC objects (additive to coarse role gate) ----
export interface Permission {
  key: string;
  description: string;
}

export interface SupportGroupMember {
  supportGroup: SupportGroup;
  userId: string;
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
  // ---- v3.0 service dimensions + org context (all optional; additive) ----
  serviceId?: string | null;
  category?: string | null;
  subcategory?: string | null;
  requesterBuId?: string | null;
  affectedBuId?: string | null;
  serviceOwnerBuId?: string | null;
  requestType?: RequestType | null;
  resolutionCode?: string | null;
  resolutionNote?: string | null;
  reopenReason?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  // Transient (computed for list responses; not persisted): worst SLA state for filtering/queues.
  slaState?: SlaState | null;
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
  // ---- v3.0 SLA engine (additive/optional; fall back to global config when absent) ----
  policyId?: string | null;
  policyName?: string | null;
  calendarId?: string | null;
  resolutionMetAt?: string | null;
}

// ---- v3.0 configurable SLA policy engine ----
export type SlaInstanceState =
  | 'not_started'
  | 'running'
  | 'paused'
  | 'at_risk'
  | 'met'
  | 'breached'
  | 'cancelled';

export type RequestType = 'incident' | 'service_request';

export interface SlaPolicy {
  id: string;
  name: string;
  // Conditions (any null = wildcard). Resolution picks the most specific active policy.
  buId?: string | null;
  serviceId?: string | null;
  priority?: Priority | null;
  requestType?: RequestType | null;
  responseTargetMin: number;
  // Either resolutionMin (minutes) OR resolutionBd (business days).
  resolutionMin?: number | null;
  resolutionBd?: number | null;
  calendarId?: string | null;
  warningPct: number; // at-risk threshold (% of target elapsed)
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  active: boolean;
}

export interface BusinessCalendar {
  id: string;
  name: string;
  timeZone: string;
  mode: 'business_hours' | '24x7';
  workDays: number[]; // 0=Sun..6=Sat
  workStart: string; // 'HH:MM'
  workEnd: string; // 'HH:MM'
  holidays: string[]; // 'YYYY-MM-DD'
  active: boolean;
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
  channel?: Channel;
  serviceId?: string | null;
  category?: string | null;
  subcategory?: string | null;
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
  // Mandatory when the applied priority differs from the AI/rules recommendation (BR-11).
  overrideReason?: string;
  // Optional service dimensions captured during triage.
  serviceId?: string | null;
  category?: string | null;
  subcategory?: string | null;
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

export interface MySlaSummary {
  total: number;
  open: number;
  withinTarget: number;
  atRisk: number;
  breached: number;
  withinPct: number | null;
}

export interface KpiDimensionRow {
  key: string; // e.g. bu id, service id, priority, support group ('unset' when none)
  label: string;
  total: number;
  open: number;
  breached: number;
  atRisk: number;
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
  // ---- v3.0 interactive dashboard envelope + dimensions ----
  lastRefreshedAt: string;
  slaEligible: number; // denominator for compliance
  slaMet: number; // numerator for compliance
  atRiskCount: number;
  breachedCount: number;
  p1Count: number;
  p2Count: number;
  untriagedCount: number;
  mttaMinutes: number | null; // mean time to acknowledge (response)
  mttrMinutes: number | null; // mean time to resolve
  reopenRate: number | null; // reopened incidents / resolved-or-closed
  csatCount: number;
  byBu: KpiDimensionRow[];
  byService: KpiDimensionRow[];
  bySupportGroup: KpiDimensionRow[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    errorId: string;
    fields?: Record<string, string>;
  };
}
