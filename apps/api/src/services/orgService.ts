import {
  ROLES,
  type AuthUser,
  type BusinessUnit,
  type Department,
  type Location,
  type Organization,
  type Role,
  type User,
  type UserEmail,
} from '@incident/shared';
import { Errors } from '../lib/errors';
import { uuid } from '../lib/ids';
import type { Repositories } from '../repositories/types';
import { writeAudit } from './auditService';

function now() {
  return new Date().toISOString();
}

// ---- Organization master ----
export async function getOrgOverview(repos: Repositories) {
  const [organizations, businessUnits, departments, locations] = await Promise.all([
    repos.listOrganizations(),
    repos.listBusinessUnits(),
    repos.listDepartments(),
    repos.listLocations(),
  ]);
  return { organizations, businessUnits, departments, locations };
}

export async function createBusinessUnit(
  repos: Repositories,
  payload: { orgId: string; code: string; name: string; managerId?: string | null },
  actor: AuthUser
): Promise<BusinessUnit> {
  const fields: Record<string, string> = {};
  if (!payload.orgId) fields.orgId = 'Organization is required.';
  if (!payload.code?.trim()) fields.code = 'Code is required.';
  if (!payload.name?.trim()) fields.name = 'Name is required.';
  if (Object.keys(fields).length) throw Errors.validation('Please complete the business unit.', fields);
  const orgs = await repos.listOrganizations();
  if (!orgs.some((o) => o.id === payload.orgId)) throw Errors.validation('Unknown organization.', { orgId: 'Not found.' });

  const bu: BusinessUnit = { id: `bu-${uuid()}`, orgId: payload.orgId, code: payload.code.trim(), name: payload.name.trim(), managerId: payload.managerId ?? null, active: true };
  await repos.insertBusinessUnit(bu);
  await writeAudit(repos, { action: 'org.bu.created', targetType: 'config', targetId: bu.id, actor, detail: { code: bu.code, orgId: bu.orgId } });
  return bu;
}

export async function createDepartment(
  repos: Repositories,
  payload: { buId: string; name: string },
  actor: AuthUser
): Promise<Department> {
  const fields: Record<string, string> = {};
  if (!payload.buId) fields.buId = 'Business unit is required.';
  if (!payload.name?.trim()) fields.name = 'Name is required.';
  if (Object.keys(fields).length) throw Errors.validation('Please complete the department.', fields);
  const bus = await repos.listBusinessUnits();
  if (!bus.some((b) => b.id === payload.buId)) throw Errors.validation('Unknown business unit.', { buId: 'Not found.' });

  const dept: Department = { id: `dep-${uuid()}`, buId: payload.buId, name: payload.name.trim(), active: true };
  await repos.insertDepartment(dept);
  await writeAudit(repos, { action: 'org.department.created', targetType: 'config', targetId: dept.id, actor, detail: { name: dept.name, buId: dept.buId } });
  return dept;
}

export async function createOrganization(
  repos: Repositories,
  payload: { name: string; type: Organization['type']; parentId?: string | null },
  actor: AuthUser
): Promise<Organization> {
  if (!payload.name?.trim()) throw Errors.validation('Name is required.', { name: 'Name is required.' });
  const org: Organization = { id: `org-${uuid()}`, name: payload.name.trim(), type: payload.type ?? 'company', parentId: payload.parentId ?? null, active: true };
  await repos.insertOrganization(org);
  await writeAudit(repos, { action: 'org.created', targetType: 'config', targetId: org.id, actor, detail: { name: org.name, type: org.type } });
  return org;
}

