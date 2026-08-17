import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { getRepositories } from '../repositories';
import { acknowledgeAlert, listAlertsForUser } from '../services/alertService';
import { getSlaConfig, updateSlaConfig } from '../services/configService';
import { getKpiSummary } from '../services/kpiService';
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
kpiRouter.get('/summary', authenticate, authorize('manager', 'management'), asyncHandler(async (_req, res) => {
  res.json(await getKpiSummary(repos()));
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
configRouter.get('/sla', authenticate, authorize('manager', 'service_desk'), asyncHandler(async (_req, res) => {
  res.json(await getSlaConfig(repos()));
}));
configRouter.put('/sla', authenticate, authorize('manager'), validate(slaConfigSchema), asyncHandler(async (req, res) => {
  res.json(await updateSlaConfig(repos(), req.body, req.user!));
}));

// ---- Users ----
export const usersRouter = Router();
usersRouter.get('/', authenticate, authorize('service_desk', 'manager', 'application_support', 'infrastructure_support'), asyncHandler(async (_req, res) => {
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
