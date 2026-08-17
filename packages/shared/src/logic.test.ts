import { describe, expect, it } from 'vitest';
import { addBusinessDays, computeSlaTargets, evaluateSlaState, priorityFromMatrix } from './logic.js';

describe('priorityFromMatrix', () => {
  it('maps high/high to P1 and low/low to P4', () => {
    expect(priorityFromMatrix('high', 'high')).toBe('P1');
    expect(priorityFromMatrix('low', 'low')).toBe('P4');
    expect(priorityFromMatrix('high', 'medium')).toBe('P2');
  });
});

describe('addBusinessDays', () => {
  it('skips weekends', () => {
    // 2026-08-14 is a Friday
    const friday = new Date('2026-08-14T09:00:00.000Z');
    const result = addBusinessDays(friday, 1); // -> Monday 2026-08-17
    expect(result.getUTCDate()).toBe(17);
  });
});

describe('computeSlaTargets', () => {
  it('computes P1 response 15m / resolution 4h', () => {
    const start = new Date('2026-08-17T00:00:00.000Z');
    const { responseTargetAt, resolutionTargetAt } = computeSlaTargets('P1', start);
    expect(responseTargetAt.toISOString()).toBe('2026-08-17T00:15:00.000Z');
    expect(resolutionTargetAt.toISOString()).toBe('2026-08-17T04:00:00.000Z');
  });
});

describe('evaluateSlaState', () => {
  const start = new Date('2026-08-17T00:00:00.000Z');
  const target = new Date('2026-08-17T01:00:00.000Z');
  it('within_target early', () => {
    expect(evaluateSlaState(start, target, new Date('2026-08-17T00:10:00.000Z'))).toBe('within_target');
  });
  it('at_risk past 80%', () => {
    expect(evaluateSlaState(start, target, new Date('2026-08-17T00:50:00.000Z'))).toBe('at_risk');
  });
  it('breached at/after target', () => {
    expect(evaluateSlaState(start, target, new Date('2026-08-17T01:05:00.000Z'))).toBe('breached');
  });
});
