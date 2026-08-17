import type { Alert, AuthUser } from '@incident/shared';
import { Errors } from '../lib/errors';
import { uuid } from '../lib/ids';
import type { Repositories } from '../repositories/types';
import { writeAudit } from './auditService';

export async function createAlert(
  repos: Repositories,
  a: Omit<Alert, 'id' | 'createdAt' | 'acknowledgedAt' | 'acknowledgedBy'>
): Promise<Alert> {
  const alert: Alert = {
    ...a,
    id: uuid(),
    acknowledgedAt: null,
    acknowledgedBy: null,
    createdAt: new Date().toISOString(),
  };
  await repos.insertAlert(alert);
  await writeAudit(repos, { action: 'alert.created', targetType: 'alert', targetId: alert.id, actor: null, detail: { type: alert.type } });
  return alert;
}

export async function listAlertsForUser(repos: Repositories, actor: AuthUser): Promise<Alert[]> {
  const all = await repos.listAlerts();
  return all
    .filter((a) => {
      if (a.recipientId === actor.id) return true;
      if (a.recipientRole && actor.roles.includes(a.recipientRole)) return true;
      if (actor.roles.includes('manager') || actor.roles.includes('service_desk')) return true;
      return false;
    })
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}

export async function acknowledgeAlert(repos: Repositories, id: string, actor: AuthUser): Promise<Alert> {
  const alert = await repos.findAlertById(id);
  if (!alert) throw Errors.notFound('Alert not found.');
  alert.acknowledgedAt = new Date().toISOString();
  alert.acknowledgedBy = actor.id;
  await repos.updateAlert(alert);
  await writeAudit(repos, { action: 'alert.acknowledged', targetType: 'alert', targetId: alert.id, actor });
  return alert;
}
