import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { authorize, requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { getRepositories } from '../repositories';
import { ingestInbound, listEmailAccounts, sendTestEmail, testConnection } from '../services/emailService';
import { asyncHandler } from './asyncHandler';

const repos = () => getRepositories();

export const emailRouter = Router();

// Simulate an inbound email (no live mailbox poller in the workshop). Restricted to
// staff who can operate the mailbox. In production this is driven by an adapter webhook.
emailRouter.post(
  '/inbound',
  authenticate,
  authorize('service_desk', 'manager', 'platform_admin'),
  validate(z.object({ from: z.string().min(3).max(200), subject: z.string().max(300).default(''), body: z.string().max(10000).default('') })),
  asyncHandler(async (req, res) => {
    res.status(201).json(await ingestInbound(repos(), req.body, req.user!));
  })
);

// Email account console (platform admin config).
emailRouter.get(
  '/accounts',
  authenticate,
  authorize('platform_admin', 'manager'),
  asyncHandler(async (_req, res) => {
    res.json(await listEmailAccounts(repos()));
  })
);
emailRouter.post(
  '/accounts/:id/test',
  authenticate,
  requirePermission('email.manage'),
  asyncHandler(async (req, res) => {
    res.json(await testConnection(repos(), String(req.params.id), req.user!));
  })
);
emailRouter.post(
  '/accounts/:id/send-test',
  authenticate,
  requirePermission('email.manage'),
  validate(z.object({ to: z.string().min(3).max(200) })),
  asyncHandler(async (req, res) => {
    res.json(await sendTestEmail(repos(), String(req.params.id), req.body.to, req.user!));
  })
);
