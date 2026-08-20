# Design Addendum — Product Refinement v3.0

> Extends the approved design (`design.md` + `design/*`) for the Enterprise Service Operations evolution. Preserves the existing architecture (monorepo, `Repositories` seam, `mock|http` client, JWT+RBAC, migration runner, i18n, theme tokens). Additive and backward-compatible. Reconciliation note: actual DB uses `text` IDs (not `uuid` as `data-model.md` states); new entities follow `text` IDs.

## Architecture decisions

- **Additive schema, dual-repo parity.** Every new entity is added to the `Repositories` interface and implemented in both `memory.ts` and `pg.ts` in the same task. New columns on `users`/`incidents` are nullable so existing rows, fixtures, and the 57 tests stay valid.
- **SLA engine with default fallback.** `SLAPolicy`/`SLAInstance` are introduced alongside the existing global `SlaConfig`. A seeded default policy mirrors the current targets/matrix so behavior is unchanged when no BU/Service policy matches. Precedence: exact (BU+Service+Priority+RequestType) → partial → global default.
- **Email via adapter port.** `EmailAdapter` interface (`sendMail`, `pollInbound`/webhook ingest). Default = local **mock adapter** (in-memory outbox + synthetic inbound) so the app runs with no provider/secrets. Real M365/SES/SMTP adapters are env-gated boundaries; secrets from env only.
- **RBAC layering.** Keep coarse `authorize(...roles)`. Add an additive `Permission` layer + `platform_admin` role for configuration surfaces; navigation is generated from permissions. Existing role gates remain authoritative for R1–R17 endpoints.
- **AI recommendation record.** Add `AIRecommendation` rows capturing suggested value + confidence + source + human decision, complementing the existing `*Suggested` incident fields.
- **KPI envelope.** KPI responses gain `{ value, numerator, denominator, filterContext, timeRange, lastRefreshedAt }` and BU/Service/Priority/SupportGroup dimensions; untriaged/unset kept as explicit buckets.

## New / changed entities (canonical, `text` IDs)

- `organizations(id, name, type: group|company, parent_id?)`, `business_units(id, org_id, code, name)`, `departments(id, bu_id, name)`, `locations(id, name, tz)`.
- `users` +: `job_title, bu_id?, department_id?, manager_id?, location_id?, avatar_url?, time_zone?, preferred_language?, preferred_channel?, last_login_at?`.
- `user_emails(id, user_id, email_address, email_type, is_primary, is_verified, verified_at?, active)`.
- `permissions(id, key, description)`, `user_roles(user_id, role)`, `support_group_members(support_group, user_id)`.
- `services(id, name, owner_bu_id?)`, incident +: `service_id?, category?, subcategory?, requester_bu_id?, affected_bu_id?, service_owner_bu_id?, request_type?`; `channel` now actually populated.
- `sla_policies(id, name, bu_id?, service_id?, priority?, request_type?, response_target_min, resolution_target, calendar_id?, warning_pct, escalation_pct, effective_from?, effective_to?, status)`.
- `sla_instances(id, incident_id, policy_id, started_at, response_due_at, resolution_due_at, response_met_at?, resolution_met_at?, pause_ms, state, breach_at?, escalation_state)`.
- `business_calendars(id, name, tz, mode: business_hours|24x7, work_days, work_start, work_end, holidays[])`.
- `email_accounts(id, name, address, display_name, provider, direction, auth_type, status, last_inbound_at?, last_outbound_at?)`.
- `email_messages(id, thread_id, incident_id?, direction, from_addr, to_addr, cc?, subject, body, delivery_state, processing_state, error_state?, created_at)`, `email_threads(id, incident_id?, reference)`, `email_templates(id, key, subject, body)`.
- `ai_recommendations(id, incident_id, field, suggested_value, confidence, source, decision, reviewer_id?, created_at)`.

## Component/UX direction (Vibe 04)
Professional enterprise service-operations workspace: role-based nav (Home/Work/Service/Analytics/Platform Administration), compact data tables, sticky incident header with SLA timers, right-side context panel, one primary CTA per context. Light default + existing dark theme; extend `tokens.css` only if new tokens are required (kept in sync with `design-system.md`). No emoji; Lucide icons; Inter (+ Noto Sans Thai for TH). All strings via `t()`.
