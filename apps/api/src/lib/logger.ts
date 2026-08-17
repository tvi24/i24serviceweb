import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.LOG_LEVEL,
  // Never log secrets or credentials.
  redact: {
    paths: ['req.headers.authorization', 'password', '*.password', 'token', '*.token', 'JWT_SECRET'],
    censor: '[redacted]',
  },
});
