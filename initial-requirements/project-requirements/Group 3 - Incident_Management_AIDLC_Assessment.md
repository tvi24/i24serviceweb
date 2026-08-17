# AIDLC Workshop Training Assessment by MSC

## AI-Assisted Incident Management

## INTRODUCTION APP / USECASE

| Field | Value |
|---|---|
| App ID: | APP-03 |
| App / Usecase Name: | AI-Assisted Incident Management |
| Usecase Type: (Greenfield/Brownfield) | Greenfield |

**Usecase Type NOTE:**

Greenfield workshop preparation.
- Kiro IDE / Kiro CLI ready
- Git repository available
- Docker Desktop + Node.js 24 LTS + PostgreSQL 18 ready
- AWS workshop/sandbox account and required IAM access confirmed
- Synthetic incident/user dataset prepared
- Bedrock access optional; rules/mock classifier is the fallback

**Related Systems:** Mail, LINE , Web Portal, Executive Dashboard

**Systems Scope:**

ระบบบริหารจัดการ Incident สำหรับองค์กร ครอบคลุมการรับแจ้งปัญหาหลายช่องทาง (Omnichannel Incident Intake), การสร้าง Ticket อัตโนมัติ (Auto Ticket Creation), การจัดประเภทและกำหนดระดับความสำคัญตามหลักเกณฑ์ขององค์กร (Classification & Priority), การมอบหมายงาน (Assignment), การติดตาม SLA แบบ Real-time, การแจ้งเตือนตาม Priority และ SLA และการ Escalation ตามหลักเกณฑ์ที่กำหนด, การสนับสนุนการแก้ไขปัญหา (Support & Troubleshooting), การยืนยันผลจาก User, การประเมินความพึงพอใจ (CSAT), การ Re-open Case, การปิด Case, การวิเคราะห์ Incident และ KPI Dashboard รวมถึง Audit Logging และ AI-Assisted Automation เพื่อช่วยลดงาน Manual ในการรับแจ้ง สร้าง Ticket อัปเดตสถานะ ติดตาม และแจ้งเตือน

**Definitions:**

Incident = เหตุการณ์หรือปัญหาที่ส่งผลกระทบต่อการดำเนินงานของระบบ IT; Priority = ระดับความสำคัญของ Incident ที่พิจารณาจากความเร่งด่วน (Urgency) และผลกระทบ (Impact); SLA = ระยะเวลามาตรฐานที่กำหนดสำหรับการตอบรับและแก้ไข Incident; Escalation = การยกระดับ Incident ไปยังผู้รับผิดชอบหรือระดับสนับสนุนที่สูงขึ้นเมื่อมีความเสี่ยงหรือผลกระทบเพิ่มขึ้น; CSAT = คะแนนความพึงพอใจของผู้ใช้งานหลังได้รับการแก้ไขปัญหา

## OVERVIEW DESCRIPTION

**Product Perspective:**

An enterprise Incident Management platform designed to support IT staff in managing incidents, with automation and AI-assisted capabilities to streamline incident intake, ticket creation, status updates, SLA monitoring, notifications, and follow-up activities. Incident classification, prioritization, assignment, resolution, and escalation remain under the control of authorized IT staff according to defined business rules and organizational policies.

**User Classes:**

- **Business User / Employee** – แจ้งปัญหา ติดตามสถานะ ยืนยันผล และประเมิน CSAT
- **Service Desk** – รับเรื่อง ตรวจสอบ และ Triage Incident
- **Application Support** – วิเคราะห์และแก้ไขปัญหาด้าน Application
- **IT / Infrastructure Support** – วิเคราะห์และแก้ไขปัญหาด้าน Infrastructure
- **Application / IT Manager** – ควบคุมงานและรับ Escalation, ติดตาม SLA, KPI และภาพรวมการดำเนินงาน
- **Management (e.g. GM)** – ดูภาพรวมและผลการดำเนินงานผ่าน Dashboard

**Assumptions & Constraints:**

- ระบบจะทำงานตาม Business Rules และ Policy ขององค์กร สำหรับ Classification, Priority, Assignment, SLA และ Escalation
- IT Staff เป็นผู้ควบคุมและตัดสินใจ ในการบริหาร Incident
- AI ใช้เพื่อช่วย Automation และลดงาน Manual เช่น การรับแจ้ง การสร้าง Ticket การอัปเดตสถานะ การติดตามและประเมินสถานะ SLA การแจ้งเตือน และการติดตาม CSAT
- ข้อมูลที่จำเป็นสำหรับ Incident, SLA และ CSAT ต้องสามารถจัดเก็บและเรียกใช้สำหรับการติดตาม Case และ KPI Reporting

