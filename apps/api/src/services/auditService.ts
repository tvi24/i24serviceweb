import type { AuditEvent, AuthUser } from '@incident/shared';
import { uuid } from '../lib/ids';
import type { Repositories } from '../repositories/types';

export async function writeAudit(
  repos: Repositories,
  params: {
    action: string;
    targetType: AuditEvent['targetType'];
    targetId: string | null;
    actor: AuthUser | null;
    detail?: Record<string, unknown>;
  }
): Promise<void> {
  const event: AuditEvent = {
    id: uuid(),
    actorId: params.actor?.id ?? null,
    actorLabel: params.actor?.displayName ?? 'system',
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    detail: params.detail ?? null,
    createdAt: new Date().toISOString(),
  };
  await repos.insertAudit(event);
}

export async function listIncidentAudit(repos: Repositories, incidentId: string): Promise<AuditEvent[]> {
  return repos.listAuditByIncident(incidentId);
}
