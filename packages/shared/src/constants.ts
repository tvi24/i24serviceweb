import type {
  IncidentStatus,
  Priority,
  Role,
  SlaConfig,
  SupportGroup,
} from './types.js';

export const ROLES: Role[] = [
  'business_user',
  'service_desk',
  'application_support',
  'infrastructure_support',
  'manager',
  'management',
  'platform_admin',
];

export const ROLE_LABELS: Record<Role, string> = {
  business_user: 'Business User',
  service_desk: 'Service Desk',
  application_support: 'Application Support',
  infrastructure_support: 'Infrastructure Support',
  manager: 'Manager',
  management: 'Management',
  platform_admin: 'Platform Administrator',
};

// ---- v3.0 granular permission catalog (additive layer over role gate) ----
export type PermissionKey =
  | 'org.manage'
  | 'user.manage'
  | 'role.manage'
  | 'supportgroup.manage'
  | 'service.manage'
  | 'sla.manage'
  | 'email.manage'
  | 'audit.view'
  | 'dashboard.view'
  | 'incident.triage'
  | 'incident.work'
  | 'incident.report';

export const PERMISSIONS: Record<PermissionKey, string> = {
  'org.manage': 'Create and edit organization, business units, departments, locations',
  'user.manage': 'Administer users and profiles',
  'role.manage': 'Administer roles and permissions',
  'supportgroup.manage': 'Administer support groups and membership',
  'service.manage': 'Administer the service catalog',
  'sla.manage': 'Administer SLA policies and business calendars',
  'email.manage': 'Administer email accounts and templates',
  'audit.view': 'View audit trail',
  'dashboard.view': 'View analytics dashboards',
  'incident.triage': 'Triage, assign, and prioritize incidents',
  'incident.work': 'Investigate and resolve incidents',
  'incident.report': 'Report and track own incidents',
};

// Default role -> permission mapping. platform_admin holds all configuration permissions
// and is intentionally separate from manager (refinement spec section 4.1).
export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  business_user: ['incident.report'],
  service_desk: ['incident.triage', 'incident.work', 'incident.report'],
  application_support: ['incident.work', 'incident.report'],
  infrastructure_support: ['incident.work', 'incident.report'],
  manager: ['incident.triage', 'incident.work', 'dashboard.view', 'audit.view', 'sla.manage', 'incident.report'],
  management: ['dashboard.view'],
  platform_admin: [
    'org.manage',
    'user.manage',
    'role.manage',
    'supportgroup.manage',
    'service.manage',
    'sla.manage',
    'email.manage',
    'audit.view',
  ],
};

export function permissionsForRoles(roles: Role[]): PermissionKey[] {
  const set = new Set<PermissionKey>();
  for (const r of roles) for (const p of ROLE_PERMISSIONS[r] ?? []) set.add(p);
  return [...set];
}

export const PRIORITIES: Priority[] = ['P1', 'P2', 'P3', 'P4'];

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  new: 'New',
  triaged: 'Triaged',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  pending: 'Pending',
  resolved: 'Resolved',
  reopened: 'Reopened',
  closed: 'Closed',
  fallback: 'Fallback Queue',
};

// Allowed status transitions. Any transition not listed is rejected (422).
export const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  new: ['triaged', 'fallback'],
  triaged: ['assigned', 'fallback'],
  fallback: ['assigned', 'triaged'],
  assigned: ['in_progress', 'pending'],
  in_progress: ['pending', 'resolved'],
  pending: ['in_progress', 'resolved'],
  resolved: ['closed', 'reopened'],
  reopened: ['in_progress', 'assigned'],
  closed: [],
};

export const SUPPORT_GROUPS: SupportGroup[] = [
  'service_desk',
  'application_support',
  'infrastructure_support',
];

// Default editable workshop SLA configuration (assessment BR-03 defaults).
export const DEFAULT_SLA_CONFIG: SlaConfig = {
  targets: {
    P1: { responseMin: 15, resolutionMin: 240 },
    P2: { responseMin: 30, resolutionMin: 480 },
    P3: { responseMin: 240, resolutionBd: 3 },
    P4: { responseMin: 480, resolutionBd: 5 },
  },
  atRiskPct: 80,
  priorityMatrix: {
    'high-high': 'P1',
    'high-medium': 'P2',
    'high-low': 'P3',
    'medium-high': 'P2',
    'medium-medium': 'P3',
    'medium-low': 'P4',
    'low-high': 'P3',
    'low-medium': 'P4',
    'low-low': 'P4',
  },
  routingRules: {
    application: 'application_support',
    infrastructure: 'infrastructure_support',
    network: 'infrastructure_support',
    access: 'service_desk',
    email: 'application_support',
    other: 'service_desk',
  },
  closureGraceHours: 72,
  reminderMax: 3,
};

export const CLASSIFICATIONS = [
  'application',
  'infrastructure',
  'network',
  'access',
  'email',
  'other',
] as const;

export const RESOLUTION_CODES = [
  'fixed',
  'workaround',
  'configuration_change',
  'no_fault_found',
  'duplicate',
  'user_error',
] as const;

// ---- v3.0 incident dimensions ----
export const CHANNELS = ['web_portal', 'mail', 'line', 'phone', 'monitoring'] as const;

export const CATEGORIES = ['email', 'access', 'application', 'infrastructure', 'network'] as const;

// Suggested subcategories per category (configurable in spirit; used to populate pickers).
export const SUBCATEGORIES: Record<string, string[]> = {
  email: ['delivery', 'performance', 'configuration'],
  access: ['authentication', 'authorization', 'account_lockout'],
  application: ['error', 'performance', 'feature_request'],
  infrastructure: ['server', 'storage', 'database'],
  network: ['connectivity', 'performance', 'vpn'],
};

export const REQUEST_TYPES = ['incident', 'service_request'] as const;
