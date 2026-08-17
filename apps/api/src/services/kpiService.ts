import type { KpiSummary } from '@incident/shared';
import type { Repositories } from '../repositories/types';

export async function getKpiSummary(repos: Repositories): Promise<KpiSummary> {
  const incidents = await repos.listIncidents({});
  const slas = await repos.listSlaRecords();
  const csats = await repos.listCsats();

  const countsByStatus: Record<string, number> = {};
  const countsByPriority: Record<string, number> = {};
  for (const i of incidents) {
    countsByStatus[i.status] = (countsByStatus[i.status] ?? 0) + 1;
    if (i.priority) countsByPriority[i.priority] = (countsByPriority[i.priority] ?? 0) + 1;
  }

  const breach = slas.filter((s) => s.responseState === 'breached' || s.resolutionState === 'breached').length;
  const compliance = slas.length === 0 ? 100 : Math.round(((slas.length - breach) / slas.length) * 100);

  const now = Date.now();
  const agingBuckets: Record<string, number> = { '<1d': 0, '1-3d': 0, '>3d': 0 };
  for (const i of incidents.filter((x) => x.status !== 'closed')) {
    const ageDays = (now - new Date(i.createdAt).getTime()) / 86400000;
    if (ageDays < 1) agingBuckets['<1d'] += 1;
    else if (ageDays <= 3) agingBuckets['1-3d'] += 1;
    else agingBuckets['>3d'] += 1;
  }

  let reopenCount = 0;
  for (const i of incidents) {
    const acts = await repos.listActivitiesByIncident(i.id);
    reopenCount += acts.filter((a) => a.type === 'reopen').length;
  }

  const ratings = csats.filter((c) => typeof c.rating === 'number').map((c) => c.rating as number);
  const avgCsat = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

  const byClass: Record<string, number> = {};
  for (const i of incidents) {
    const c = i.classification ?? i.classificationSuggested ?? 'other';
    byClass[c] = (byClass[c] ?? 0) + 1;
  }
  const recurring = Object.entries(byClass).map(([classification, count]) => ({ classification, count })).sort((a, b) => b.count - a.count);

  const byDate: Record<string, number> = {};
  for (const i of incidents) {
    const d = i.createdAt.slice(0, 10);
    byDate[d] = (byDate[d] ?? 0) + 1;
  }
  const trend = Object.entries(byDate).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

  return {
    countsByStatus,
    countsByPriority,
    slaCompliancePct: compliance,
    slaBreachCount: breach,
    agingBuckets,
    reopenCount,
    avgCsat,
    recurring,
    trend,
    hasData: incidents.length > 0,
  };
}
