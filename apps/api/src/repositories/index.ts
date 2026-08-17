import { config } from '../config';
import { logger } from '../lib/logger';
import { createMemoryRepositories } from './memory';
import type { Repositories } from './types';

let repos: Repositories | null = null;

export async function initRepositories(): Promise<Repositories> {
  if (repos) return repos;
  if (config.DATA_BACKEND === 'pg') {
    const { createPgRepositories } = await import('./pg');
    repos = await createPgRepositories();
    logger.info('Using PostgreSQL data backend.');
  } else {
    repos = createMemoryRepositories();
    logger.info('Using in-memory data backend (seeded fixtures).');
  }
  return repos;
}

export function getRepositories(): Repositories {
  if (!repos) throw new Error('Repositories not initialized. Call initRepositories() first.');
  return repos;
}

// For tests: force a fresh memory backend.
export function setRepositoriesForTest(r: Repositories) {
  repos = r;
}

export type { Repositories };
