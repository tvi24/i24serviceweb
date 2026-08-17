import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';
import { uuid } from '../lib/ids';
import { logger } from '../lib/logger';

// Maps errors to the API error contract. Never leaks stack traces to clients.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const errorId = uuid();

  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err, errorId }, 'Server error');
    else logger.warn({ code: err.code, errorId }, err.message);
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, errorId, fields: err.fields },
    });
  }

  logger.error({ err, errorId }, 'Unhandled error');
  return res.status(500).json({
    error: { code: 'internal_error', message: 'An unexpected error occurred.', errorId },
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'not_found', message: 'Route not found.', errorId: uuid() } });
}
