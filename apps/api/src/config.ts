import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3001),
  DATA_BACKEND: z.enum(['memory', 'pg']).default('memory'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(1).default('dev-only-insecure-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  AI_PROVIDER: z.enum(['rules', 'bedrock']).default('rules'),
  LOG_LEVEL: z.string().default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.string().default('development'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast on misconfiguration without leaking values.
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

if (config.DATA_BACKEND === 'pg' && !config.DATABASE_URL) {
  console.error('DATA_BACKEND=pg requires DATABASE_URL.');
  process.exit(1);
}

if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'dev-only-insecure-secret-change-me') {
  console.error('JWT_SECRET must be set in production.');
  process.exit(1);
}
