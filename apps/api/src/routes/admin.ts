import { ROLES } from '@incident/shared';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { authorize, requirePermission } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { getRepositories } from '../repositories';
import {
  addMyEmail,
  adminUpdateUser,
  createBusinessUnit,
  createDepartment,
  createLocation,
  createOrganization,
  createService,
  getMyProfile,
  getOrgOverview,
  listServices,
  updateService,
  updateBusinessUnit,
  updateDepartment,
  updateLocation,
  updateMyProfile,
  updateOrganization,
  verifyMyEmail,
} from '../services/orgService';
import { asyncHandler } from './asyncHandler';

const repos = () => getRepositories();

// ---- Platform Administration ----
export const adminRouter = Router();

// Organization master (view: manager or platform_admin; edit: org.manage permission)
adminRouter.get(
  '/org',
  authenticate,
  authorize('platform_admin', 'manager', 'management'),
  asyncHandler(async (_req, res) => {
    res.json(await getOrgOverview(repos()));
  })
);

adminRouter.post(
  '/org/organizations',
  authenticate,
  requirePermission('org.manage'),
  validate(z.object({ name: z.string().min(1).max(120), type: z.enum(['group', 'company']).optional(), parentId: z.string().nullable().optional() })),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createOrganization(repos(), req.body, req.user!));
  })
);

adminRouter.post(
  '/org/business-units',
  authenticate,
  requirePermission('org.manage'),
  validate(z.object({ orgId: z.string().min(1), code: z.string().min(1).max(20), name: z.string().min(1).max(120), managerId: z.string().nullable().optional() })),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createBusinessUnit(repos(), req.body, req.user!));
  })
);

adminRouter.post(
  '/org/departments',
  authenticate,
  requirePermission('org.manage'),
  validate(z.object({ buId: z.string().min(1), name: z.string().min(1).max(120) })),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createDepartment(repos(), req.body, req.user!));
  })
);

adminRouter.post(
  '/org/locations',
  authenticate,
  requirePermission('org.manage'),
  validate(z.object({ name: z.string().min(1).max(120), timeZone: z.string().min(1).max(60) })),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createLocation(repos(), req.body, req.user!));
  })
);

// ---- Organization edit / deactivate (all levels) ----
adminRouter.patch(
  '/org/organizations/:id',
  authenticate,
  requirePermission('org.manage'),
  validate(z.object({ name: z.string().min(1).max(120).optional(), type: z.enum(['group', 'company']).optional(), parentId: z.string().nullable().optional(), active: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    res.json(await updateOrganization(repos(), String(req.params.id), req.body, req.user!));
  })
);

adminRouter.patch(
  '/org/business-units/:id',
  authenticate,
  requirePermission('org.manage'),
  validate(z.object({ code: z.string().min(1).max(20).optional(), name: z.string().min(1).max(120).optional(), orgId: z.string().optional(), managerId: z.string().nullable().optional(), active: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    res.json(await updateBusinessUnit(repos(), String(req.params.id), req.body, req.user!));
  })
);

adminRouter.patch(
  '/org/departments/:id',
  authenticate,
  requirePermission('org.manage'),
  validate(z.object({ name: z.string().min(1).max(120).optional(), buId: z.string().optional(), active: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    res.json(await updateDepartment(repos(), String(req.params.id), req.body, req.user!));
  })
);

adminRouter.patch(
  '/org/locations/:id',
  authenticate,
  requirePermission('org.manage'),
  validate(z.object({ name: z.string().min(1).max(120).optional(), timeZone: z.string().min(1).max(60).optional(), active: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    res.json(await updateLocation(repos(), String(req.params.id), req.body, req.user!));
  })
);

// User administration
adminRouter.patch(
  '/users/:id',
  authenticate,
  requirePermission('user.manage'),
  validate(
    z.object({
      displayName: z.string().min(1).max(120).optional(),
      roles: z.array(z.enum(ROLES as [string, ...string[]])).optional(),
      supportGroup: z.enum(['service_desk', 'application_support', 'infrastructure_support']).nullable().optional(),
      isActive: z.boolean().optional(),
      jobTitle: z.string().max(120).nullable().optional(),
      buId: z.string().nullable().optional(),
      departmentId: z.string().nullable().optional(),
      managerId: z.string().nullable().optional(),
      locationId: z.string().nullable().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    res.json(await adminUpdateUser(repos(), String(req.params.id), req.body, req.user!));
  })
);

// ---- Service catalog ----
adminRouter.get(
  '/services',
  authenticate,
  authorize('platform_admin', 'manager', 'service_desk', 'application_support', 'infrastructure_support', 'business_user', 'management'),
  asyncHandler(async (_req, res) => {
    res.json(await listServices(repos()));
  })
);
adminRouter.post(
  '/services',
  authenticate,
  requirePermission('service.manage'),
  validate(z.object({ name: z.string().min(1).max(120), ownerBuId: z.string().nullable().optional() })),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createService(repos(), req.body, req.user!));
  })
);
adminRouter.patch(
  '/services/:id',
  authenticate,
  requirePermission('service.manage'),
  validate(z.object({ name: z.string().min(1).max(120).optional(), ownerBuId: z.string().nullable().optional(), active: z.boolean().optional() })),
  asyncHandler(async (req, res) => {
    res.json(await updateService(repos(), String(req.params.id), req.body, req.user!));
  })
);

// ---- Profile self-service (any authenticated user) ----
export const profileRouter = Router();

profileRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await getMyProfile(repos(), req.user!));
  })
);

profileRouter.patch(
  '/',
  authenticate,
  validate(
    z.object({
      displayName: z.string().min(1).max(120).optional(),
      jobTitle: z.string().max(120).nullable().optional(),
      timeZone: z.string().max(60).nullable().optional(),
      preferredLanguage: z.enum(['th', 'en']).nullable().optional(),
      preferredChannel: z.enum(['email', 'in_app']).nullable().optional(),
      avatarUrl: z.string().nullable().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    res.json(await updateMyProfile(repos(), req.user!, req.body));
  })
);

profileRouter.post(
  '/emails',
  authenticate,
  validate(z.object({ emailAddress: z.string().min(3).max(200), emailType: z.enum(['work', 'personal', 'alternate']).optional() })),
  asyncHandler(async (req, res) => {
    res.status(201).json(await addMyEmail(repos(), req.user!, req.body));
  })
);

profileRouter.post(
  '/emails/:id/verify',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await verifyMyEmail(repos(), req.user!, String(req.params.id)));
  })
);
