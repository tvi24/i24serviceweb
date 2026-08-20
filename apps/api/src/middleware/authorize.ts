import type { PermissionKey, Role } from '@incident/shared';
import { permissionsForRoles } from '@incident/shared';
import type { NextFunction, Request, Response } from 'express';
import { Errors } from '../lib/errors';

// Role-based authorization. Resource/ownership checks are enforced additionally
// inside services (e.g. reporter can only act on own incidents).
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Errors.unauthenticated());
    if (roles.length === 0) return next();
    const ok = roles.some((r) => req.user!.roles.includes(r));
    if (!ok) return next(Errors.forbidden());
    next();
  };
}

// v3.0 granular permission gate (additive over the coarse role gate).
// A user is authorized if any of their roles grants the required permission.
export function requirePermission(...perms: PermissionKey[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Errors.unauthenticated());
    const held = permissionsForRoles(req.user.roles);
    const ok = perms.some((p) => held.includes(p));
    if (!ok) return next(Errors.forbidden());
    next();
  };
}