## TECH STACK

| Layer | Detail |
|---|---|
| **FRONTEND:** | React + Vite — สำหรับ Business User Portal, Service Desk Console, Incident Workspace และ KPI View |
| **BACKEND:** | Node.js 24 LTS + Express.js REST API; Kiro Feature Spec (Requirements/Design/Tasks); AI Adapter สำหรับ Bedrock หรือ Rules/Mock Fallback |
| **DATABASE:** | PostgreSQL 18 — จัดเก็บ Incident, Activity, SLA, CSAT และ AuditEvent แบบ Append-only; ใช้ Docker Compose สำหรับ Local Workshop Runtime |
| **Infrastructure:** | ใช้ Docker Desktop ในเครื่อง; Deploy แบบ Container บน AWS + Managed PostgreSQL + CloudWatch Logs/Health Evidence; IaC ผ่าน CloudFormation/CDK หรือมาตรฐานของ Trainer |
| **Policies:** | RBAC / Least-Privilege Access; แยก Secrets ออกจาก Source Code; Lab ใช้เฉพาะ Synthetic Data; Human-in-the-loop AI Control; ตรวจสอบย้อนหลังได้; ห้ามเก็บ Credentials ใน Repository; มีขั้นตอน Redeploy/Rollback ที่จัดทำเป็นเอกสาร |

## FUNCTIONAL REQUIREMENTS (FR)

| FR# | Topic | Function Name | Function Detail | Note |
|---|---|---|---|---|
| FR-01 | รับแจ้งปัญหา | รับแจ้งและเปิด Ticket อัตโนมัติ | ระบบรองรับการรับแจ้งปัญหาจาก Email, LINE OA, Phone/Quick Call และ Web Portal และสามารถสร้าง Ticket ID พร้อมบันทึกข้อมูล Incident และส่งข้อความยืนยันให้ User อัตโนมัติ | Omnichannel / Auto Ticket Creation |
| FR-02 | คัดกรอง | จัดประเภทและกำหนดระดับความสำคัญ | ระบบสามารถจัดประเภท Incident และกำหนด Priority (High/Medium/Low) ตาม Business Rules และข้อมูลที่ได้รับ เพื่อให้เจ้าหน้าที่ตรวจสอบและดำเนินการต่อ | Classification / Priority |
| FR-03 | มอบหมายและ SLA | มอบหมายงานและเริ่มติดตาม SLA | ระบบสามารถมอบหมาย Incident ให้ทีม/ผู้รับผิดชอบตามหลักเกณฑ์ที่กำหนด และเริ่ม Response SLA และ Resolution SLA โดยอัตโนมัติ | Assignment / SLA Tracking |
| FR-04 | SLA และ Escalation | ติดตามและประเมินสถานะ SLA | ระบบติดตาม SLA แบบ Real-time และสร้าง Alert เมื่อ Incident มี Priority ระดับ Urgent / High, มีความเสี่ยงหลุด SLA หรือเกิด SLA Breach โดยส่ง Alert ไปยัง Central Notification / Alert Center เพื่อแจ้งผู้รับผิดชอบหรือผู้เกี่ยวข้องผ่านช่องทางที่กำหนด และดำเนินการ Escalation ตาม Business Rules | SLA Monitoring / Alert / Escalation |
| FR-05 | แก้ไขปัญหา | สนับสนุนการแก้ไขและติดตามปัญหา | ระบบรองรับการบันทึกการดำเนินการแก้ไขปัญหา การอัปเดตสถานะ และข้อมูลที่เกี่ยวข้องกับการแก้ไข เพื่อให้ผู้เกี่ยวข้องสามารถติดตามความคืบหน้าได้ | Support & Troubleshooting |
| FR-06 | ยืนยันผลและ CSAT | ยืนยันผลและประเมินความพึงพอใจ | เมื่อแก้ไขปัญหาแล้ว ระบบแจ้ง User เพื่อยืนยันผลและประเมินความพึงพอใจ หากยังไม่ได้ประเมินสามารถส่ง Reminder ได้ และรองรับการ Re-open เมื่อปัญหายังไม่จบ | User Confirmation / CSAT / Re-open |
| FR-07 | ปิด Case | ปิด Case | ระบบสามารถปิด Incident ตามเงื่อนไขที่กำหนดหลังจาก User ยืนยันผลหรือครบเงื่อนไขการปิด Case | Case Closure |
| FR-08 | Analytics | วิเคราะห์ Incident และ KPI | ระบบรวบรวมข้อมูล Incident เพื่อแสดง SLA Compliance, CSAT, Aging, Re-open, ปัญหาที่เกิดซ้ำ และแนวโน้มผ่าน KPI Dashboard | Incident & KPI Analytics |
| FR-09 | Governance | บันทึกและตรวจสอบย้อนหลัง | ระบบบันทึกประวัติการเปิด Ticket การเปลี่ยนแปลงข้อมูล การอัปเดตสถานะ การ Assignment การ Escalation และการปิด Case เพื่อให้สามารถตรวจสอบย้อนหลังได้ | Audit Logging |

