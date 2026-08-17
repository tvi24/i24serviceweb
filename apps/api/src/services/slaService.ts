import { computeSlaTargets, evaluateSlaState, type Incident, type SlaRecord } from '@incident/shared';
import { uuid } from '../lib/ids';
import type { Repositories } from '../repositories/types';
import { createAlert } from './alertService';

// Start SLA tracking once an incident has a priority and is assigned.
export async function startSlaTracking(repos: Repositories, inc: Incident): Promise<void> {
  if (!inc.priority) return;
  const existing = await repos.findSlaByIncident(inc.id);
  if (existing) return;
  const config = await repos.getSlaConfig();
  const started = new Date();
  const { responseTargetAt, resolutionTargetAt } = computeSlaTargets(inc.priority, started, config);
  const record: SlaRecord = {
    id: uuid(),
    incidentId: inc.id,
    priority: inc.priority,
    responseTargetAt: responseTargetAt.toISOString(),
    resolutionTargetAt: resolutionTargetAt.toISOString(),
    responseAt: null,
    responseState: 'within_target',
    resolutionState: 'within_target',
    startedAt: started.toISOString(),
  };
  await repos.insertSlaRecord(record);
}

// Re-evaluate all active SLA records; create alerts on state escalation. Used by slaClock.
export async function evaluateAllSla(repos: Repositories, now = new Date()): Promise<number> {
  const config = await repos.getSlaConfig();
  const records = await repos.listSlaRecords();
  let changed = 0;
  for (const rec of records) {
    const inc = await repos.findIncidentById(rec.incidentId);
    if (!inc || inc.status === 'closed' || inc.status === 'resolved') continue;

    const started = new Date(rec.startedAt);
    const prevResolution = rec.resolutionState;
    const prevResponse = rec.responseState;

    if (!rec.responseAt) {
      rec.responseState = evaluateSlaState(started, new Date(rec.responseTargetAt), now, config.atRiskPct);
    } else {
      rec.responseState = 'within_target';
    }
    rec.resolutionState = evaluateSlaState(started, new Date(rec.resolutionTargetAt), now, config.atRiskPct);

    if (rec.resolutionState !== prevResolution || rec.responseState !== prevResponse) {
      await repos.updateSlaRecord(rec);
      changed += 1;

      if (rec.resolutionState === 'at_risk' && prevResolution === 'within_target') {
        await createAlert(repos, { incidentId: inc.id, type: 'sla_at_risk', severity: 'warning', message: `Resolution SLA at risk: ${inc.ticketId}`, recipientRole: 'manager', recipientId: inc.assignedOwnerId ?? null });
      }
      if (rec.resolutionState === 'breached' && prevResolution !== 'breached') {
        await createAlert(repos, { incidentId: inc.id, type: 'sla_breach', severity: 'danger', message: `Resolution SLA breached: ${inc.ticketId}`, recipientRole: 'manager', recipientId: inc.assignedOwnerId ?? null });
      }
      if (rec.responseState === 'breached' && prevResponse !== 'breached' && !rec.responseAt) {
        await createAlert(repos, { incidentId: inc.id, type: 'sla_breach', severity: 'danger', message: `Response SLA breached: ${inc.ticketId}`, recipientRole: 'manager', recipientId: inc.assignedOwnerId ?? null });
      }
    }
  }
  return changed;
}

export async function markResponded(repos: Repositories, incidentId: string): Promise<void> {
  const rec = await repos.findSlaByIncident(incidentId);
  if (rec && !rec.responseAt) {
    rec.responseAt = new Date().toISOString();
    rec.responseState = 'within_target';
    await repos.updateSlaRecord(rec);
  }
}