export async function updateOrganization(
  repos: Repositories,
  id: string,
  patch: Partial<Pick<Organization, 'name' | 'type' | 'parentId' | 'active'>>,
  actor: AuthUser
): Promise<Organization> {
  const org = await repos.findOrganizationById(id);
  if (!org) throw Errors.notFound('Organization not found.');
  if (patch.name !== undefined && !patch.name.trim()) throw Errors.validation('Name is required.', { name: 'Name is required.' });
  const merged: Organization = {
    ...org,
    name: patch.name?.trim() ?? org.name,
    type: patch.type ?? org.type,
    parentId: patch.parentId !== undefined ? patch.parentId : org.parentId,
    active: patch.active !== undefined ? patch.active : org.active,
  };
  await repos.updateOrganization(merged);
  await writeAudit(repos, { action: 'org.updated', targetType: 'config', targetId: id, actor, detail: { active: merged.active } });
  return merged;
}

export async function updateBusinessUnit(
  repos: Repositories,
  id: string,
  patch: Partial<Pick<BusinessUnit, 'code' | 'name' | 'orgId' | 'managerId' | 'active'>>,
  actor: AuthUser
): Promise<BusinessUnit> {
  const bu = await repos.findBusinessUnitById(id);
  if (!bu) throw Errors.notFound('Business unit not found.');
  if (patch.orgId && !(await repos.findOrganizationById(patch.orgId))) throw Errors.validation('Unknown organization.', { orgId: 'Not found.' });
  const merged: BusinessUnit = {
    ...bu,
    code: patch.code?.trim() ?? bu.code,
    name: patch.name?.trim() ?? bu.name,
    orgId: patch.orgId ?? bu.orgId,
    managerId: patch.managerId !== undefined ? patch.managerId : bu.managerId,
    active: patch.active !== undefined ? patch.active : bu.active,
  };
  await repos.updateBusinessUnit(merged);
  await writeAudit(repos, { action: 'org.bu.updated', targetType: 'config', targetId: id, actor, detail: { code: merged.code, active: merged.active } });
  return merged;
}

export async function updateDepartment(
  repos: Repositories,
  id: string,
  patch: Partial<Pick<Department, 'name' | 'buId' | 'active'>>,
  actor: AuthUser
): Promise<Department> {
  const dept = await repos.findDepartmentById(id);
  if (!dept) throw Errors.notFound('Department not found.');
  if (patch.buId && !(await repos.findBusinessUnitById(patch.buId))) throw Errors.validation('Unknown business unit.', { buId: 'Not found.' });
  const merged: Department = {
    ...dept,
    name: patch.name?.trim() ?? dept.name,
    buId: patch.buId ?? dept.buId,
    active: patch.active !== undefined ? patch.active : dept.active,
  };
  await repos.updateDepartment(merged);
  await writeAudit(repos, { action: 'org.department.updated', targetType: 'config', targetId: id, actor, detail: { name: merged.name, active: merged.active } });
  return merged;
}

export async function createLocation(
  repos: Repositories,
  payload: { name: string; timeZone: string },
  actor: AuthUser
): Promise<Location> {
  const fields: Record<string, string> = {};
  if (!payload.name?.trim()) fields.name = 'Name is required.';
  if (!payload.timeZone?.trim()) fields.timeZone = 'Time zone is required.';
  if (Object.keys(fields).length) throw Errors.validation('Please complete the location.', fields);
  const loc: Location = { id: `loc-${uuid()}`, name: payload.name.trim(), timeZone: payload.timeZone.trim(), active: true };
  await repos.insertLocation(loc);
  await writeAudit(repos, { action: 'org.location.created', targetType: 'config', targetId: loc.id, actor, detail: { name: loc.name } });
  return loc;
}

export async function updateLocation(
  repos: Repositories,
  id: string,
  patch: Partial<Pick<Location, 'name' | 'timeZone' | 'active'>>,
  actor: AuthUser
): Promise<Location> {
  const loc = await repos.findLocationById(id);
  if (!loc) throw Errors.notFound('Location not found.');
  const merged: Location = {
    ...loc,
    name: patch.name?.trim() ?? loc.name,
    timeZone: patch.timeZone?.trim() ?? loc.timeZone,
    active: patch.active !== undefined ? patch.active : loc.active,
  };
  await repos.updateLocation(merged);
  await writeAudit(repos, { action: 'org.location.updated', targetType: 'config', targetId: id, actor, detail: { name: merged.name, active: merged.active } });
  return merged;
}

