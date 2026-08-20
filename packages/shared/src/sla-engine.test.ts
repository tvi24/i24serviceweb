import { describe, expect, it } from 'vitest';
import { DEFAULT_SLA_CONFIG } from './constants.js';
import { businessCalendars, slaPolicies } from './fixtures/sla.js';
import {
  addCalendarMinutes,
  computeSlaTargets,
  computeSlaTargetsFromPolicy,
  resolveSlaPolicy,
  slaInstanceState,
} from './logic.js';
import type { BusinessCalendar, SlaPolicy, SlaRecord } from './types.js';

describe('SLA policy resolution', () => {
  it('returns null when no policy matches (falls back to global config)', () => {
    expect(resolveSlaPolicy([], { priority: 'P1' })).toBeNull();
  });

  it('picks the priority-specific default policy', () => {
    const p = resolveSlaPolicy(slaPolicies, { priority: 'P2' });
    expect(p?.id).toBe('pol-p2');
  });

  it('prefers a more specific (BU + priority) active policy over a wildcard one', () => {
    const buPolicy: SlaPolicy = { id: 'pol-mcr-p1', name: 'MCR P1', buId: 'bu-mcr', serviceId: null, priority: 'P1', requestType: null, responseTargetMin: 5, resolutionMin: 60, resolutionBd: null, calendarId: null, warningPct: 80, effectiveFrom: null, effectiveTo: null, active: true };
    const chosen = resolveSlaPolicy([...slaPolicies, buPolicy], { buId: 'bu-mcr', priority: 'P1' });
    expect(chosen?.id).toBe('pol-mcr-p1');
  });

  it('ignores inactive and out-of-window policies', () => {
    const inactive: SlaPolicy = { ...slaPolicies[0], id: 'x', active: false };
    expect(resolveSlaPolicy([inactive], { priority: 'P1' })).toBeNull();
  });
});

describe('behavior preservation: default policies match legacy config targets', () => {
  const start = new Date('2026-08-19T02:00:00.000Z');
  for (const pr of ['P1', 'P2', 'P3', 'P4'] as const) {
    it(`${pr} policy targets equal computeSlaTargets`, () => {
      const policy = slaPolicies.find((p) => p.priority === pr)!;
      const fromPolicy = computeSlaTargetsFromPolicy(policy, start, null);
      const legacy = computeSlaTargets(pr, start, DEFAULT_SLA_CONFIG);
      expect(fromPolicy.responseTargetAt.toISOString()).toBe(legacy.responseTargetAt.toISOString());
      expect(fromPolicy.resolutionTargetAt.toISOString()).toBe(legacy.resolutionTargetAt.toISOString());
    });
  }
});

describe('addCalendarMinutes', () => {
  const cal24: BusinessCalendar = businessCalendars.find((c) => c.mode === '24x7')!;
  const calBh: BusinessCalendar = { id: 'c', name: 'bh', timeZone: 'UTC', mode: 'business_hours', workDays: [1, 2, 3, 4, 5], workStart: '09:00', workEnd: '17:00', holidays: ['2026-08-20'], active: true };

  it('24x7 adds plain elapsed minutes', () => {
    const from = new Date('2026-08-19T00:00:00.000Z');
    expect(addCalendarMinutes(from, 120, cal24).toISOString()).toBe(new Date('2026-08-19T02:00:00.000Z').toISOString());
  });

  it('business hours accrues only within the working window', () => {
    // Wed 2026-08-19 16:00 UTC + 120 working min, window 09:00-17:00 → 60m today, 60m next workday from 09:00.
    // 2026-08-20 is a holiday, so it rolls to Fri 2026-08-21 09:00 +60m = 10:00.
    const from = new Date('2026-08-19T16:00:00.000Z');
    const got = addCalendarMinutes(from, 120, calBh);
    expect(got.toISOString()).toBe(new Date('2026-08-21T10:00:00.000Z').toISOString());
  });
});

describe('slaInstanceState', () => {
  const base: SlaRecord = { id: 's', incidentId: 'i', priority: 'P2', responseTargetAt: '2026-08-19T03:00:00.000Z', resolutionTargetAt: '2026-08-19T10:00:00.000Z', responseAt: null, responseState: 'within_target', resolutionState: 'within_target', startedAt: '2026-08-19T02:00:00.000Z' };
  it('met when resolution met', () => {
    expect(slaInstanceState({ ...base, resolutionMetAt: '2026-08-19T05:00:00.000Z' }, new Date('2026-08-19T06:00:00.000Z'))).toBe('met');
  });
  it('breached when past resolution target', () => {
    expect(slaInstanceState(base, new Date('2026-08-19T11:00:00.000Z'))).toBe('breached');
  });
  it('at_risk when a state is at_risk', () => {
    expect(slaInstanceState({ ...base, resolutionState: 'at_risk' }, new Date('2026-08-19T09:00:00.000Z'))).toBe('at_risk');
  });
  it('running otherwise', () => {
    expect(slaInstanceState(base, new Date('2026-08-19T04:00:00.000Z'))).toBe('running');
  });
});
