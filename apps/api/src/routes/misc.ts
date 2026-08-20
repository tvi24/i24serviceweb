import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { authenticate } from '../middleware/authenticate';
import { authorize, requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { getRepositories } from '../repositories';
import { acknowledgeAlert, listAlertsForUser } from '../services/alertService';
import { getSlaConfig, updateSlaConfig } from '../services/configService';
import { getKpiSummary } from '../services/kpiService';
import {
  createBusinessCalendar,
  createSlaPolicy,
  listSlaEngine,
  updateBusinessCalendar as updateBusinessCalendarService,
  updateSlaPolicy as updateSlaPolicyService,
} from '../services/slaPolicyService';
import { asyncHandler } from './asyncHandler';

const repos = () => getRepositories();

// ---- Alerts ----
export const alertsRouter = Router();
alertsRouter.get('/', authenticate, asyncHandler(async (req, res) => {
  res.json(await listAlertsForUser(repos(), req.user!));
}));
alertsRouter.post('/:id/ack', authenticate, asyncHandler(async (req, res) => {
  res.json(await acknowledgeAlert(repos(), String(req.params.id), req.user!));
}));

// ---- KPI ----
export const kpiRouter = Router();
kpiRouter.get('/summary', authenticate, authorize('manager', 'management'), asyncHandler(async (req, res) => {
  const allowed = ['7d', '30d', 'qtd', 'ytd', 'all'] as const;
  const range = (allowed as readonly string[]).includes(String(req.query.range)) ? (req.query.range as (typeof allowed)[number]) : 'all';
  res.json(await getKpiSummary(repos(), range));
}));

// ---- Config ----
export const configRouter = Router();
const targetSchema = z.object({ responseMin: z.number().int().positive(), resolutionMin: z.number().int().positive().optional(), resolutionBd: z.number().int().positive().optional() });
const slaConfigSchema = z.object({
  targets: z.object({ P1: targetSchema, P2: targetSchema, P3: targetSchema, P4: targetSchema }),
  atRiskPct: z.number().int().min(1).max(99),
  priorityMatrix: z.record(z.string(), z.enum(['P1', 'P2', 'P3', 'P4'])),
  routingRules: z.record(z.string(), z.enum(['service_desk', 'application_support', 'infrastructure_support'])),
  closureGraceHours: z.number().int().nonnegative(),
  reminderMax: z.number().int().min(0).max(10),
  updatedAt: z.string().optional(),
  updatedBy: z.string().nullable().optional(),
});
configRouter.get('/sla', authenticate, authorize('manager', 'service_desk', 'platform_admin'), asyncHandler(async (_req, res) => {
  res.json(await getSlaConfig(repos()));
}));
configRouter.put('/sla', authenticate, authorize('manager', 'platform_admin'), validate(slaConfigSchema), asyncHandler(async (req, res) => {
  res.json(await updateSlaConfig(repos(), req.body, req.user!));
}));

// ---- SLA policy engine + business calendars (v3.0) ----
const priorityEnum = z.enum(['P1', 'P2', 'P3', 'P4']);
const policyBodySchema = z.object({
  name: z.string().min(1).max(120),
  buId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  priority: priorityEnum.nullable().optional(),
  requestType: z.enum(['incident', 'service_request']).nullable().optional(),
  responseTargetMin: z.number().int().positive(),
  resolutionMin: z.number().int().positive().nullable().optional(),
  resolutionBd: z.number().int().positive().nullable().optional(),
  calendarId: z.string().nullable().optional(),
  warningPct: z.number().int().min(1).max(99).optional(),
  effectiveFrom: z.string().nullable().optional(),
  effectiveTo: z.string().nullable().optional(),
  active: z.boolean().optional(),
});
const calendarBodySchema = z.object({
  name: z.string().min(1).max(120),
  timeZone: z.string().min(1).max(60),
  mode: z.enum(['business_hours', '24x7']).optional(),
  workDays: z.array(z.number().int().min(0).max(6)).optional(),
  workStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  holidays: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

configRouter.get('/sla-engine', authenticate, authorize('manager', 'platform_admin'), asyncHandler(async (_req, res) => {
  res.json(await listSlaEngine(repos()));
}));
configRouter.post('/sla-policies', authenticate, requirePermission('sla.manage'), validate(policyBodySchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createSlaPolicy(repos(), req.body, req.user!));
}));
configRouter.patch('/sla-policies/:id', authenticate, requirePermission('sla.manage'), validate(policyBodySchema.partial()), asyncHandler(async (req, res) => {
  res.json(await updateSlaPolicyService(repos(), String(req.params.id), req.body, req.user!));
}));
configRouter.post('/business-calendars', authenticate, requirePermission('sla.manage'), validate(calendarBodySchema), asyncHandler(async (req, res) => {
  res.status(201).json(await createBusinessCalendar(repos(), req.body, req.user!));
}));
configRouter.patch('/business-calendars/:id', authenticate, requirePermission('sla.manage'), validate(calendarBodySchema.partial()), asyncHandler(async (req, res) => {
  res.json(await updateBusinessCalendarService(repos(), String(req.params.id), req.body, req.user!));
}));

// ---- Users ----
export const usersRouter = Router();
usersRouter.get('/', authenticate, authorize('service_desk', 'manager', 'application_support', 'infrastructure_support', 'platform_admin', 'management'), asyncHandler(async (_req, res) => {
  res.json(await repos().listUsers());
}));

// ---- Health ----
export const healthRouter = Router();
healthRouter.get('/', asyncHandler(async (_req, res) => {
  const checks: Record<string, string> = {};
  if (config.DATA_BACKEND === 'pg') {
    try {
      const { pingDb } = await import('../db/pool');
      await pingDb();
      checks.db = 'ok';
    } catch {
      checks.db = 'down';
    }
  } else {
    checks.db = 'memory';
  }
  const ok = checks.db !== 'down';
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', uptime: process.uptime(), checks });
}));
