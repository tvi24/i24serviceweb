import { DEFAULT_SLA_CONFIG } from './constants.js';
import type {
  ImpactUrgency,
  Priority,
  SlaConfig,
  SlaState,
  SupportGroup,
} from './types.js';

// ---- Priority matrix ----
export function priorityFromMatrix(
  impact: ImpactUrgency,
  urgency: ImpactUrgency,
  config: SlaConfig = DEFAULT_SLA_CONFIG
): Priority {
  const key = `${impact}-${urgency}`;
  return config.priorityMatrix[key] ?? 'P4';
}

// ---- Keyword classification (deterministic rules/mock AI) ----
const KEYWORD_RULES: Array<{ classification: string; keywords: string[] }> = [
  { classification: 'network', keywords: ['network', 'vpn', 'wifi', 'internet', 'dns', 'firewall', 'เน็ต', 'เครือข่าย'] },
  { classification: 'infrastructure', keywords: ['server', 'disk', 'cpu', 'memory', 'database', 'storage', 'backup', 'เซิร์ฟเวอร์', 'ดิสก์'] },
  { classification: 'access', keywords: ['password', 'login', 'access', 'permission', 'account', 'locked', 'รหัสผ่าน', 'เข้าระบบ', 'สิทธิ์'] },
  { classification: 'email', keywords: ['email', 'mail', 'outlook', 'inbox', 'smtp', 'อีเมล'] },
  { classification: 'application', keywords: ['app', 'application', 'crash', 'error', 'bug', 'button', 'page', 'ระบบ', 'แอป', 'หน้าจอ'] },
];

export function classifyByKeywords(text: string): string {
  const lower = text.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return rule.classification;
    }
  }
  return 'other';
}

export function inferImpactUrgency(text: string): { impact: ImpactUrgency; urgency: ImpactUrgency } {
  const lower = text.toLowerCase();
  const highSignals = ['down', 'outage', 'critical', 'urgent', 'cannot', 'all users', 'production', 'ล่ม', 'ด่วน', 'ใช้งานไม่ได้'];
  const mediumSignals = ['slow', 'intermittent', 'some users', 'delay', 'ช้า', 'บางครั้ง'];
  if (highSignals.some((s) => lower.includes(s))) return { impact: 'high', urgency: 'high' };
  if (mediumSignals.some((s) => lower.includes(s))) return { impact: 'medium', urgency: 'medium' };
  return { impact: 'low', urgency: 'low' };
}

// ---- Support group routing ----
export function routeSupportGroup(
  classification: string,
  config: SlaConfig = DEFAULT_SLA_CONFIG
): SupportGroup | null {
  return config.routingRules[classification] ?? null;
}

// ---- Business-day math ----
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) remaining -= 1;
  }
  return d;
}

// ---- SLA target computation ----
export function computeSlaTargets(
  priority: Priority,
  startedAt: Date,
  config: SlaConfig = DEFAULT_SLA_CONFIG
): { responseTargetAt: Date; resolutionTargetAt: Date } {
  const target = config.targets[priority];
  const responseTargetAt = new Date(startedAt.getTime() + target.responseMin * 60_000);
  let resolutionTargetAt: Date;
  if (typeof target.resolutionMin === 'number') {
    resolutionTargetAt = new Date(startedAt.getTime() + target.resolutionMin * 60_000);
  } else if (typeof target.resolutionBd === 'number') {
    resolutionTargetAt = addBusinessDays(startedAt, target.resolutionBd);
  } else {
    resolutionTargetAt = new Date(startedAt.getTime() + 24 * 3600_000);
  }
  return { responseTargetAt, resolutionTargetAt };
}

// ---- v3.0 SLA policy engine ----
import type { BusinessCalendar, SlaInstanceState, SlaPolicy, SlaRecord } from './types.js';

