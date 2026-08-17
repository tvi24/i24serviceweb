import { DEFAULT_SLA_CONFIG } from '../constants.js';
import type { AuditEvent, SlaConfig } from '../types.js';
import { activities, alerts, csats, incidents, slaRecords } from './incidents.js';
import { users } from './users.js';

export { users, WORKSHOP_PASSWORDS } from './users.js';
export { incidents, activities, slaRecords, alerts, csats } from './incidents.js';

export const auditEvents: AuditEvent[] = [
  { id: 'ae-1', actorId: 'u-emma', actorLabel: 'Emma Employee', action: 'incident.created', targetType: 'incident', targetId: 'i-1001', detail: { ticketId: 'INC-2026-001001' }, createdAt: '2026-08-17T07:30:00.000Z' },
  { id: 'ae-2', actorId: 'u-sam', actorLabel: 'Sam ServiceDesk', action: 'incident.assigned', targetType: 'incident', targetId: 'i-1001', detail: { supportGroup: 'application_support', owner: 'u-alex' }, createdAt: '2026-08-17T07:40:00.000Z' },
  { id: 'ae-3', actorId: null, actorLabel: 'system', action: 'alert.created', targetType: 'alert', targetId: 'al-1', detail: { type: 'priority' }, createdAt: '2026-08-17T07:30:05.000Z' },
];

export const slaConfig: SlaConfig = { ...DEFAULT_SLA_CONFIG, updatedAt: '2026-08-01T00:00:00.000Z' };

// Deep clone so callers (memory repo) get isolated mutable copies.
export function seedData() {
  return structuredClone({
    users,
    incidents,
    activities,
    slaRecords,
    alerts,
    csats,
    auditEvents,
    slaConfig,
  });
}
