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
