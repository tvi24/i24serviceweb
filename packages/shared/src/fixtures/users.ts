import type { User } from '../types.js';

// Synthetic workshop users. Passwords (plaintext, workshop-only, documented for demo):
// all users use the password shown in WORKSHOP_PASSWORDS below.
// The API seed hashes these with scrypt; plaintext is never stored at runtime.
export const WORKSHOP_PASSWORDS: Record<string, string> = {
  emma: 'Passw0rd!',
  sam: 'Passw0rd!',
  alex: 'Passw0rd!',
  ivan: 'Passw0rd!',
  mary: 'Passw0rd!',
  gary: 'Passw0rd!',
};

export const users: User[] = [
  {
    id: 'u-emma',
    username: 'emma',
    displayName: 'Emma Employee',
    roles: ['business_user'],
    supportGroup: null,
    isActive: true,
    createdAt: '2026-01-02T08:00:00.000Z',
  },
  {
    id: 'u-sam',
    username: 'sam',
    displayName: 'Sam ServiceDesk',
    roles: ['service_desk'],
    supportGroup: 'service_desk',
    isActive: true,
    createdAt: '2026-01-02T08:00:00.000Z',
  },
  {
    id: 'u-alex',
    username: 'alex',
    displayName: 'Alex AppSupport',
    roles: ['application_support'],
    supportGroup: 'application_support',
    isActive: true,
    createdAt: '2026-01-02T08:00:00.000Z',
  },
  {
    id: 'u-ivan',
    username: 'ivan',
    displayName: 'Ivan InfraSupport',
    roles: ['infrastructure_support'],
    supportGroup: 'infrastructure_support',
    isActive: true,
    createdAt: '2026-01-02T08:00:00.000Z',
  },
  {
    id: 'u-mary',
    username: 'mary',
    displayName: 'Mary Manager',
    roles: ['manager'],
    supportGroup: null,
    isActive: true,
    createdAt: '2026-01-02T08:00:00.000Z',
  },
  {
    id: 'u-gary',
    username: 'gary',
    displayName: 'Gary GM',
    roles: ['management'],
    supportGroup: null,
    isActive: true,
    createdAt: '2026-01-02T08:00:00.000Z',
  },
];