// Resolve the most specific active SLA policy for a context. Conditions with a value
// must match; null conditions are wildcards. More specific matches win. Returns null
// so the caller can fall back to the global default SlaConfig (preserves prior behavior).
export function resolveSlaPolicy(
  policies: SlaPolicy[],
  ctx: { buId?: string | null; serviceId?: string | null; priority: Priority; requestType?: string | null },
  now: Date = new Date()
): SlaPolicy | null {
  const nowMs = now.getTime();
  const matches = policies.filter((p) => {
    if (!p.active) return false;
    if (p.effectiveFrom && new Date(p.effectiveFrom).getTime() > nowMs) return false;
    if (p.effectiveTo && new Date(p.effectiveTo).getTime() < nowMs) return false;
    if (p.buId && p.buId !== ctx.buId) return false;
    if (p.serviceId && p.serviceId !== ctx.serviceId) return false;
    if (p.priority && p.priority !== ctx.priority) return false;
    if (p.requestType && p.requestType !== (ctx.requestType ?? 'incident')) return false;
    return true;
  });
  if (matches.length === 0) return null;
  const score = (p: SlaPolicy) =>
    (p.buId ? 8 : 0) + (p.serviceId ? 4 : 0) + (p.priority ? 2 : 0) + (p.requestType ? 1 : 0);
  return matches.sort((a, b) => score(b) - score(a))[0];
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}
function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function isWorkday(d: Date, cal: BusinessCalendar): boolean {
  return cal.workDays.includes(d.getUTCDay()) && !cal.holidays.includes(dateKey(d));
}

// Advance a start time by a number of minutes, honoring a business calendar.
// business_hours: only working days (skipping holidays) and within [workStart, workEnd] count.
// Workshop simplification: workStart/workEnd are evaluated in UTC (documented in design/refinement-v3.md).
// 24x7: plain elapsed minutes.
export function addCalendarMinutes(from: Date, minutes: number, cal?: BusinessCalendar | null): Date {
  if (!cal || cal.mode === '24x7') return new Date(from.getTime() + minutes * 60_000);
  const startMin = parseHHMM(cal.workStart);
  const endMin = parseHHMM(cal.workEnd);
  const cur = new Date(from.getTime());
  let remaining = minutes;
  let guard = 0;
  const advanceToNextStart = () => {
    cur.setUTCDate(cur.getUTCDate() + 1);
    cur.setUTCHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
  };
  while (remaining > 0 && guard < 100000) {
    guard += 1;
    if (!isWorkday(cur, cal)) { advanceToNextStart(); continue; }
    const curMinOfDay = cur.getUTCHours() * 60 + cur.getUTCMinutes();
    if (curMinOfDay < startMin) { cur.setUTCHours(Math.floor(startMin / 60), startMin % 60, 0, 0); continue; }
    if (curMinOfDay >= endMin) { advanceToNextStart(); continue; }
    const availableToday = endMin - curMinOfDay;
    const step = Math.min(remaining, availableToday);
    cur.setTime(cur.getTime() + step * 60_000);
    remaining -= step;
    if (remaining > 0) advanceToNextStart();
  }
  return cur;
}

// Compute response/resolution targets from a policy + optional calendar.
export function computeSlaTargetsFromPolicy(
  policy: SlaPolicy,
  startedAt: Date,
  calendar?: BusinessCalendar | null
): { responseTargetAt: Date; resolutionTargetAt: Date } {
  const responseTargetAt = addCalendarMinutes(startedAt, policy.responseTargetMin, calendar);
  let resolutionTargetAt: Date;
  if (typeof policy.resolutionMin === 'number' && policy.resolutionMin != null) {
    resolutionTargetAt = addCalendarMinutes(startedAt, policy.resolutionMin, calendar);
  } else if (typeof policy.resolutionBd === 'number' && policy.resolutionBd != null) {
    resolutionTargetAt = addBusinessDays(startedAt, policy.resolutionBd);
  } else {
    resolutionTargetAt = new Date(startedAt.getTime() + 24 * 3600_000);
  }
  return { responseTargetAt, resolutionTargetAt };
}

// Derive the coarse 7-state SLA instance state from a record for display.
export function slaInstanceState(rec: SlaRecord, now: Date = new Date()): SlaInstanceState {
  if (rec.resolutionMetAt) return 'met';
  const resDue = new Date(rec.resolutionTargetAt).getTime();
  if (now.getTime() >= resDue) return 'breached';
  if (rec.resolutionState === 'at_risk' || rec.responseState === 'at_risk') return 'at_risk';
  return 'running';
}

// ---- SLA state evaluation ----
export function evaluateSlaState(
  startedAt: Date,
  targetAt: Date,
  now: Date,
  atRiskPct: number = DEFAULT_SLA_CONFIG.atRiskPct
): SlaState {
  if (now.getTime() >= targetAt.getTime()) return 'breached';
  const total = targetAt.getTime() - startedAt.getTime();
  if (total <= 0) return 'breached';
  const elapsedPct = ((now.getTime() - startedAt.getTime()) / total) * 100;
  if (elapsedPct >= atRiskPct) return 'at_risk';
  return 'within_target';
}
