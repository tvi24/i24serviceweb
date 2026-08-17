import { getRepositories } from '../repositories';
import { runMaintenance } from '../services/maintenanceService';
import { evaluateAllSla } from '../services/slaService';
import { logger } from './logger';

let slaTimer: NodeJS.Timeout | null = null;
let maintenanceTimer: NodeJS.Timeout | null = null;

// Periodically re-evaluates SLA states and runs maintenance (auto-close + CSAT reminders).
export function startSlaClock(slaIntervalMs = 30_000, maintenanceIntervalMs = 300_000) {
  if (!slaTimer) {
    slaTimer = setInterval(() => {
      evaluateAllSla(getRepositories()).catch((err) => logger.warn({ err }, 'SLA evaluation failed'));
    }, slaIntervalMs);
  }
  if (!maintenanceTimer) {
    maintenanceTimer = setInterval(() => {
      runMaintenance(getRepositories()).catch((err) => logger.warn({ err }, 'Maintenance run failed'));
    }, maintenanceIntervalMs);
  }
  logger.info({ slaIntervalMs, maintenanceIntervalMs }, 'SLA clock + maintenance started');
}

export function stopSlaClock() {
  if (slaTimer) { clearInterval(slaTimer); slaTimer = null; }
  if (maintenanceTimer) { clearInterval(maintenanceTimer); maintenanceTimer = null; }
}
