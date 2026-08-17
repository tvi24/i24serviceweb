import type { AuthUser, LoginResponse } from '@incident/shared';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { verifyPassword } from '../lib/crypto';
import { Errors } from '../lib/errors';
import type { Repositories, StoredUser } from '../repositories/types';
import { writeAudit } from './auditService';

function toAuthUser(u: StoredUser): AuthUser {
  return { id: u.id, username: u.username, displayName: u.displayName, roles: u.roles, supportGroup: u.supportGroup };
}

export async function login(repos: Repositories, username: string, password: string): Promise<LoginResponse> {
  const user = await repos.findUserByUsername(username);
  // Generic failure — never reveal whether the username exists.
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    throw Errors.unauthenticated('Invalid username or password.');
  }
  const authUser = toAuthUser(user);
  const token = jwt.sign(
    { sub: user.id, username: user.username, roles: user.roles, supportGroup: user.supportGroup },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
  await writeAudit(repos, { action: 'auth.login', targetType: 'auth', targetId: user.id, actor: authUser });
  return { token, user: authUser };
}

export interface JwtClaims {
  sub: string;
  username: string;
  roles: AuthUser['roles'];
  supportGroup?: AuthUser['supportGroup'];
}

export function verifyToken(token: string): AuthUser {
  try {
    const claims = jwt.verify(token, config.JWT_SECRET) as JwtClaims;
    return { id: claims.sub, username: claims.username, displayName: claims.username, roles: claims.roles, supportGroup: claims.supportGroup ?? null };
  } catch {
    throw Errors.unauthenticated('Invalid or expired session.');
  }
}
