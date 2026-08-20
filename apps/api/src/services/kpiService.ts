import type { Incident, KpiDimensionRow, KpiSummary, SlaRecord } from '@incident/shared';
import type { Repositories } from '../repositories/types';

type SlaByIncident = Map<string, SlaRecord>;

function worstState(sla?: SlaRecord | null): 'breached' | 'at_risk' | 'within' | 'none' {
  if (!sla) return 'none';
  if (sla.responseState === 'breached' || sla.resolutionState === 'breached') return 'breached';
  if (sla.responseState === 'at_risk' || sla.resolutionState === 'at_risk') return 'at_risk';
  return 'within';
}

function isOpen(i: Incident): boolean {
  return i.status !== 'closed' && i.status !== 'resolved';
}

// Aggregate incidents into a dimension breakdown, keeping an explicit "unset" bucket so
// untriaged / unmapped records are never silently dropped from totals (R26).
function dimension(
  incidents: Incident[],
  slaBy: SlaByIncident,
  keyOf: (i: Incident) => string | null,
  labelOf: (key: string) => string
): KpiDimensionRow[] {
  const map = new Map<string, KpiDimensionRow>();
  for (const i of incidents) {
    const key = keyOf(i) ?? 'unset';
    const row = map.get(key) ?? { key, label: labelOf(key), total: 0, open: 0, breached: 0, atRisk: 0 };
    row.total += 1;
    if (isOpen(i)) row.open += 1;
    const w = worstState(slaBy.get(i.id));
    if (w === 'breached') row.breached += 1;
    else if (w === 'at_risk') row.atRisk += 1;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export type KpiRange = '7d' | '30d' | 'qtd' | 'ytd' | 'all';

function rangeCutoff(range: KpiRange, now = new Date()): number {
  const d = new Date(now);
  switch (range) {
    case '7d': return now.getTime() - 7 * 86400000;
    case '30d': return now.getTime() - 30 * 86400000;
    case 'qtd': { const q = Math.floor(d.getUTCMonth() / 3) * 3; return Date.UTC(d.getUTCFullYear(), q, 1); }
    case 'ytd': return Date.UTC(d.getUTCFullYear(), 0, 1);
    default: return 0;
  }
}

export async function getKpiSummary(repos: Repositories, range: KpiRange = 'all'): Promise<KpiSummary> {
  const allIncidents = await repos.listIncidents({});
  const cutoff = rangeCutoff(range);
  const incidents = cutoff === 0 ? allIncidents : allIncidents.filter((i) => new Date(i.createdAt).getTime() >= cutoff);
  const incidentIds = new Set(incidents.map((i) => i.id));
  const slas = (await repos.listSlaRecords()).filter((s) => incidentIds.has(s.incidentId));
  const csats = (await repos.listCsats()).filter((c) => incidentIds.has(c.incidentId));
  const users = await repos.listUsers();
  const businessUnits = await repos.listBusinessUnits();
  const services = await repos.listServices();

  const slaBy: SlaByIncident = new Map(slas.map((s) => [s.incidentId, s]));
  const buCode = new Map(businessUnits.map((b) => [b.id, b.code]));
  const svcName = new Map(services.map((s) => [s.id, s.name]));
  const userBu = new Map(users.map((u) => [u.id, u.buId ?? null]));

  const countsByStatus: Record<string, number> = {};
  const countsByPriority: Record<string, number> = {};
  for (const i of incidents) {
    countsByStatus[i.status] = (countsByStatus[i.status] ?? 0) + 1;
    if (i.priority) countsByPriority[i.priority] = (countsByPriority[i.priority] ?? 0) + 1;
  }

  // SLA compliance: denominator = tracked SLA instances; numerator = not breached.
  const slaEligible = slas.length;
  const breachedCount = slas.filter((s) => worstState(s) === 'breached').length;
  const atRiskCount = slas.filter((s) => worstState(s) === 'at_risk').length;
  const slaMet = slaEligible - breachedCount;
  const compliance = slaEligible === 0 ? 100 : Math.round((slaMet / slaEligible) * 100);

  const now = Date.now();
  const agingBuckets: Record<string, number> = { '<1d': 0, '1-3d': 0, '>3d': 0 };
  for (const i of incidents.filter(isOpen)) {
    const ageDays = (now - new Date(i.createdAt).getTime()) / 86400000;
    if (ageDays < 1) agingBuckets['<1d'] += 1;
    else if (ageDays <= 3) agingBuckets['1-3d'] += 1;
    else agingBuckets['>3d'] += 1;
  }

  // MTTA = mean(responseAt - startedAt); MTTR = mean(resolvedAt - createdAt).
  const mttaVals: number[] = [];
  for (const s of slas) {
    if (s.responseAt) mttaVals.push((new Date(s.responseAt).getTime() - new Date(s.startedAt).getTime()) / 60000);
  }
  const mttrVals: number[] = [];
  for (const i of incidents) {
    if (i.resolvedAt) mttrVals.push((new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime()) / 60000);
  }
  const mean = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

  let reopenCount = 0;
  for (const i of incidents) {
    const acts = await repos.listActivitiesByIncident(i.id);
    reopenCount += acts.filter((a) => a.type === 'reopen').length;
  }
  const resolvedOrClosed = incidents.filter((i) => i.status === 'resolved' || i.status === 'closed' || i.resolvedAt).length;
  const reopenRate = resolvedOrClosed === 0 ? null : Math.round((reopenCount / resolvedOrClosed) * 100);

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

  const byBu = dimension(incidents, slaBy, (i) => i.requesterBuId ?? userBu.get(i.reporterId) ?? null, (k) => (k === 'unset' ? 'Unset' : buCode.get(k) ?? k));
  const byService = dimension(incidents, slaBy, (i) => i.serviceId ?? null, (k) => (k === 'unset' ? 'Unset' : svcName.get(k) ?? k));
  const bySupportGroup = dimension(incidents, slaBy, (i) => i.supportGroup ?? null, (k) => k);

  const untriagedCount = incidents.filter((i) => i.status === 'new' || i.status === 'triaged' || !i.priority).length;

  return {
    countsByStatus,
    countsByPriority,
    slaCompliancePct: compliance,
    slaBreachCount: breachedCount,
    agingBuckets,
    reopenCount,
    avgCsat,
    recurring,
    trend,
    hasData: incidents.length > 0,
    lastRefreshedAt: new Date().toISOString(),
    slaEligible,
    slaMet,
    atRiskCount,
    breachedCount,
    p1Count: countsByPriority['P1'] ?? 0,
    p2Count: countsByPriority['P2'] ?? 0,
    untriagedCount,
    mttaMinutes: mean(mttaVals),
    mttrMinutes: mean(mttrVals),
    reopenRate,
    csatCount: ratings.length,
    byBu,
    byService,
    bySupportGroup,
  };
}