## NON-FUNCTIONAL REQUIREMENTS (NFR)

| NFR# | Topic | Function Name | Function Detail | Note |
|---|---|---|---|---|
| NFR-01 | ประสิทธิภาพและ SLA | การตอบสนองและติดตาม SLA | ระบบต้องสามารถสร้าง Ticket อัปเดตสถานะ และติดตาม Response/Resolution SLA ได้อย่างต่อเนื่อง เพื่อช่วยลดการติดตามงานด้วยตนเอง | SLA Tracking |
| NFR-02 | ความปลอดภัยและการตรวจสอบ | ควบคุมสิทธิ์และตรวจสอบย้อนหลัง | ระบบต้องกำหนดสิทธิ์การใช้งานตามบทบาท และบันทึกประวัติการเปิด Ticket การอัปเดตข้อมูล การเปลี่ยนสถานะ การ Assignment การแจ้งเตือน และการดำเนินการต่าง ๆ เพื่อให้สามารถตรวจสอบย้อนหลังได้ | Access Control / Audit Log |
| NFR-03 | ความน่าเชื่อถือ | ความถูกต้องและความต่อเนื่องของระบบ | ระบบต้องรองรับการรับแจ้ง Incident และการติดตาม Case ได้อย่างต่อเนื่อง พร้อมลดความเสี่ยงจากข้อมูลสูญหายหรือ Ticket ตกหล่น | Case Traceability |
| NFR-04 | การแจ้งเตือน | การแจ้งเตือนสถานะ, Priority และ SLA | ระบบต้องสามารถแจ้งเตือน User และเจ้าหน้าที่เมื่อมีการเปลี่ยนสถานะ, Incident มี Priority ระดับ Urgent / High, SLA ใกล้หมด, SLA Breach หรือเกิด Escalation ผ่านช่องทางที่กำหนด | Notification / Escalation |
| NFR-05 | การประเมินความพึงพอใจ | การติดตาม CSAT | ระบบต้องสามารถส่งคำขอประเมินหลังการแก้ไขปัญหา ติดตามกรณีที่ยังไม่ได้ประเมิน และบันทึกผลการประเมินเพื่อใช้ในการวิเคราะห์ KPI | CSAT Tracking |
| NFR-06 | การสังเกตการณ์ระบบและความสามารถในการทดสอบ | Logs, Health และ Acceptance Evidence | แอปพลิเคชันที่ Deploy แล้วต้องส่ง Structured App/Error Logs, Audit Events และมี Health Endpoint; ทุก Must Requirement ต้องมี Automated หรือ Scripted Acceptance Test อย่างน้อย 1 รายการ และ Critical Tests ต้องผ่าน | CloudWatch/Logs + Traceability Evidence |
| NFR-07 | ความพร้อมในการ Deploy | Infrastructure ภายใต้ Version Control และ Rollback | Infrastructure/Configuration ต้องอยู่ภายใต้ Version Control และการ Deploy สำหรับ Workshop ต้องมีขั้นตอน Redeploy/Rollback ที่จัดทำเป็นเอกสาร | Repository + Runbook + Deploy Evidence |

## EXCEPTION CASES

