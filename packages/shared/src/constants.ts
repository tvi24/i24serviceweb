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
];

export const ROLE_LABELS: Record<Role, string> = {
  business_user: 'Business User',
  service_desk: 'Service Desk',
  application_support: 'Application Support',
  infrastructure_support: 'Infrastructure Support',
  manager: 'Manager',
  management: 'Management',
};

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
