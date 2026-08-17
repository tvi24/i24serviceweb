# Design Decisions (D3)

## Context Summary
- Product: AI-Assisted Incident Management (APP-03), greenfield workshop.
- Fixed stack (from assessment): React + Vite (frontend), Node.js 24 LTS + Express REST API (backend), PostgreSQL 18, Docker Compose local runtime.
- Delivery boundary: working Web Portal intake + in-app Central Alert Center. Mail / LINE OA / Phone / outbound notifications = documented integration boundaries only.
- Auth: local workshop authentication, predefined synthetic users, per-request RBAC, no external IdP.
- SLA defaults (editable): P1 15m/4h, P2 30m/8h, P3 4h/3 business days, P4 8h/5 business days.
- Workspace policy build order: Setup -> Frontend + mock JSON -> Frontend + real backend/DB -> extras -> test -> deploy.

Because the assessment fixes the core stack, most technology questions are settled. The questions below cover the decisions that are still open.

---

## Decision Questions

### D3-1: Repository / Project Structure
**Question**: How should the frontend and backend code be organized?
- 1) Single monorepo with `apps/web` (React+Vite) and `apps/api` (Express) + shared `packages/` for types **(Recommended)**
- 2) Two separate top-level folders `frontend/` and `backend/`, no shared package
- 3) Single combined Express app that also serves the built React bundle
- 4) Other (please specify): _______

**Answer**:

---

### D3-2: Data Layer Approach (workshop build order)
**Question**: How should data be handled across the build phases?
- 1) Phase 1 frontend reads local `.json` mock files; Phase 2 swap to Express API backed by PostgreSQL via a repository interface (same shape) **(Recommended — matches workspace build-order policy)**
- 2) Go straight to PostgreSQL + Express from the start (no mock phase)
- 3) Use an in-memory backend store for the whole workshop, no PostgreSQL
- 4) Other (please specify): _______

**Answer**:

---

### D3-3: Database Access (Phase 2)
**Question**: How should the Express API talk to PostgreSQL?
- 1) `pg` driver with hand-written parameterized SQL + a thin migration runner **(Recommended — transparent, minimal deps, easy to audit for the workshop)**
- 2) Prisma ORM (schema-first, generated client, built-in migrations)
- 3) Knex query builder + migrations
- 4) Other (please specify): _______

**Answer**:

---

### D3-4: Authentication & Session Mechanism
**Question**: How should local workshop sessions be represented after login?
- 1) Stateless JWT access token (short-lived) sent as `Authorization: Bearer`, RBAC claims in token **(Recommended)**
- 2) Server-side session + httpOnly cookie (session store in PostgreSQL)
- 3) Signed httpOnly cookie carrying a JWT (CSRF-protected)
- 4) Other (please specify): _______

**Answer**:

---

### D3-5: AI Classification / Priority Adapter
**Question**: How should the AI-assist recommendation be implemented for the workshop?
- 1) Adapter interface with a deterministic rules/keyword mock as the default; optional AWS Bedrock implementation behind an env flag **(Recommended — no external dependency required to run)**
- 2) Bedrock only (requires AWS access to run at all)
- 3) Rules/mock only, no Bedrock code path
- 4) Other (please specify): _______

**Answer**:

---

### D3-6: Frontend State & Data Fetching
**Question**: What should manage server data / caching in the React app?
- 1) TanStack Query (React Query) for server state + minimal local state **(Recommended)**
- 2) Redux Toolkit (RTK Query)
- 3) Plain React hooks + Context + fetch, no data-fetching library
- 4) Other (please specify): _______

**Answer**:

---

### D3-7: Testing Framework
**Question**: What test tooling for backend and frontend?
- 1) Vitest across both, + Supertest for API + React Testing Library for components **(Recommended — one runner, fast)**
- 2) Jest across both + Supertest + React Testing Library
- 3) Node built-in test runner (backend) + Vitest (frontend)
- 4) Other (please specify): _______

**Answer**:

---

### D3-8: Correctness / Property-Based Testing
**Question**: How rigorously should core logic (SLA state transitions, priority matrix, RBAC checks) be verified?
- 1) Example-based unit tests for the critical rules only **(Recommended for a workshop)**
- 2) Example-based + property-based tests (fast-check) for SLA/priority/RBAC invariants
- 3) Contract/acceptance tests mapped 1:1 to each requirement
- 4) Other (please specify): _______

**Answer**:

---

### D3-9: Observability Strategy
**Question**: What level of observability does the service need?
- 1) Minimal — structured logging (pino) + health endpoint **(Recommended for a workshop app)**
- 2) Standard — logging + metrics + health + readiness
- 3) Full — logging + metrics + tracing + alerting + dashboards
- 4) None — prototype only
- 5) Other (please specify): _______

**Answer**:

---

### D3-10: Error Tracking
**Question**: How should runtime errors be captured?
- 1) Log-based only — structured error logs with a traceable error id **(Recommended for the workshop)**
- 2) Dedicated error tracking service (Sentry / Datadog)
- 3) Cloud-native — CloudWatch Logs Insights
- 4) None
- 5) Other (please specify): _______

**Answer**:

---

### D3-11: Health & Lifecycle Management
**Question**: What lifecycle management does the service need?
- 1) Basic health endpoint only
- 2) Health + readiness + graceful shutdown **(Recommended for containerized runtime)**
- 3) Health + readiness + graceful shutdown + startup probe + drain delay
- 4) Other (please specify): _______

**Answer**:

---

### D3-12: UI Design Direction (design-system)
**Question**: What visual direction for the portal/console (light mode default, WCAG 2.2 AA, open-source fonts/icons, no emoji)?
- 1) Clean enterprise operations console: calm blue primary + semantic status colors (P1 red / P2 orange / P3 amber / P4 slate; success/danger/warning/info), Inter (OFL) type, Lucide (ISC/MIT) SVG icons, soft cards, subtle depth **(Recommended)**
- 2) Neutral grayscale + single accent, minimal color
- 3) High-contrast dense data-grid style (compact tables, tight spacing)
- 4) Other (please specify): _______

**Answer**:

---

## Decisions Summary
<!-- User said "done" with all fields blank → accepted recommended option for every question. -->
- D3-1 Repo Structure: (1) Monorepo — `apps/web`, `apps/api`, shared `packages/`
- D3-2 Data Layer: (1) Phase 1 frontend + local `.json` mocks → Phase 2 Express+PostgreSQL behind a repository interface
- D3-3 DB Access: (1) `pg` driver + parameterized SQL + thin migration runner
- D3-4 Auth/Session: (1) Stateless JWT access token, `Authorization: Bearer`, RBAC claims in token
- D3-5 AI Adapter: (1) Adapter interface, deterministic rules/keyword mock default + optional Bedrock behind env flag
- D3-6 FE State/Data: (1) TanStack Query for server state + minimal local state
- D3-7 Testing: (1) Vitest (both) + Supertest (API) + React Testing Library (components)
- D3-8 Correctness: (1) Example-based unit tests for critical rules
- D3-9 Observability: (1) Minimal — structured logging (pino) + health endpoint
- D3-10 Error Tracking: (1) Log-based only, traceable error id
- D3-11 Health/Lifecycle: (2) Health + readiness + graceful shutdown
- D3-12 UI Direction: (1) Clean enterprise operations console — blue primary + P1–P4/semantic colors, Inter (OFL), Lucide icons, soft cards

**Validation**: no conflicts. Stack is internally consistent (TypeScript/JS ecosystem end-to-end), observability level matches workshop impact, lifecycle matches containerized runtime.
