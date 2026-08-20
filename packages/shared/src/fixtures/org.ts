import type { BusinessUnit, Department, Location, Organization, UserEmail } from '../types.js';

// Synthetic MGC organization hierarchy. Configurable at runtime — this is demo seed only,
// NOT a hard-coded business rule (refinement FR-10).
export const organizations: Organization[] = [
  { id: 'org-mgc', name: 'MGC Group', type: 'group', parentId: null, active: true },
  { id: 'org-mcr', name: 'MCR', type: 'company', parentId: 'org-mgc', active: true },
  { id: 'org-mag', name: 'MAG', type: 'company', parentId: 'org-mgc', active: true },
  { id: 'org-mgcc', name: 'MGC', type: 'company', parentId: 'org-mgc', active: true },
  { id: 'org-xpeng', name: 'XPENG', type: 'company', parentId: 'org-mgc', active: true },
];

export const businessUnits: BusinessUnit[] = [
  { id: 'bu-mcr', orgId: 'org-mcr', code: 'MCR', name: 'MCR Operations', managerId: 'u-mary', active: true },
  { id: 'bu-mag', orgId: 'org-mag', code: 'MAG', name: 'MAG Services', managerId: 'u-mary', active: true },
  { id: 'bu-mgc', orgId: 'org-mgcc', code: 'MGC', name: 'MGC Corporate', managerId: 'u-mary', active: true },
  { id: 'bu-xpeng', orgId: 'org-xpeng', code: 'XPENG', name: 'XPENG Dealer', managerId: 'u-mary', active: true },
];

export const departments: Department[] = [
  { id: 'dep-mcr-it', buId: 'bu-mcr', name: 'IT', active: true },
  { id: 'dep-mcr-ops', buId: 'bu-mcr', name: 'Operations', active: true },
  { id: 'dep-mag-it', buId: 'bu-mag', name: 'IT', active: true },
  { id: 'dep-mgc-it', buId: 'bu-mgc', name: 'Corporate IT', active: true },
  { id: 'dep-xpeng-svc', buId: 'bu-xpeng', name: 'Dealer Support', active: true },
];

export const locations: Location[] = [
  { id: 'loc-bkk', name: 'Bangkok HQ', timeZone: 'Asia/Bangkok', active: true },
  { id: 'loc-cnx', name: 'Chiang Mai', timeZone: 'Asia/Bangkok', active: true },
];

// Verified organization email is the default primary identity (refinement BR-06).
export const userEmails: UserEmail[] = [
  { id: 'em-emma', userId: 'u-emma', emailAddress: 'emma@mgc.demo', emailType: 'work', isPrimary: true, isVerified: true, verifiedAt: '2026-01-02T08:00:00.000Z', active: true },
  { id: 'em-sam', userId: 'u-sam', emailAddress: 'sam@mgc.demo', emailType: 'work', isPrimary: true, isVerified: true, verifiedAt: '2026-01-02T08:00:00.000Z', active: true },
  { id: 'em-alex', userId: 'u-alex', emailAddress: 'alex@mgc.demo', emailType: 'work', isPrimary: true, isVerified: true, verifiedAt: '2026-01-02T08:00:00.000Z', active: true },
  { id: 'em-ivan', userId: 'u-ivan', emailAddress: 'ivan@mgc.demo', emailType: 'work', isPrimary: true, isVerified: true, verifiedAt: '2026-01-02T08:00:00.000Z', active: true },
  { id: 'em-mary', userId: 'u-mary', emailAddress: 'mary@mgc.demo', emailType: 'work', isPrimary: true, isVerified: true, verifiedAt: '2026-01-02T08:00:00.000Z', active: true },
  { id: 'em-gary', userId: 'u-gary', emailAddress: 'gary@mgc.demo', emailType: 'work', isPrimary: true, isVerified: true, verifiedAt: '2026-01-02T08:00:00.000Z', active: true },
  { id: 'em-admin', userId: 'u-admin', emailAddress: 'admin@mgc.demo', emailType: 'work', isPrimary: true, isVerified: true, verifiedAt: '2026-01-02T08:00:00.000Z', active: true },
];
