# Operations

Observability level: **Minimal** (structured logging + health) + graceful lifecycle. Matches D3-9/10/11 and workshop scope. (R14, R15)

## Logging (pino)

- One base logger (`lib/logger.ts`); per-request child logger with `requestId`.
- Log each request: method, path, status, duration, requestId, userId (masked), no bodies with secrets.
- Errors log `errorId`, error class, stack (server-side only). Never log passwords, tokens, JWT secrets, or full personal data.
- `LOG_LEVEL` env controls verbosity.

| Component | Logs |
|---|---|
| requestLogger | request start/finish |
| errorHandler | error with errorId + stack (server-side) |
| authService | login success/failure (no credentials) |
| slaClock | state transitions + alerts emitted |
| services | key domain events at info/debug |

## Health & lifecycle

- `GET /api/health` → `{ status: "ok", uptime, checks: { db: "ok"|"down" } }`. In `pg` mode runs a lightweight `SELECT 1`. No secrets/stack/incident data. (R14.4/14.5)
- Readiness: health returns non-ok until DB reachable in pg mode.
- Graceful shutdown: on SIGTERM/SIGINT stop accepting connections, clear slaClock interval, drain, close pg pool, exit. (D3-11)

## Deployment runbook (Docker Compose)

### Local / workshop
1. `cp .env.example .env` and set `JWT_SECRET` (and Bedrock keys only if used).
2. `docker compose up -d --build` → starts `postgres`, `api`, `web`.
3. API runs migrations then seed on first boot (`npm run migrate && npm run seed`, or entrypoint).
4. Open web at `http://localhost:5173` (dev) or the compose-mapped port.
5. Health: `curl http://localhost:3001/api/health`.

### Redeploy
1. `git pull`.
2. `docker compose build api web`.
3. `docker compose up -d` (rolling replace).
4. Run pending migrations (`docker compose exec api npm run migrate`).
5. Verify `/api/health`.

### Rollback
1. `git checkout <previous-tag>`.
2. `docker compose up -d --build`.
3. If a migration must be reverted, apply the paired `*.down.sql` (each migration ships an up/down pair) then redeploy.
4. Verify `/api/health` and a smoke login.

## Version control / IaC

- All app code, `docker-compose.yml`, Dockerfiles, migrations, and `.env.example` are committed. `.env` and secrets are never committed (`.gitignore`).
- Migrations are ordered, idempotent-guarded, and versioned in `apps/api/src/migrations/`.
