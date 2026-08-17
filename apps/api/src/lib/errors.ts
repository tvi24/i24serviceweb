// Domain error used across services. Mapped to the API error contract by errorHandler.
export class AppError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const Errors = {
  validation: (message: string, fields?: Record<string, string>) => new AppError(400, 'validation_error', message, fields),
  unauthenticated: (message = 'Not authenticated.') => new AppError(401, 'unauthenticated', message),
  forbidden: (message = 'You do not have permission to perform this action.') => new AppError(403, 'forbidden', message),
  notFound: (message = 'Resource not found.') => new AppError(404, 'not_found', message),
  conflict: (message: string) => new AppError(409, 'conflict', message),
  businessRule: (message: string, fields?: Record<string, string>) => new AppError(422, 'business_rule', message, fields),
};
