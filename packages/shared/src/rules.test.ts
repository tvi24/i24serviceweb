import { describe, expect, it } from 'vitest';
import { DEFAULT_SLA_CONFIG, STATUS_TRANSITIONS } from './constants.js';
import { classifyByKeywords, computeSlaTargets, priorityFromMatrix, routeSupportGroup } from './logic.js';
import type { ImpactUrgency } from './types.js';

describe('priority matrix — all 9 impact/urgency combinations', () => {
  const cases: Array<[ImpactUrgency, ImpactUrgency, string]> = [
    ['high', 'high', 'P1'],
    ['high', 'medium', 'P2'],
    ['high', 'low', 'P3'],
    ['medium', 'high', 'P2'],
    ['medium', 'medium', 'P3'],
    ['medium', 'low', 'P4'],
    ['low', 'high', 'P3'],
    ['low', 'medium', 'P4'],
    ['low', 'low', 'P4'],
  ];
  for (const [impact, urgency, expected] of cases) {
    it(`${impact}/${urgency} -> ${expected}`, () => {
      expect(priorityFromMatrix(impact, urgency)).toBe(expected);
    });
  }
});

describe('support group routing + fallback', () => {
  it('routes known classifications', () => {
    expect(routeSupportGroup('application')).toBe('application_support');
    expect(routeSupportGroup('infrastructure')).toBe('infrastructure_support');
    expect(routeSupportGroup('network')).toBe('infrastructure_support');
    expect(routeSupportGroup('access')).toBe('service_desk');
  });
  it('returns null for unknown classification (triggers fallback)', () => {
    expect(routeSupportGroup('totally-unknown')).toBeNull();
  });
});

describe('keyword classification', () => {
  it('classifies by keyword and defaults to other', () => {
    expect(classifyByKeywords('VPN keeps dropping')).toBe('network');
    expect(classifyByKeywords('cannot reset my password')).toBe('access');
    expect(classifyByKeywords('the server disk is full')).toBe('infrastructure');
    expect(classifyByKeywords('random unrelated text')).toBe('other');
  });
});

describe('SLA targets by priority', () => {
  const start = new Date('2026-08-17T00:00:00.000Z'); // Monday
  it('P2 = 30m response / 8h resolution', () => {
    const t = computeSlaTargets('P2', start);
    expect(t.responseTargetAt.toISOString()).toBe('2026-08-17T00:30:00.000Z');
    expect(t.resolutionTargetAt.toISOString()).toBe('2026-08-17T08:00:00.000Z');
  });
  it('P3 = 4h response / 3 business days resolution', () => {
    const t = computeSlaTargets('P3', start);
    expect(t.responseTargetAt.toISOString()).toBe('2026-08-17T04:00:00.000Z');
    // Mon + 3 business days -> Thursday 20th
    expect(t.resolutionTargetAt.getUTCDate()).toBe(20);
  });
  it('P4 = 8h response / 5 business days resolution', () => {
    const t = computeSlaTargets('P4', start);
    // Mon + 5 business days -> next Monday 24th
    expect(t.resolutionTargetAt.getUTCDate()).toBe(24);
  });
});

describe('status transition map', () => {
  it('allows new -> triaged, forbids new -> closed', () => {
    expect(STATUS_TRANSITIONS.new).toContain('triaged');
    expect(STATUS_TRANSITIONS.new).not.toContain('closed');
  });
  it('resolved can go to closed or reopened only', () => {
    expect(STATUS_TRANSITIONS.resolved.sort()).toEqual(['closed', 'reopened']);
  });
  it('closed is terminal', () => {
    expect(STATUS_TRANSITIONS.closed).toEqual([]);
  });
});

describe('default SLA config matches assessment BR-03', () => {
  it('has the documented P1-P4 targets', () => {
    expect(DEFAULT_SLA_CONFIG.targets.P1).toEqual({ responseMin: 15, resolutionMin: 240 });
    expect(DEFAULT_SLA_CONFIG.targets.P2).toEqual({ responseMin: 30, resolutionMin: 480 });
    expect(DEFAULT_SLA_CONFIG.targets.P3).toEqual({ responseMin: 240, resolutionBd: 3 });
    expect(DEFAULT_SLA_CONFIG.targets.P4).toEqual({ responseMin: 480, resolutionBd: 5 });
  });
});