// ---- Service catalog ----
export async function listServices(repos: Repositories) {
  return repos.listServices();
}

export async function createService(repos: Repositories, payload: { name: string; ownerBuId?: string | null }, actor: AuthUser) {
  if (!payload.name?.trim()) throw Errors.validation('Name is required.', { name: 'Name is required.' });
  const svc = { id: `svc-${uuid()}`, name: payload.name.trim(), ownerBuId: payload.ownerBuId ?? null, active: true };
  await repos.insertService(svc);
  await writeAudit(repos, { action: 'service.created', targetType: 'config', targetId: svc.id, actor, detail: { name: svc.name } });
  return svc;
}

export async function updateService(repos: Repositories, id: string, patch: { name?: string; ownerBuId?: string | null; active?: boolean }, actor: AuthUser) {
  const existing = await repos.findServiceById(id);
  if (!existing) throw Errors.notFound('Service not found.');
  const merged = { ...existing, name: patch.name?.trim() ?? existing.name, ownerBuId: patch.ownerBuId !== undefined ? patch.ownerBuId : existing.ownerBuId, active: patch.active !== undefined ? patch.active : existing.active };
  await repos.updateService(merged);
  await writeAudit(repos, { action: 'service.updated', targetType: 'config', targetId: id, actor, detail: { name: merged.name, active: merged.active } });
  return merged;
}

// ---- User administration ----
export async function adminUpdateUser(
  repos: Repositories,
  id: string,
  patch: Partial<Pick<User, 'displayName' | 'roles' | 'supportGroup' | 'isActive' | 'jobTitle' | 'buId' | 'departmentId' | 'managerId' | 'locationId'>>,
  actor: AuthUser
): Promise<User> {
  const stored = await repos.findUserById(id);
  if (!stored) throw Errors.notFound('User not found.');
  if (patch.roles) {
    const bad = patch.roles.filter((r) => !ROLES.includes(r as Role));
    if (bad.length) throw Errors.validation('Unknown role.', { roles: bad.join(', ') });
    if (patch.roles.length === 0) throw Errors.validation('At least one role is required.', { roles: 'required' });
  }
  const before = { roles: stored.roles, buId: stored.buId, isActive: stored.isActive };
  const { passwordHash: _h, passwordSalt: _s, ...base } = stored;
  const merged: User = {
    ...base,
    displayName: patch.displayName ?? stored.displayName,
    roles: patch.roles ?? stored.roles,
    supportGroup: patch.supportGroup !== undefined ? patch.supportGroup : stored.supportGroup,
    isActive: patch.isActive !== undefined ? patch.isActive : stored.isActive,
    jobTitle: patch.jobTitle !== undefined ? patch.jobTitle : stored.jobTitle,
    buId: patch.buId !== undefined ? patch.buId : stored.buId,
    departmentId: patch.departmentId !== undefined ? patch.departmentId : stored.departmentId,
    managerId: patch.managerId !== undefined ? patch.managerId : stored.managerId,
    locationId: patch.locationId !== undefined ? patch.locationId : stored.locationId,
  };
  const saved = await repos.updateUser(merged);
  await writeAudit(repos, { action: 'user.updated', targetType: 'config', targetId: id, actor, detail: { before, after: { roles: saved.roles, buId: saved.buId, isActive: saved.isActive } } });
  return saved;
}

// ---- Profile self-service ----
export async function getMyProfile(repos: Repositories, actor: AuthUser) {
  const stored = await repos.findUserById(actor.id);
  if (!stored) throw Errors.notFound('User not found.');
  const { passwordHash, passwordSalt, ...user } = stored;
  const emails = await repos.listUserEmailsByUser(actor.id);
  return { user, emails };
}

