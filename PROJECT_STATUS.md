# Project Status — AI-Assisted Incident Management (APP-03)

> รายงานภาพรวม workspace และสถานะโครงการ (profile status)
> อ้างอิงจาก source code จริงในโปรเจกต์ ณ วันที่ 17 สิงหาคม 2026

---

## 1. ข้อมูลโครงการ (Profile)

| หัวข้อ | รายละเอียด |
|---|---|
| ชื่อโครงการ | AI-Assisted Incident Management (APP-03) |
| Package | `incident-management` v1.0.0 (private) |
| ประเภท | Workshop-grade full-stack Incident Management system |
| Repository | https://github.com/tvi24/i24serviceweb |
| Branch หลัก | `main` (sync กับ `origin/main`) |
| Commit ล่าสุด | `7d598b2` chore: add combined dev script + refresh README |
| Workflow การพัฒนา | AI-DLC (mode: **comprehensive**, ไม่แบ่ง unit) |
| ภาษา spec | ไทย (manifest `language: th`) |

---

## 2. สถานะภาพรวม (Overall Status)

**สถานะ: implement ครบทุกกลุ่มงาน (Group 1–6) — 57 tests ผ่านทั้งหมด**

| Artifact | สถานะ |
|---|---|
| Requirements | approved (`requirements.md`, R1–R15) |
| Design | approved (`design.md` + 8 ไฟล์ย่อยใน `design/`) |
| Tasks | approved (`tasks.md`) |
| Implementation | approved — ครบ Group 1–6 |

**เสร็จสมบูรณ์และตรวจสอบแล้ว:**
- Frontend + mock data — ครบทุกหน้า, mock lifecycle ทำงานจริง
- Backend (in-memory) — verified end-to-end (HTTP จริง: health, JWT login, RBAC list, intake)
- ชุดทดสอบ 57 tests ผ่านหมด (shared 25, api 18, web 14)
- `npm run build` ที่ root สะอาด ไม่มี warning

**PostgreSQL layer — [LIVE-VERIFIED 2026-08-17]:**
- รัน live round-trip กับ PostgreSQL 17.6 จริงสำเร็จแล้ว (ใช้ portable PG ไม่ผ่าน Docker เพราะเครื่องนี้ไม่มี WSL2)
- `npm run migrate` → สร้างครบ 10 ตาราง · `npm run seed` → insert สำเร็จ (users 6, incidents 6, activities 5, alerts 3, audit 3)
- API รันโหมด `DATA_BACKEND=pg` → `/health` = `{db:ok}`, login (อ่าน users จาก pg), `/incidents` RBAC list = 6, intake เขียนลง pg สำเร็จ (`INC-2026-001007`, `ticket_seq` 1006→1007, audit 3→8)
- **บั๊กที่พบและแก้ (ก่อนหน้า pg path พังตอน `seed`):** migration `001_init.sql` เดิมประกาศคอลัมน์ id/`*_id` เป็น `uuid` แต่ id จริงของแอปเป็น string เช่น `u-emma`, `i-1001` → เปลี่ยนเป็น `text` แล้ว และยืนยันด้วยการ seed/round-trip จริงข้างต้น (in-memory เป็น JS ไม่ตรวจ type จึงไม่เจอตอนรัน 57 tests)

**Docker Compose — [LIVE-VERIFIED 2026-08-19]:**
- ติดตั้ง WSL2 (`wsl --install --no-distribution` + reboot) → Docker engine 29.7.2 (Linux) ใช้งานได้
- `docker compose up -d --build` → ครบ 3 services: postgres 18.6 (healthy), api (migrate→seed→start, backend=pg), web (nginx)
- Round-trip จริงบน container: web :8080 → 200, api :3001 `/health` = `{db:ok}`, login + RBAC list = 6, intake เขียนลง containerized Postgres สำเร็จ (`INC-2026-001007`)
- **บั๊กที่พบและแก้ (เห็นเฉพาะตอนรัน container):** postgres:18-alpine v18+ ต้อง mount volume ที่ `/var/lib/postgresql` ไม่ใช่ `/var/lib/postgresql/data` เดิม → container exit(1). แก้ใน `docker-compose.yml` แล้ว

---

## 3. Technology Stack

| ชั้น | เทคโนโลยี |
|---|---|
| โครงสร้าง | Monorepo (npm workspaces): `packages/shared`, `apps/api`, `apps/web` |
| Frontend | React 19 + Vite 6 + React Router 7 + TanStack Query 5 |
| Backend | Node.js 24 LTS + Express 5 + zod + pino |
| Data | PostgreSQL 18 (`pg` + parameterized SQL) หรือ in-memory backend |
| Auth | Local JWT (Bearer), scrypt password hashing, per-request RBAC |
| AI | rules/keyword adapter (default) + optional Bedrock adapter (env-gated) |
| Tests | Vitest + Supertest + React Testing Library |
| Deploy | Docker Compose (postgres + api + web) + Dockerfiles |