| EX# | Topic | Function Name | Function Detail | Note |
|---|---|---|---|---|
| EX-01 | SLA | Case เข้าสถานะ At Risk / Breached | เมื่อผ่าน SLA Threshold ที่กำหนด ให้แจ้ง Assigned Owner/Manager อัปเดต SLA State และบันทึก Alert/Breach เป็น Audit/KPI Event | สามารถกำหนด Threshold ได้ |
| EX-02 | CSAT | User ไม่ประเมินหรือ Re-open Case | หาก User ยังไม่ประเมิน ระบบส่ง Reminder ตามจำนวนครั้งที่กำหนด และหาก User กด Re-open ระบบส่ง Case กลับไปยัง Support พร้อมเหตุผล | ไม่ปิด Case จนกว่าจะดำเนินการและยืนยันผล |
| EX-03 | Assignment | ไม่พบ Support Group ที่ตรงเงื่อนไข | หาก Routing Rules ไม่สามารถระบุ Support Group ได้ ให้ส่ง Ticket ไปยัง Service Desk Fallback Queue เพื่อ Manual Assignment และบันทึก Action ดังกล่าว | Manual Assignment/Manual Fallback |
| EX-04 | Incident Intake | ข้อมูลแจ้งปัญหาไม่ครบถ้วน | หากข้อมูลที่ได้รับไม่เพียงพอต่อการสร้างหรือดำเนินการ Case ระบบขอข้อมูลเพิ่มเติมจาก User ก่อนดำเนินการต่อ | Request Additional Information |
| EX-05 | Ticket Creation | การ Submit ซ้ำ / Duplicate | หากมีการส่ง Request ซ้ำด้วย Idempotency Key เดียวกันหรือเข้า Duplicate Criteria ระบบต้องป้องกันการสร้าง Ticket ซ้ำโดยไม่แจ้ง และตอบกลับด้วย Existing/Duplicate Warning | Duplicate Case Check |

## BUSSINESS RULE

| BR# | Topic | Function Name | Function Detail | Note |
|---|---|---|---|---|
| BR-01 | Ticket | การสร้างและติดตาม Case | ทุก Incident ที่ได้รับแจ้งต้องถูกสร้างเป็น Ticket และมีข้อมูลที่จำเป็นสำหรับการติดตามและดำเนินการแก้ไข | Auto Ticket Creation |
| BR-02 | Assignment | การมอบหมาย Case | Case ต้องถูกมอบหมายให้ทีม/ผู้รับผิดชอบตามประเภทปัญหา Application และหลักเกณฑ์การรับผิดชอบที่กำหนด | Assignment Rule |
| BR-03 | Priority และ SLA | นโยบาย Priority P1–P4 และ SLA | Priority ได้จาก Impact × Urgency ภายใต้สมมติฐานของ Workshop โดย Response/Resolution Targets เป็นค่าที่กำหนดผ่าน Configuration; ตัวอย่าง Target ได้แก่ P1 15 นาที/4 ชม., P2 30 นาที/8 ชม., P3 4 ชม./3 วันทำการ, P4 8 ชม./5 วันทำการ | SLA / Escalation |
| BR-04 | Resolution / Closure | ควบคุม Resolution และ Re-open | การ Resolve ต้องระบุ Resolution Code + Resolution Note; Ticket ที่ Resolved แล้วสามารถ Close ได้หลัง Reporter ยืนยัน; หาก Reporter ทำการ Re-open ต้องบังคับระบุเหตุผล และ Case ต้องกลับเข้าสู่ Active Workflow | Closure / Re-open |
| BR-05 | Notification | การแจ้งเตือนตาม Priority | เมื่อ Incident มี Priority ระดับ Urgent / High ระบบต้องสร้าง Alert และส่งไปยัง Central Notification / Alert Center เพื่อแจ้งผู้รับผิดชอบหรือผู้เกี่ยวข้องผ่านช่องทางที่กำหนด | Priority-based Alert |

## UI DESIGN

| PAGE | PICTURE |
|---|---|
| Incident Intake & Ticket | หน้าจอแจ้ง Incident, รับ Ticket ID และติดตามสถานะ; Workshop ใช้เฉพาะ Web Intake |
| Incident Control Tower | หน้าดู Incident ทั้งหมด ติดตามสถานะและ SLA |
| Incident Management | หน้าจัดการ Assignment, SLA State, Work Notes, Status และ Resolution ภายใต้ RBAC พร้อม Audit History |
| User Confirmation & CSAT | หน้าจอยืนยันการแก้ไข Re-open พร้อมเหตุผล และให้คะแนน CSAT 1–5 |
| Incident & KPI Dashboard | หน้าจอแสดงจำนวนตาม Status/Priority, SLA Compliance/Breach, Aging, จำนวน Re-open และค่าเฉลี่ย CSAT พร้อม Demo Evidence |
