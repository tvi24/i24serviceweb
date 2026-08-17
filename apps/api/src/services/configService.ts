import type { AuthUser, SlaConfig } from '@incident/shared';
import type { Repositories } from '../repositories/types';
import { writeAudit } from './auditService';

export async function getSlaConfig(repos: Repositories): Promise<SlaConfig> {
  return repos.getSlaConfig();
}

export async function updateSlaConfig(repos: Repositories, next: SlaConfig, actor: AuthUser): Promise<SlaConfig> {
  const saved = await repos.updateSlaConfig({ ...next, updatedAt: new Date().toISOString(), updatedBy: actor.id });
  await writeAudit(repos, { action: 'config.sla_updated', targetType: 'config', targetId: 'sla', actor });
  return saved;
}