---

## 4. โครงสร้าง Workspace

```
packages/shared   # domain types, constants, pure logic, synthetic fixtures  (9 source files)
apps/api          # Express API: services, repositories memory|pg, migrations, seed  (33 source files)
apps/web          # React SPA: apiClient mock|http seam, pages, components  (23 source files)
docker-compose.yml
.kiro/specs/incident-management   # requirements / design / tasks
.aidlc/workflow/incident-management  # manifest, decisions, audit
```

**หน้าเว็บ (apps/web/src/pages):** Login, Intake, ControlTower, MyIncidents, IncidentWorkspace, AlertCenter, Dashboard, SlaConfig

**บริการฝั่ง API (apps/api/src/services):** aiAdapter, alertService, auditService, authService, configService, incidentService, kpiService, maintenanceService, slaService

**API routes:** auth, incidents, misc (+ asyncHandler)

---

## 5. ขอบเขตฟีเจอร์ (Requirements R1–R15)

| # | Requirement |
|---|---|
| R1 | Web Portal Incident Intake |
| R2 | Local Authentication and Role-Based Access (RBAC) |
| R3 | Classification, Priority, and Human Control |
| R4 | Assignment and Fallback Routing |
| R5 | Configurable SLA Tracking |
| R6 | Central Alert Center and Escalation |
| R7 | Incident Investigation and Status Management |
| R8 | Resolution, Confirmation, CSAT, Reopen, and Closure |
| R9 | Incident Analytics and KPI Dashboard |
| R10 | Auditability and Traceability (append-only) |
| R11 | External Channel Integration Boundaries |
| R12 | Security, Input Handling, and Safe Failure |
| R13 | Privacy and Workshop Data Minimization |
| R14 | Reliability, Observability, and Acceptance Evidence |
| R15 | Versioned Runtime and Deployment Readiness |

**Roles (RBAC):** Business User, Service Desk, Application Support, Infrastructure Support, Manager, Management

**SLA defaults:** P1 15m/4h · P2 30m/8h · P3 4h/3bd · P4 8h/5bd (แก้ไขได้ผ่าน config)

---

## 6. ความคืบหน้าตามกลุ่มงาน (Task Groups)

| Group | ขอบเขต | สถานะ |
|---|---|---|
| 1 | Setup / Foundation | เสร็จ — verify gate ผ่าน |
| 2 | Core Frontend + Mock Data | เสร็จ — web 9/9, build สะอาด |
| 3 | Frontend + Backend / Database | เสร็จ (memory verified; pg code-complete, live DB pending Docker) |
| 4 | Extras / Refinements | เสร็จ — API 15/15 |
| 5 | Test / Verify | เสร็จ — 57 tests ผ่านหมด |
| 6 | Deploy (optional) | เสร็จ — **Docker Compose LIVE-VERIFIED** (3 services up, round-trip ผ่านบน :8080/:3001) |

---

## 7. วิธีรัน (Quick Start)

```bash
npm install

# Option A — local dev, ไม่ใช้ database (เร็วสุด)
npm run dev            # API :3001 + Web :5173 พร้อมกัน

# Option B — full stack + PostgreSQL (Docker)
cp .env.example .env   # ตั้งค่า JWT_SECRET
docker compose up -d --build
# web http://localhost:8080 · api http://localhost:3001/api/health
```

**Demo users** (workshop, ข้อมูลสังเคราะห์ทั้งหมด, รหัสผ่านร่วม `Passw0rd!`):
emma (Business User), sam (Service Desk), alex (Application Support), ivan (Infrastructure Support), mary (Manager), gary (Management)

**Test:** `npm run test` (57 tests)

---

## 8. หมายเหตุด้านความปลอดภัย / ความเป็นส่วนตัว

- Secrets (`JWT_SECRET`, DB creds, Bedrock key) อ่านจาก environment เท่านั้น — ไม่ commit ลง repo
- `apps/web/.env` (workshop Bedrock key) ถูก git-ignore และไม่มีใน git history
- ค่า `VITE_*` ถูก bundle เข้า client — ยอมรับได้เฉพาะบริบท demo/workshop; production ต้องเก็บ key ไว้ฝั่ง server
- ข้อมูลทั้งหมดเป็นข้อมูลสังเคราะห์ (synthetic) สอดคล้องหลัก PDPA data minimization
- ช่องทาง Mail / LINE OA / Phone เป็น integration boundary ที่ documented ไว้ ไม่ใช่ช่องทางจริงใน scope นี้

---

## 9. สิ่งที่ควรทำต่อ (Next Steps)

- รัน live verify ของ PostgreSQL path เมื่อมี Docker engine (`docker compose up -d --build` → ตรวจ `/api/health` + smoke login)
- Revoke / rotate Bedrock workshop API key หลังจบ workshop
- (ถ้าจะใช้งานจริง) ย้าย API key ไปฝั่ง backend + secret manager แทนการเปิดใน frontend
