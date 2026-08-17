import { seedData, WORKSHOP_PASSWORDS } from '@incident/shared/fixtures';
import { hashPassword } from '../lib/crypto';
import { migrate } from './migrate';
import { closeDb, getPool } from './pool';

// Seeds synthetic workshop data into PostgreSQL (idempotent-ish: clears then inserts).
export async function seed() {
  await migrate();
  const pool = getPool();
  const data = seedData();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Clear in FK-safe order
    await client.query('TRUNCATE audit_events, csat, alerts, sla_records, activities, incidents, users, sla_config, ticket_seq RESTART IDENTITY CASCADE');

    for (const u of data.users) {
      const pw = WORKSHOP_PASSWORDS[u.username] ?? 'Passw0rd!';
      const { hash, salt } = hashPassword(pw);
      await client.query(
        'INSERT INTO users (id, username, display_name, password_hash, password_salt, roles, support_group, is_active, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [u.id, u.username, u.displayName, hash, salt, u.roles, u.supportGroup, u.isActive, u.createdAt]
      );
    }

    for (const i of data.incidents) {
      await client.query(
        `INSERT INTO incidents (id, ticket_id, title, description, reporter_id, channel, classification, classification_suggested, impact, urgency, priority, priority_suggested, ai_source, status, support_group, assigned_owner_id, resolution_code, resolution_note, reopen_reason, idempotency_key, created_at, updated_at, resolved_at, closed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
        [i.id, i.ticketId, i.title, i.description, i.reporterId, i.channel, i.classification, i.classificationSuggested, i.impact, i.urgency, i.priority, i.prioritySuggested, i.aiSource, i.status, i.supportGroup, i.assignedOwnerId, i.resolutionCode ?? null, i.resolutionNote ?? null, i.reopenReason ?? null, i.idempotencyKey ?? null, i.createdAt, i.updatedAt, i.resolvedAt ?? null, i.closedAt ?? null]
      );
    }
    for (const a of data.activities) {
      await client.query('INSERT INTO activities (id, incident_id, type, author_id, note, from_status, to_status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [a.id, a.incidentId, a.type, a.authorId, a.note ?? null, a.fromStatus ?? null, a.toStatus ?? null, a.createdAt]);
    }
    for (const s of data.slaRecords) {
      await client.query('INSERT INTO sla_records (id, incident_id, priority, response_target_at, resolution_target_at, response_at, response_state, resolution_state, started_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [s.id, s.incidentId, s.priority, s.responseTargetAt, s.resolutionTargetAt, s.responseAt ?? null, s.responseState, s.resolutionState, s.startedAt]);
    }
    for (const a of data.alerts) {
      await client.query('INSERT INTO alerts (id, incident_id, type, severity, message, recipient_role, recipient_id, acknowledged_at, acknowledged_by, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [a.id, a.incidentId, a.type, a.severity, a.message, a.recipientRole ?? null, a.recipientId ?? null, a.acknowledgedAt ?? null, a.acknowledgedBy ?? null, a.createdAt]);
    }
    for (const c of data.csats) {
      await client.query('INSERT INTO csat (id, incident_id, confirmed_at, rating, comment, reminder_count, last_reminder_at, submitted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [c.id, c.incidentId, c.confirmedAt ?? null, c.rating ?? null, c.comment ?? null, c.reminderCount, c.lastReminderAt ?? null, c.submittedAt ?? null]);
    }
    for (const e of data.auditEvents) {
      await client.query('INSERT INTO audit_events (id, actor_id, actor_label, action, target_type, target_id, detail, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [e.id, e.actorId ?? null, e.actorLabel, e.action, e.targetType, e.targetId ?? null, e.detail ? JSON.stringify(e.detail) : null, e.createdAt]);
    }
    await client.query(
      'INSERT INTO sla_config (id, targets, at_risk_pct, priority_matrix, routing_rules, closure_grace_hours, reminder_max, updated_at) VALUES (1,$1,$2,$3,$4,$5,$6,$7)',
      [JSON.stringify(data.slaConfig.targets), data.slaConfig.atRiskPct, JSON.stringify(data.slaConfig.priorityMatrix), JSON.stringify(data.slaConfig.routingRules), data.slaConfig.closureGraceHours, data.slaConfig.reminderMax, data.slaConfig.updatedAt ?? new Date().toISOString()]
    );
    await client.query('INSERT INTO ticket_seq (id, val) VALUES (1, 1006)');

    await client.query('COMMIT');
    console.log('Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seed()
    .then(() => closeDb())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
