import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { Errors } from '../lib/errors';

// Validates and replaces req.body with the parsed (and stripped) value.
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || 'body';
        if (!fields[key]) fields[key] = issue.message;
      }
      return next(Errors.validation('Invalid request data.', fields));
    }
    req.body = result.data;
    next();
  };
}
