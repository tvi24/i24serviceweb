import type { Repositories } from '../repositories/types';
import { writeAudit } from './auditService';
import { createAlert } from './alertService';

export interface MaintenanceResult {
  autoClosed: number;
  remindersSent: number;
}

// Periodic maintenance: auto-close resolved incidents past the grace window,
// and send CSAT reminders (up to reminderMax) for resolved/closed incidents
// that have not been rated yet.
export async function runMaintenance(
  repos: Repositories,
  now = new Date(),
  reminderIntervalMs = 24 * 3600_000
): Promise<MaintenanceResult> {
  const config = await repos.getSlaConfig();
  const result: MaintenanceResult = { autoClosed: 0, remindersSent: 0 };

  // Auto-close resolved incidents whose grace period has expired.
  const resolved = await repos.listIncidents({ status: 'resolved' });
  for (const inc of resolved) {
    if (!inc.resolvedAt) continue;
    const graceMs = config.closureGraceHours * 3600_000;
    if (now.getTime() - new Date(inc.resolvedAt).getTime() >= graceMs) {
      inc.status = 'closed';
      inc.closedAt = now.toISOString();
      inc.updatedAt = now.toISOString();
      await repos.updateIncident(inc);
      await writeAudit(repos, { action: 'incident.closed', targetType: 'incident', targetId: inc.id, actor: null, detail: { reason: 'closure grace expired' } });
      result.autoClosed += 1;
    }
  }

  // CSAT reminders for resolved/closed incidents without a submitted rating.
  const candidates = [...(await repos.listIncidents({ status: 'resolved' })), ...(await repos.listIncidents({ status: 'closed' }))];
  for (const inc of candidates) {
    const csat = await repos.findCsatByIncident(inc.id);
    if (!csat || csat.submittedAt) continue;
    if (csat.reminderCount >= config.reminderMax) continue;
    const last = csat.lastReminderAt ? new Date(csat.lastReminderAt).getTime() : 0;
    if (now.getTime() - last < reminderIntervalMs) continue;

    csat.reminderCount += 1;
    csat.lastReminderAt = now.toISOString();
    await repos.updateCsat(csat);
    await createAlert(repos, {
      incidentId: inc.id,
      type: 'status',
      severity: 'info',
      message: `Reminder: please rate your resolved incident ${inc.ticketId}`,
      recipientRole: null,
      recipientId: inc.reporterId,
    });
    result.remindersSent += 1;
  }

  return result;
}