const AVATAR_MAX = 512 * 1024; // 512KB inline data URL cap
export async function updateMyProfile(
  repos: Repositories,
  actor: AuthUser,
  patch: Partial<Pick<User, 'displayName' | 'jobTitle' | 'timeZone' | 'preferredLanguage' | 'preferredChannel' | 'avatarUrl'>>
): Promise<User> {
  const stored = await repos.findUserById(actor.id);
  if (!stored) throw Errors.notFound('User not found.');
  if (patch.avatarUrl) {
    const ok = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/.test(patch.avatarUrl);
    if (!ok) throw Errors.validation('Unsupported avatar format.', { avatarUrl: 'Must be a PNG/JPEG/WEBP/GIF image.' });
    if (patch.avatarUrl.length > AVATAR_MAX) throw Errors.validation('Avatar is too large.', { avatarUrl: 'Max ~512KB.' });
  }
  const { passwordHash: _h, passwordSalt: _s, ...base } = stored;
  const merged: User = {
    ...base,
    displayName: patch.displayName?.trim() || stored.displayName,
    jobTitle: patch.jobTitle !== undefined ? patch.jobTitle : stored.jobTitle,
    timeZone: patch.timeZone !== undefined ? patch.timeZone : stored.timeZone,
    preferredLanguage: patch.preferredLanguage !== undefined ? patch.preferredLanguage : stored.preferredLanguage,
    preferredChannel: patch.preferredChannel !== undefined ? patch.preferredChannel : stored.preferredChannel,
    avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : stored.avatarUrl,
  };
  const saved = await repos.updateUser(merged);
  await writeAudit(repos, { action: 'profile.updated', targetType: 'auth', targetId: actor.id, actor, detail: { fields: Object.keys(patch) } });
  return saved;
}

// ---- Email identity ----
export async function addMyEmail(
  repos: Repositories,
  actor: AuthUser,
  payload: { emailAddress: string; emailType?: UserEmail['emailType'] }
): Promise<UserEmail> {
  const addr = payload.emailAddress?.trim().toLowerCase();
  if (!addr || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) throw Errors.validation('Invalid email address.', { emailAddress: 'Enter a valid email.' });
  const all = await repos.listUserEmails();
  if (all.some((e) => e.isVerified && e.emailAddress.toLowerCase() === addr)) {
    throw Errors.validation('This email is already verified for another identity.', { emailAddress: 'Already in use.' });
  }
  const email: UserEmail = { id: `em-${uuid()}`, userId: actor.id, emailAddress: addr, emailType: payload.emailType ?? 'alternate', isPrimary: false, isVerified: false, verifiedAt: null, active: true };
  await repos.insertUserEmail(email);
  await writeAudit(repos, { action: 'email.added', targetType: 'auth', targetId: actor.id, actor, detail: { emailType: email.emailType } });
  return email;
}

// Workshop verification stub — no real mail loop; marks verified immediately and audits.
export async function verifyMyEmail(repos: Repositories, actor: AuthUser, emailId: string): Promise<UserEmail> {
  const email = await repos.findUserEmailById(emailId);
  if (!email || email.userId !== actor.id) throw Errors.notFound('Email not found.');
  const all = await repos.listUserEmails();
  if (all.some((e) => e.id !== email.id && e.isVerified && e.emailAddress.toLowerCase() === email.emailAddress.toLowerCase())) {
    throw Errors.validation('This email is already verified for another identity.', { emailAddress: 'Already in use.' });
  }
  const updated: UserEmail = { ...email, isVerified: true, verifiedAt: now() };
  await repos.updateUserEmail(updated);
  await writeAudit(repos, { action: 'email.verified', targetType: 'auth', targetId: actor.id, actor, detail: { emailId } });
  return updated;
}
