import { CATEGORIES, CLASSIFICATIONS, RESOLUTION_CODES, type IncidentFilters } from '@incident/shared';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { getRepositories } from '../repositories';
import { listIncidentAudit } from '../services/auditService';
import { agentReply, listIncidentEmails } from '../services/emailService';
import {
  addNote,
  assignIncident,
  changeStatus,
  closeIncident,
  confirmResolution,
  createIncident,
  getIncidentDetail,
  getMySlaSummary,
  getSuggestion,
  listIncidents,
  reopenIncident,
  resolveIncident,
  submitCsat,
  triageIncident,
} from '../services/incidentService';
import { asyncHandler } from './asyncHandler';

export const incidentsRouter = Router();
const repos = () => getRepositories();

const iu = z.enum(['high', 'medium', 'low']);
const supportRoles = ['service_desk', 'application_support', 'infrastructure_support', 'manager'] as const;

// Intake
incidentsRouter.post(
  '/',
  authenticate,
  authorize('business_user', 'service_desk'),
  validate(z.object({ title: z.string().min(1).max(200), description: z.string().min(1).max(5000), impact: iu.optional(), urgency: iu.optional(), channel: z.enum(['web_portal', 'mail', 'line', 'phone', 'monitoring']).optional(), serviceId: z.string().nullable().optional(), category: z.enum(CATEGORIES).nullable().optional(), subcategory: z.string().max(60).nullable().optional() })),
  asyncHandler(async (req, res) => {
    const key = (req.headers['idempotency-key'] as string) || undefined;
    const result = await createIncident(repos(), req.body, key, req.user!);
    res.status(201).json(result);
  })
);

// List (support/manager/management) with filters
incidentsRouter.get(
  '/',
  authenticate,
  authorize('service_desk', 'application_support', 'infrastructure_support', 'manager', 'management'),
  asyncHandler(async (req, res) => {
    const filters: IncidentFilters = {
      status: req.query.status as any,
      priority: req.query.priority as any,
      supportGroup: req.query.supportGroup as any,
      assignedOwnerId: req.query.assignedOwnerId as any,
      mine: req.query.mine === 'true',
    };
    res.json(await listIncidents(repos(), filters, req.user!));
  })
);

// Reporter's own SLA summary
incidentsRouter.get(
  '/my-sla',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await getMySlaSummary(repos(), req.user!));
  })
);

// Reporter's own
incidentsRouter.get(
  '/mine',
  authenticate,
  authorize('business_user', 'service_desk', 'application_support', 'infrastructure_support', 'manager'),
  asyncHandler(async (req, res) => {
    res.json(await listIncidents(repos(), { mine: true }, req.user!));
  })
);

incidentsRouter.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await getIncidentDetail(repos(), String(req.params.id), req.user!));
  })
);

incidentsRouter.get(
  '/:id/suggestions',
  authenticate,
  authorize('service_desk', 'manager'),
  asyncHandler(async (req, res) => {
    res.json(await getSuggestion(repos(), String(req.params.id)));
  })
);

incidentsRouter.patch(
  '/:id/triage',
  authenticate,
  authorize('service_desk', 'manager'),
  validate(z.object({ classification: z.enum(CLASSIFICATIONS), impact: iu, urgency: iu, priority: z.enum(['P1', 'P2', 'P3', 'P4']), overrideReason: z.string().max(500).optional(), serviceId: z.string().nullable().optional(), category: z.enum(CATEGORIES).nullable().optional(), subcategory: z.string().max(60).nullable().optional() })),
  asyncHandler(async (req, res) => {
    res.json(await triageIncident(repos(), String(req.params.id), req.body, req.user!));
  })
);

incidentsRouter.post(
  '/:id/assign',
  authenticate,
  authorize('service_desk', 'manager'),
  validate(z.object({ supportGroup: z.enum(['service_desk', 'application_support', 'infrastructure_support']).optional(), ownerId: z.string().nullable().optional() })),
  asyncHandler(async (req, res) => {
    res.json(await assignIncident(repos(), String(req.params.id), req.body, req.user!));
  })
);

incidentsRouter.post(
  '/:id/notes',
  authenticate,
  authorize(...supportRoles),
  validate(z.object({ note: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    res.json(await addNote(repos(), String(req.params.id), req.body.note, req.user!));
  })
);

incidentsRouter.patch(
  '/:id/status',
  authenticate,
  authorize(...supportRoles),
  validate(z.object({ status: z.enum(['new', 'triaged', 'assigned', 'in_progress', 'pending', 'resolved', 'reopened', 'closed', 'fallback']) })),
  asyncHandler(async (req, res) => {
    res.json(await changeStatus(repos(), String(req.params.id), req.body.status, req.user!));
  })
);

incidentsRouter.post(
  '/:id/resolve',
  authenticate,
  authorize(...supportRoles),
  validate(z.object({ resolutionCode: z.enum(RESOLUTION_CODES), resolutionNote: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    res.json(await resolveIncident(repos(), String(req.params.id), req.body, req.user!));
  })
);

incidentsRouter.post(
  '/:id/confirm',
  authenticate,
  authorize('business_user'),
  asyncHandler(async (req, res) => {
    res.json(await confirmResolution(repos(), String(req.params.id), req.user!));
  })
);

incidentsRouter.post(
  '/:id/csat',
  authenticate,
  authorize('business_user'),
  validate(z.object({ rating: z.number().int(), comment: z.string().optional() })),
  asyncHandler(async (req, res) => {
    res.json(await submitCsat(repos(), String(req.params.id), req.body, req.user!));
  })
);

incidentsRouter.post(
  '/:id/reopen',
  authenticate,
  authorize('business_user'),
  validate(z.object({ reason: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    res.json(await reopenIncident(repos(), String(req.params.id), req.body.reason, req.user!));
  })
);

incidentsRouter.post(
  '/:id/close',
  authenticate,
  authorize('service_desk', 'manager'),
  asyncHandler(async (req, res) => {
    res.json(await closeIncident(repos(), String(req.params.id), req.user!));
  })
);

incidentsRouter.get(
  '/:id/audit',
  authenticate,
  authorize('service_desk', 'manager'),
  asyncHandler(async (req, res) => {
    res.json(await listIncidentAudit(repos(), String(req.params.id)));
  })
);

// Email thread for an incident (support + reporter via detail scoping).
incidentsRouter.get(
  '/:id/emails',
  authenticate,
  asyncHandler(async (req, res) => {
    // reuse detail-scoping: ensure the actor can see the incident first
    await getIncidentDetail(repos(), String(req.params.id), req.user!);
    res.json(await listIncidentEmails(repos(), String(req.params.id)));
  })
);

// Agent reply (public email to requester) or internal note.
incidentsRouter.post(
  '/:id/reply',
  authenticate,
  authorize('service_desk', 'application_support', 'infrastructure_support', 'manager'),
  validate(z.object({ body: z.string().min(1).max(10000), visibility: z.enum(['public', 'internal']) })),
  asyncHandler(async (req, res) => {
    res.json(await agentReply(repos(), String(req.params.id), req.body, req.user!));
  })
);
