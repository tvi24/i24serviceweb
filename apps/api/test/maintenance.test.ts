import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '../src/repositories/memory';
import { runMaintenance } from '../src/services/maintenanceService';
import { confirmResolution, createIncident, resolveIncident, triageIncident, assignIncident, changeStatus } from '../src/services/incidentService';
import type { AuthUser } from '@incident/shared';

const emma: AuthUser = { id: 'u-emma', username: 'emma', displayName: 'Emma', roles: ['business_user'], supportGroup: null };
const sam: AuthUser = { id: 'u-sam', username: 'sam', displayName: 'Sam', roles: ['service_desk'], supportGroup: 'service_desk' };

async function makeResolved(repos: ReturnType<typeof createMemoryRepositories>) {
  const c = await createIncident(repos, { title: 'Maint test ' + Math.random(), description: 'app error' }, undefined, emma);
  await triageIncident(repos, c.id, { classification: 'application', impact: 'low', urgency: 'low', priority: 'P4' }, sam);
  await assignIncident(repos, c.id, { supportGroup: 'application_support' }, sam);
  await changeStatus(repos, c.id, 'in_progress', sam);
  await resolveIncident(repos, c.id, { resolutionCode: 'fixed', resolutionNote: 'done' }, sam);
  return c.id;
}

describe('maintenance', () => {
  it('auto-closes resolved incidents past the grace window', async () => {
    const repos = createMemoryRepositories();
    const id = await makeResolved(repos);
    // Force resolvedAt far in the past
    const inc = await repos.findIncidentById(id);
    inc!.resolvedAt = new Date(Date.now() - 1000 * 3600 * 24 * 10).toISOString();
    await repos.updateIncident(inc!);

    const result = await runMaintenance(repos, new Date());
    expect(result.autoClosed).toBeGreaterThanOrEqual(1);
    const after = await repos.findIncidentById(id);
    expect(after!.status).toBe('closed');
  });

  it('sends CSAT reminders up to reminderMax and no further', async () => {
    const repos = createMemoryRepositories();
    const id = await makeResolved(repos);

    let totalReminders = 0;
    // Run several times with zero interval; each run advances reminderCount by 1 until max (3).
    for (let i = 0; i < 5; i++) {
      const r = await runMaintenance(repos, new Date(), 0);
      totalReminders += r.remindersSent;
    }
    const csat = await repos.findCsatByIncident(id);
    expect(csat!.reminderCount).toBeLessThanOrEqual(3);
    expect(csat!.reminderCount).toBe(3);
  });

  it('stops reminders once CSAT is submitted', async () => {
    const repos = createMemoryRepositories();
    const id = await makeResolved(repos);
    const csat = await repos.findCsatByIncident(id);
    csat!.submittedAt = new Date().toISOString();
    csat!.rating = 5;
    await repos.updateCsat(csat!);

    await runMaintenance(repos, new Date(), 0);
    // This specific (already rated) incident must not receive a reminder.
    const after = await repos.findCsatByIncident(id);
    expect(after!.reminderCount).toBe(0);
  });
});
