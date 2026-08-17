import { createApp } from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { startSlaClock, stopSlaClock } from './lib/slaClock';
import { initRepositories } from './repositories';

async function main() {
  await initRepositories();
  const app = createApp();
  const server = app.listen(config.PORT, () => {
    logger.info({ port: config.PORT, backend: config.DATA_BACKEND }, 'Incident Management API listening');
  });

  startSlaClock();

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    stopSlaClock();
    server.close(async () => {
      if (config.DATA_BACKEND === 'pg') {
        try {
          const { closeDb } = await import('./db/pool');
          await closeDb();
        } catch {
          /* ignore */
        }
      }
      logger.info('Shutdown complete');
      process.exit(0);
    });
    // Force-exit if it takes too long
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
