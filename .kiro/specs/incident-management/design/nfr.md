# Non-Functional Design: Security, Privacy, Reliability

## Security controls (R12) — OWASP Top 10 mapping

| OWASP category | Control in this design |
|---|---|
| A01 Broken Access Control | Per-request `authenticate` + `authorize`; resource/group/ownership re-check in handlers; reporter can only see own cases; audit read gated |
| A02 Cryptographic Failures | Passwords via scrypt salted hash + timingSafeEqual; TLS in deployed env; JWT signed with env secret; sensitive data encrypted at rest (DB/managed) |
| A03 Injection | Parameterized SQL only (pg); zod input validation; no string-built queries; output encoding in React (default escaping) |
| A04 Insecure Design | Layered services, repository seam, human-in-the-loop AI, least-privilege roles |
| A05 Security Misconfiguration | `helmet` headers, CORS allow-list, no debug errors to client, secrets from env only |
| A06 Vulnerable Components | Pinned versions, maintained libs (Express 5, pg 8, zod), lockfile committed |
| A07 Auth Failures | Generic auth failure messages, short-lived JWT, no user enumeration, rate-limit login |
| A08 Integrity Failures | Append-only audit_events; lockfile; signed tokens |
| A09 Logging/Monitoring Failures | Structured pino logs, audit trail for security-relevant actions, errorId correlation |
| A10 SSRF | No user-controlled outbound URLs; Bedrock endpoint fixed via config |

Additional:
- CSRF: JWT in Authorization header (not cookie) avoids classic CSRF; state-changing requests require valid Bearer token.
- Input validation centralized in `validate` middleware (type/format/length/allowed values/required) before business logic.
- Safe failure: errorHandler returns non-technical message + errorId; stack logged server-side only.
- Secrets: `JWT_SECRET`, DB creds, Bedrock keys from `process.env`/secret store; `.env` gitignored; `.env.example` has placeholders.

## Privacy (R13, PDPA-aligned)

- Synthetic data only for all users/incidents; no real personal data.
- Data minimization: collect only fields defined in the data model.
- Log masking: user/case referenced by id or masked label, not full personal content.
- Field scoping: API returns only fields needed for the authorized operation (e.g. reporter list view omits internal notes).
- Retention: `closure_grace` + documented retention rule; delete/anonymize hook documented (workshop: manual/seed reset).

## Reliability (R14)

- Intake persists the ticket before returning `ticketId`; persistence failure → error response, no false success.
- Structured logs for operations and errors.
- Health endpoint for runtime checks.
- Acceptance evidence: each mandatory requirement has ≥1 automated/scripted test (see testing-strategy.md); critical tests must pass before delivery.

## Deployment readiness (R15)

- Versioned app/db/infra/config, no committed secrets.
- Containerized services + PostgreSQL via Docker Compose.
- Documented deploy/redeploy/rollback (operations.md).
- Health available on release start.
