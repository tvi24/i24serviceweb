import type { NextFunction, Request, Response } from 'express';
import { Errors } from '../lib/errors';
import { verifyToken } from '../services/authService';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(Errors.unauthenticated());
  }
  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
}
