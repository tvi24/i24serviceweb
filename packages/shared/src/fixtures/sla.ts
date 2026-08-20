import type { BusinessCalendar, SlaPolicy } from '../types.js';

// Two synthetic business calendars. The default policies below attach NO calendar so their
// clocks are pure elapsed time — exactly preserving the pre-v3.0 SLA behavior. The Thai
// business-hours calendar is available for admins to attach to BU/service-specific policies.
export const businessCalendars: BusinessCalendar[] = [
  {
    id: 'cal-24x7',
    name: '24x7',
    timeZone: 'Asia/Bangkok',
    mode: '24x7',
    workDays: [0, 1, 2, 3, 4, 5, 6],
    workStart: '00:00',
    workEnd: '23:59',
    holidays: [],
    active: true,
  },
  {
    id: 'cal-th-bh',
    name: 'Thailand Business Hours',
    timeZone: 'Asia/Bangkok',
    mode: 'business_hours',
    workDays: [1, 2, 3, 4, 5],
    workStart: '09:00',
    workEnd: '18:00',
    holidays: ['2026-01-01', '2026-04-13', '2026-04-14', '2026-04-15', '2026-12-05', '2026-12-31'],
    active: true,
  },
];

// Default per-priority SLA policies (wildcard BU/Service). Targets mirror DEFAULT_SLA_CONFIG,
// with no calendar so computed targets equal the legacy behavior. Admins can add more specific
// policies (by BU/Service/RequestType) that win via resolution precedence.
export const slaPolicies: SlaPolicy[] = [
  { id: 'pol-p1', name: 'Default P1', buId: null, serviceId: null, priority: 'P1', requestType: null, responseTargetMin: 15, resolutionMin: 240, resolutionBd: null, calendarId: null, warningPct: 80, effectiveFrom: null, effectiveTo: null, active: true },
  { id: 'pol-p2', name: 'Default P2', buId: null, serviceId: null, priority: 'P2', requestType: null, responseTargetMin: 30, resolutionMin: 480, resolutionBd: null, calendarId: null, warningPct: 80, effectiveFrom: null, effectiveTo: null, active: true },
  { id: 'pol-p3', name: 'Default P3', buId: null, serviceId: null, priority: 'P3', requestType: null, responseTargetMin: 240, resolutionMin: null, resolutionBd: 3, calendarId: null, warningPct: 80, effectiveFrom: null, effectiveTo: null, active: true },
  { id: 'pol-p4', name: 'Default P4', buId: null, serviceId: null, priority: 'P4', requestType: null, responseTargetMin: 480, resolutionMin: null, resolutionBd: 5, calendarId: null, warningPct: 80, effectiveFrom: null, effectiveTo: null, active: true },
];
