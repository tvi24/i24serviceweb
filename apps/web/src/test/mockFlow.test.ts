import { describe, expect, it } from 'vitest';
import * as mock from '../api/mockBackend';

// Exercises the full mock backend lifecycle used by the Phase 1 UI.
describe('mock backend lifecycle', () => {
  const desk = mock.login('sam', 'Passw0rd!').user;
  const emma = mock.login('emma', 'Passw0rd!').user;

  it('rejects invalid credentials generically', () => {
    expect(() => mock.login('emma', 'wrong')).toThrow(/Invalid username or password/);
  });

  it('creates a ticket and enforces required fields', () => {
    expect(() => mock.createIncident({ title: '', description: '' }, undefined, emma)).toThrow();
    const res = mock.createIncident({ title: 'App crash on save', description: 'Application error when clicking save, production down' }, 'idem-1', emma);
    expect(res.ticketId).toMatch(/^INC-2026-/);
    // idempotency returns same ticket
    const again = mock.createIncident({ title: 'App crash on save', description: 'dup' }, 'idem-1', emma);
    expect(again.ticketId).toBe(res.ticketId);
  });

  it('runs triage -> assign -> note -> resolve -> confirm with audit', () => {
    const created = mock.createIncident({ title: 'VPN down for everyone', description: 'network outage critical' }, undefined, emma);
    const id = created.id;

    const suggestion = mock.getSuggestions(id);
    expect(['network', 'infrastructure', 'application', 'access', 'email', 'other']).toContain(suggestion.classification);

    mock.triage(id, { classification: 'network', impact: 'high', urgency: 'high', priority: 'P1' }, desk);
    const assigned = mock.assign(id, {}, desk); // auto-route by classification
    expect(assigned.supportGroup).toBe('infrastructure_support');
    expect(assigned.sla).toBeTruthy(); // SLA tracking started

    const ivan = mock.login('ivan', 'Passw0rd!').user;
    mock.changeStatus(id, 'in_progress', ivan);
    mock.addNote(id, 'Rebooting VPN concentrator', ivan);
    const resolved = mock.resolve(id, { resolutionCode: 'fixed', resolutionNote: 'Restarted service' }, ivan);
    expect(resolved.status).toBe('resolved');

    const confirmed = mock.confirm(id, emma);
    expect(confirmed.status).toBe('closed');

    const audit = mock.getAudit(id);
    const actions = audit.map((a) => a.action);
    expect(actions).toContain('incident.created');
    expect(actions).toContain('incident.resolved');
    expect(actions).toContain('incident.closed');
  });

  it('rejects illegal status transition and out-of-range CSAT', () => {
    const c = mock.createIncident({ title: 'Printer issue', description: 'printer jam' }, undefined, emma);
    expect(() => mock.changeStatus(c.id, 'closed', desk)).toThrow(); // new -> closed illegal

    mock.triage(c.id, { classification: 'other', impact: 'low', urgency: 'low', priority: 'P4' }, desk);
    mock.assign(c.id, { supportGroup: 'service_desk' }, desk);
    mock.changeStatus(c.id, 'in_progress', desk);
    mock.resolve(c.id, { resolutionCode: 'fixed', resolutionNote: 'done' }, desk);
    expect(() => mock.submitCsat(c.id, { rating: 9 }, emma)).toThrow(/1 to 5/);
    const ok = mock.submitCsat(c.id, { rating: 4 }, emma);
    expect(ok.csat?.rating).toBe(4);
  });

  it('reopen requires a reason and returns to active workflow', () => {
    const c = mock.createIncident({ title: 'Email delayed', description: 'email slow' }, undefined, emma);
    mock.triage(c.id, { classification: 'email', impact: 'medium', urgency: 'medium', priority: 'P3' }, desk);
    mock.assign(c.id, {}, desk);
    mock.changeStatus(c.id, 'in_progress', desk);
    mock.resolve(c.id, { resolutionCode: 'fixed', resolutionNote: 'cleared queue' }, desk);
    expect(() => mock.reopen(c.id, '', emma)).toThrow(/reason/i);
    const re = mock.reopen(c.id, 'Still slow', emma);
    expect(re.status).toBe('reopened');
  });

  it('produces KPI data', () => {
    const kpi = mock.getKpi();
    expect(kpi.hasData).toBe(true);
    expect(typeof kpi.slaCompliancePct).toBe('number');
  });
});
