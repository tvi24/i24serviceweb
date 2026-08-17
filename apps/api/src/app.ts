import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './lib/logger';
import './middleware/context';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { incidentsRouter } from './routes/incidents';
import { alertsRouter, configRouter, healthRouter, kpiRouter, usersRouter } from './routes/misc';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '256kb' }));
  // Minimal request logging — never log headers, bodies, or PII. Only method/url/status.
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return { id: req.id, method: req.method, url: req.url };
        },
        res(res) {
          return { statusCode: res.statusCode };
        },
      },
    })
  );

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/incidents', incidentsRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/kpi', kpiRouter);
  app.use('/api/config', configRouter);
  app.use('/api/users', usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
