import type { AuthUser, BusinessCalendar, SlaPolicy } from '@incident/shared';
import { Errors } from '../lib/errors';
import { uuid } from '../lib/ids';
import type { Repositories } from '../repositories/types';
import { writeAudit } from './auditService';

export async function listSlaEngine(repos: Repositories) {
  const [policies, calendars] = await Promise.all([repos.listSlaPolicies(), repos.listBusinessCalendars()]);
  return { policies, calendars };
}

function validatePolicy(p: Partial<SlaPolicy>) {
  const fields: Record<string, string> = {};
  if (!p.name?.trim()) fields.name = 'Name is required.';
  if (p.responseTargetMin == null || p.responseTargetMin <= 0) fields.responseTargetMin = 'Response target (min) must be positive.';
  if ((p.resolutionMin == null || p.resolutionMin <= 0) && (p.resolutionBd == null || p.resolutionBd <= 0)) {
    fields.resolution = 'Provide a resolution target in minutes or business days.';
  }
  if (Object.keys(fields).length) throw Errors.validation('Please complete the SLA policy.', fields);
}

export async function createSlaPolicy(repos: Repositories, body: Partial<SlaPolicy>, actor: AuthUser): Promise<SlaPolicy> {
  validatePolicy(body);
  const policy: SlaPolicy = {
    id: `pol-${uuid()}`,
    name: body.name!.trim(),
    buId: body.buId ?? null,
    serviceId: body.serviceId ?? null,
    priority: body.priority ?? null,
    requestType: body.requestType ?? null,
    responseTargetMin: body.responseTargetMin!,
    resolutionMin: body.resolutionMin ?? null,
    resolutionBd: body.resolutionBd ?? null,
    calendarId: body.calendarId ?? null,
    warningPct: body.warningPct ?? 80,
    effectiveFrom: body.effectiveFrom ?? null,
    effectiveTo: body.effectiveTo ?? null,
    active: body.active ?? true,
  };
  await repos.insertSlaPolicy(policy);
  await writeAudit(repos, { action: 'sla.policy.created', targetType: 'config', targetId: policy.id, actor, detail: { name: policy.name, priority: policy.priority, buId: policy.buId } });
  return policy;
}

export async function updateSlaPolicy(repos: Repositories, id: string, patch: Partial<SlaPolicy>, actor: AuthUser): Promise<SlaPolicy> {
  const existing = await repos.findSlaPolicyById(id);
  if (!existing) throw Errors.notFound('SLA policy not found.');
  const merged: SlaPolicy = { ...existing, ...patch, id: existing.id };
  validatePolicy(merged);
  await repos.updateSlaPolicy(merged);
  await writeAudit(repos, { action: 'sla.policy.updated', targetType: 'config', targetId: id, actor, detail: { name: merged.name, active: merged.active } });
  return merged;
}

function validateCalendar(c: Partial<BusinessCalendar>) {
  const fields: Record<string, string> = {};
  if (!c.name?.trim()) fields.name = 'Name is required.';
  if (!c.timeZone?.trim()) fields.timeZone = 'Time zone is required.';
  if (Object.keys(fields).length) throw Errors.validation('Please complete the calendar.', fields);
}

export async function createBusinessCalendar(repos: Repositories, body: Partial<BusinessCalendar>, actor: AuthUser): Promise<BusinessCalendar> {
  validateCalendar(body);
  const cal: BusinessCalendar = {
    id: `cal-${uuid()}`,
    name: body.name!.trim(),
    timeZone: body.timeZone!.trim(),
    mode: body.mode ?? '24x7',
    workDays: body.workDays ?? [1, 2, 3, 4, 5],
    workStart: body.workStart ?? '09:00',
    workEnd: body.workEnd ?? '18:00',
    holidays: body.holidays ?? [],
    active: body.active ?? true,
  };
  await repos.insertBusinessCalendar(cal);
  await writeAudit(repos, { action: 'sla.calendar.created', targetType: 'config', targetId: cal.id, actor, detail: { name: cal.name, mode: cal.mode } });
  return cal;
}

export async function updateBusinessCalendar(repos: Repositories, id: string, patch: Partial<BusinessCalendar>, actor: AuthUser): Promise<BusinessCalendar> {
  const existing = await repos.findBusinessCalendarById(id);
  if (!existing) throw Errors.notFound('Business calendar not found.');
  const merged: BusinessCalendar = { ...existing, ...patch, id: existing.id };
  validateCalendar(merged);
  await repos.updateBusinessCalendar(merged);
  await writeAudit(repos, { action: 'sla.calendar.updated', targetType: 'config', targetId: id, actor, detail: { name: merged.name, active: merged.active } });
  return merged;
}
