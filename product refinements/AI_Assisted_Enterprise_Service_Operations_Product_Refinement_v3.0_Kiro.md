# Product Refinement Specification
## AI-Assisted Enterprise Service Operations Platform
### Incident Management × Multi-BU SLA × Email Ticketing × Role-Based Workspace × Kiro AIDLC

**Document Version:** v1.0 Product Refinement Baseline  
**Date:** 2026-08-19  
**Status:** Ready for Kiro Refinement / Build Iteration  
**Source Baseline:** APP-03 — AI-Assisted Incident Management  
**Target:** Enterprise-grade Product Prototype for UAT / Workshop / Progressive Production Hardening

---

# 1. Purpose

เอกสารฉบับนี้ใช้เป็น **Product Refinement Baseline** สำหรับให้ Kiro พัฒนาต่อจากระบบ Incident Management ที่สามารถรันบน Localhost ได้แล้ว

เป้าหมายไม่ใช่การรื้อระบบเดิมและสร้างใหม่ทั้งหมด แต่ให้ดำเนินการแบบ **incremental refinement** โดย:

1. Preserve working functions and existing code where valid.
2. Refactor only where the current architecture blocks the target design.
3. Upgrade UX/UI from a workshop demo into a professional enterprise service-management workspace.
4. Expand the current Incident Management MVP into a multi-BU service operations platform.
5. Preserve Human-in-the-loop controls for AI-assisted functions.
6. Keep requirements testable, traceable, and deployable through the Kiro AIDLC workflow.

---

# 2. Product Vision

## 2.1 Target Product

**AI-Assisted Enterprise Service Operations Platform**

A role-based service operations platform for MGC Group that enables business users, Service Desk, resolver teams, IT managers, and executives to manage incidents end-to-end with configurable SLA, email ticketing, organizational visibility, AI assistance, auditability, and interactive operational analytics.

## 2.2 Target Business Outcome

The product shall support:

- Faster incident intake and acknowledgement
- Consistent triage and prioritization
- Reduced manual routing and follow-up
- End-to-end SLA traceability
- Multi-BU service performance visibility
- Clear ownership and escalation
- Real email-based incident communication
- Better employee experience
- Better Service Desk / Resolver productivity
- Management-level operational transparency
- Auditable AI-assisted decision support

---

# 3. Product Refinement Principles

Kiro SHALL follow these principles throughout the refinement:

1. **Do not rebuild from scratch unless technically necessary.**
2. **Preserve currently working UAT functions.**
3. Refactor toward a modular architecture.
4. Use one canonical data model for Priority, SLA, Status, Organization, User, Service, and Communication.
5. Avoid hard-coded MGC business-unit rules where configuration is possible.
6. All KPI metrics must be traceable to source incidents.
7. All AI recommendations must remain reviewable by authorized human users.
8. All security-sensitive actions must be auditable.
9. All core UI must support TH/EN.
10. Design for professional daily use, not only workshop demonstration.
11. Create automated or scripted acceptance evidence for every MUST requirement.
12. Implement in vertical slices and keep the application runnable after each iteration.

---

# 4. Target Operating Model

The application shall provide **5 Operational Experiences + 1 Platform Administration Role**.

| Role | Primary Workspace | Primary Responsibility |
|---|---|---|
| Business User / Employee | My Requests | Report, track, reply, confirm resolution, re-open, CSAT |
| Service Desk | Incident Queues | Intake, triage, classify, prioritize, assign, monitor SLA |
| Resolver / Support Engineer | My Work | Diagnose, collaborate, work notes, resolve |
| Incident / IT Manager | Operations Control Tower | Escalation, workload, P1/P2, SLA risk, operational control |
| Executive / GM | Executive Dashboard | SLA, service performance, BU comparison, trends, business impact |

## 4.1 Platform Administrator

Platform Administrator is a separate control role and SHALL NOT be combined with Incident Manager by default.

Responsibilities:

- Organization / BU Master
- User / Role / Permission
- Support Groups
- Services
- Assignment Rules
- Priority Matrix
- SLA Policies
- Business Calendars
- Email Accounts
- Notification Templates
- System Configuration
- Audit Review
- Integration Health

---

# 5. Target Navigation Architecture

Role-based navigation must be dynamically generated according to permission.

```text
HOME

WORK
- My Requests
- My Work
- Incident Queues
- Unassigned
- SLA At Risk
- SLA Breached
- Major Incidents

SERVICE
- All Incidents
- Services
- Knowledge

ANALYTICS
- Operations Dashboard
- SLA & Performance
- BU Performance
- Recurring Incidents
- Executive Dashboard

PLATFORM ADMINISTRATION
- Organization
- Users
- Roles & Permissions
- Support Groups
- Services
- Assignment Rules
- Priority Matrix
- SLA Policies
- Business Calendars
- Email Accounts
- Notification Templates
- Audit Trail
- Integration Health
```

---

# 6. Organization Master

The system SHALL support configurable organizational hierarchy.

Minimum entities:

- Group
- Company
- Business Unit (BU)
- Department
- Cost Center (optional)
- Location
- Manager hierarchy

Example configuration:

```text
MGC Group
├─ MCR
├─ MAG
├─ MGC
└─ XPENG
```

The hierarchy SHALL be configurable and SHALL NOT be hard-coded to the example above.

Each user must be associated with:

- Group
- Company / BU
- Department
- Manager
- Location
- Cost Center (optional)

Each Incident must preserve:

- Requester BU
- Affected BU
- Service Owner BU
- Support Group

---

# 7. Master User, Profile, Role & Permission

## 7.1 User Master

Required fields:

- User ID
- Employee ID
- First Name
- Last Name
- Display Name
- Job Title
- Company / BU
- Department
- Manager
- Location
- Preferred Language
- Time Zone
- Account Status
- Created Date
- Updated Date
- Last Login

## 7.2 User Profile

The user SHALL be able to maintain:

- Avatar / Profile Picture
- Organization Email
- Personal Email
- Alternate Email
- Mobile Number
- Preferred notification channel
- Preferred language

Avatar requirements:

- Upload / change / remove
- Show initials as fallback
- Validate file type and size
- Preserve access control

## 7.3 User Email Identity

```text
UserEmail
- email_id
- user_id
- email_address
- email_type: WORK | PERSONAL | ALTERNATE
- is_primary
- is_verified
- verified_at
- active
```

Business rules:

- Organization email should be the default primary identity.
- Personal / alternate email is optional.
- Secondary email must support verification.
- The system must prevent duplicate ownership of the same verified email unless explicitly allowed by policy.
- Notification eligibility must be configurable per email identity.

## 7.4 Role-Based Access Control

Minimum control objects:

- Role
- Permission
- UserRole
- SupportGroup
- SupportGroupMember

RBAC must control page visibility, navigation visibility, field access, edit/read-only behavior, user administration, SLA configuration, email configuration, dashboard scope, and audit access.

---

# 8. Email Ticketing — End-to-End

Email SHALL be a real operational incident channel, not only a notification function.

## 8.1 Inbound Email Flow

```text
Business User
    ↓
Support Mailbox
    ↓
Inbound Email Adapter
    ↓
Validate Sender
    ↓
Match User / Organization / BU
    ↓
Detect New Request / Reply / Duplicate
    ↓
Parse Subject / Body / Attachment
    ↓
Create or Update Incident
    ↓
Apply Classification / Priority
    ↓
Apply SLA
    ↓
Acknowledgement
```

## 8.2 New Ticket from Email

The system SHALL:

1. Receive inbound email.
2. Capture sender, recipients, subject, body, attachment, timestamp.
3. Match sender with a verified user email.
4. Create a unique Incident ID.
5. Determine Requester BU.
6. Run classification / routing rules.
7. Calculate priority.
8. Start applicable SLA.
9. Send acknowledgement.
10. Record all steps in Timeline and Audit Log.

Acknowledgement SHOULD contain Incident ID, title, status, priority, SLA summary, portal link, and support contact information.

## 8.3 Reply-to-Ticket

When the user replies:

- Associate the message with the existing Incident.
- Do not create a new Incident if the thread can be reliably matched.
- Add the message to the Incident timeline.
- Capture attachments according to security policy.
- Notify the assigned team.

## 8.4 Agent Reply

Agent shall be able to choose:

- Internal Note
- Public Reply

Public Reply SHALL send email to requester, preserve thread reference, record delivery state, and record the message in the Incident timeline.

## 8.5 Email Tracking

Minimum EmailMessage attributes:

- Message ID
- Thread ID
- Incident ID
- Direction: INBOUND / OUTBOUND
- From
- To
- CC
- Subject
- Timestamp
- Delivery State
- Processing State
- Error State
- Attachment metadata

## 8.6 Email Configuration Console

Platform Admin shall be able to configure:

- Account Name
- Email Address
- Display Name
- Provider
- Direction: Inbound / Outbound / Both
- Authentication Type
- Connection Status
- Last Inbound
- Last Outbound
- Test Connection
- Send Test Email

Architecture SHALL use an Email Adapter pattern. Supported adapters may include Microsoft 365 / Microsoft Graph, AWS SES, and SMTP/IMAP compatible providers. Secrets SHALL NOT be stored in source code.

---

# 9. Incident Data Model Refinement

Separate Channel, Service, Category, and Subcategory.

```text
Channel
- Web
- Email
- LINE
- Phone
- Monitoring / Integration

Service
- Microsoft 365
- Rental Platform
- Dealer System
- Network
- ERP

Category
- Email
- Access
- Application
- Infrastructure
- Network

Subcategory
- Performance
- Authentication
- Connectivity
```

Incident core fields SHALL include:

- Incident ID
- Title
- Description
- Reporter
- Requester BU
- Affected BU
- Service Owner BU
- Channel
- Service
- Category
- Subcategory
- Impact
- Urgency
- Priority
- Status
- Support Group
- Assignee
- Response SLA
- Resolution SLA
- SLA State
- Created At
- Updated At
- Resolved At
- Closed At
- Resolution Code
- Resolution Note
- Re-open Reason

---

# 10. Priority Model

Replace mixed High/Medium/Low with one canonical P1–P4 model.

```text
Impact × Urgency → Priority P1/P2/P3/P4
```

Priority SHALL be auto-calculated by default.

Manual override requires:

- Authorized role
- Mandatory override reason
- Timestamp
- User identity
- Audit event

Priority Matrix SHALL be configurable by Platform Admin.

---

# 11. Enterprise SLA Engine

SLA SHALL be implemented as a configurable policy engine.

## 11.1 SLA Policy

```text
SLAPolicy
- Policy ID
- Policy Name
- Applies To BU
- Service
- Priority
- Request Type
- Response Target
- Resolution Target
- Business Calendar
- Support Hours
- Time Zone
- Warning Threshold
- Escalation Threshold
- Effective From
- Effective To
- Status
```

## 11.2 SLA Instance

Each applicable Incident SHALL create an SLA instance containing:

- SLA Policy ID
- Started At
- Response Due At
- Resolution Due At
- Response Met At
- Resolution Met At
- Pause Duration
- SLA State
- Breach At
- Escalation State

## 11.3 SLA States

- Not Started
- Running
- Paused
- At Risk
- Met
- Breached
- Cancelled

## 11.4 SLA UI

Incident Header shall display Priority, Response SLA timer, Resolution SLA timer, and At Risk/Breached status.

Example:

```text
P1 Critical
Response SLA: Met in 12m
Resolution SLA: 01:42 remaining
SLA State: At Risk
```

---

# 12. Business Calendar

SLA calculation must support:

- Business hours
- 24x7
- Weekends
- Public holidays
- Time zone
- BU-specific calendar
- Service-specific calendar

Calendar configuration must be versioned and auditable.

---

# 13. Role-Based UX Target

## 13.1 Business User — My Requests

Primary functions:

- Report a problem
- View My Requests
- View status
- View SLA status
- Reply
- Upload attachment
- Confirm resolution
- Re-open
- Submit CSAT

My SLA summary:

- Within SLA %
- At Risk count
- Breached count

## 13.2 Service Desk — Incident Queues

Required queues:

- My Queue
- Untriaged
- Unassigned
- P1
- P2
- SLA At Risk
- SLA Breached
- Awaiting Customer
- Reopened
- Closed Today

Recommended columns:

- Ticket
- Summary
- Service
- Priority
- Status
- SLA
- Assignee
- Reporter
- Requester BU
- Age
- Updated

Primary actions: Triage, Assign, Reassign, Change priority, Add note, Reply, Escalate.

## 13.3 Resolver / Support Engineer — My Work

Focus on diagnosis and resolution.

Components:

- Incident context
- Business impact
- Affected service
- Activity timeline
- Internal notes
- Customer replies
- Attachments
- Similar incidents
- Knowledge suggestions
- Related incidents
- Resolution Code
- Resolution Note

## 13.4 Incident / IT Manager — Operations Control Tower

Required views:

- Active P1
- Active P2
- SLA At Risk
- SLA Breached
- Unassigned
- Support Group workload
- BU comparison
- Service health
- Major incidents
- Escalations

Interactive drill-down is mandatory.

## 13.5 Executive / GM — Executive Dashboard

Primary KPIs:

- SLA Compliance %
- Active Incidents
- P1 / P2 count
- SLA Breached
- At Risk
- MTTA
- MTTR
- Re-open Rate
- CSAT
- Major Incident count

Views:

- Overall MGC Group
- By BU
- By Service
- By Priority
- By Support Group
- Trend 7D / 30D / QTD / YTD

Executive KPI cards SHALL allow drill-down to source incidents where permission allows.

---

# 14. Interactive SLA & BU Dashboard

Dashboard must support Overall MGC Group, BU comparison, Service drill-down, Priority, SLA At Risk, SLA Breached, MTTA, MTTR, Re-open, CSAT, and time filters.

Each metric shall be clickable.

Examples:

- Click BU → BU Dashboard
- Click Breached → filtered queue
- Click P1 → P1 incidents
- Click Service → service incidents
- Click SLA % → SLA population and denominator

Every KPI SHALL expose:

- Numerator
- Denominator
- Filter context
- Time range
- Last refresh time

Example:

```text
SLA Compliance
94.6%
358 / 378 eligible incidents
Updated: 13:30
```

Untriaged / Unset data must remain visible and must not silently disappear from charts.

---

# 15. AI-Assisted Experience

AI SHALL assist but SHALL NOT silently make irreversible business decisions.

## 15.1 AI Triage Panel

```text
AI Triage Suggestion

Service: Microsoft 365        92%
Category: Email               90%
Impact: Medium                86%
Urgency: Medium               81%
Recommended Priority: P3

Suggested Support Group:
Application Support

Similar Incidents: 3
Recommended Knowledge: 2

[Accept All] [Review] [Dismiss]
```

## 15.2 AI Governance

For every AI suggestion, record:

- Suggested value
- Confidence
- Model / rule source
- Accepted / rejected / overridden
- Human reviewer
- Timestamp

Fallback:

- If external AI is unavailable, use rules/mock classifier.
- Application must remain operational.

---

# 16. Incident Workspace UX

Target desktop workspace:

```text
INC-2026-001007  Docker stack verify
P2 High | In Progress | SLA At Risk
Service: Container Platform
Requester BU: MCR

Response SLA: Met
Resolution SLA: 01:42 remaining

-----------------------------------------------------

Overview | Activity | Related | SLA | Audit

MAIN WORKSPACE                  CONTEXT PANEL

Description                     Assignee
Reporter                        Support Group
Business Impact                 Impact
Attachments                     Urgency
Affected Service                Priority
                                SLA clocks
Activity Timeline               AI Assist
                                Similar Incidents
[Internal Note]                 Knowledge
[Reply Customer]

-----------------------------------------------------

[Resolve] [Escalate] [Reassign]
```

Design goal:

- Higher information density
- Clear task hierarchy
- Reduced empty space
- Sticky incident header
- Fast actions
- Consistent status badges
- Role-sensitive editable fields
- Professional daily-use experience

---

# 17. UX/UI Design System

Target design direction:

**Jira-like operational density + ServiceNow-like workspace clarity + modern enterprise visual discipline**

Do not copy proprietary vendor UI directly.

- Default: Light professional workspace
- Optional: Dark theme
- Enterprise blue primary
- Neutral slate/gray surfaces
- Semantic colors for risk/state
- P1 Critical Red
- P2 Amber
- P3 Gold/Yellow
- P4 Neutral/Slate
- SLA At Risk Amber
- SLA Breached Red
- SLA Met Green
- Recommended typography: Inter + Noto Sans Thai
- 8px spacing system
- compact data tables
- 40–44px controls
- consistent iconography
- one primary CTA per context
- sticky toolbar/header where useful
- responsive right-side context panel
- WCAG-conscious contrast
- TH/EN string consistency

---

# 18. Functional Requirement Refinement

Existing FR-01 to FR-09 remain applicable but shall be reconciled to this specification.

Required corrections:

- FR-02: Replace High/Medium/Low with canonical P1–P4.
- FR-03/FR-04: Use configurable SLA Engine.
- FR-08: Dashboard must support interactive drill-down, BU view, denominator visibility, and source traceability.
- FR-09: Audit must include user, role, before/after values, channel, timestamp, and event metadata.

## New Functional Requirements

| ID | Requirement |
|---|---|
| FR-10 | Organization / Company / BU Master |
| FR-11 | User & Profile Master including Avatar |
| FR-12 | Role / Permission / Support Group Administration |
| FR-13 | Multiple Email Identity & Verification |
| FR-14 | Email Account & Notification Configuration |
| FR-15 | End-to-End Inbound Email Ticket Creation |
| FR-16 | Email Reply / Thread / Delivery Tracking |
| FR-17 | Configurable SLA Policy Engine |
| FR-18 | Business Calendar & SLA Clock |
| FR-19 | Interactive SLA Dashboard |
| FR-20 | Group / BU / Service Drill-down Analytics |
| FR-21 | Business User My Requests & My SLA |
| FR-22 | Executive Service Performance Dashboard |
| FR-23 | AI Triage Suggestion & Human Confirmation |
| FR-24 | Notification Center |
| FR-25 | Global Search |
| FR-26 | Saved Views / Filters |
| FR-27 | Integration Health Console |

---

# 19. Business Rules Refinement

- **BR-06 User Identity:** Verified organization email is the default primary identity. Secondary email must support verification.
- **BR-07 Organization Mapping:** Each Incident shall preserve Requester BU, Affected BU, Service Owner BU, and Support Group.
- **BR-08 SLA Precedence:** Applicable SLA shall resolve from configurable conditions such as BU + Service + Priority + Request Type + Business Calendar.
- **BR-09 Email Thread Matching:** Reply email must update the existing Incident when a reliable ticket/thread reference exists.
- **BR-10 KPI Traceability:** Every KPI must support traceability to underlying incidents.
- **BR-11 Priority Override:** Manual priority override requires authorized permission and mandatory reason.
- **BR-12 Resolution:** Resolution requires Resolution Code and Resolution Note.
- **BR-13 Re-open:** Re-open requires reason and returns the case to an active workflow.

---

# 20. Non-Functional Requirements Refinement

## NFR-08 Performance

- Main workspace target response < 2 seconds under normal demo load.
- Search/filter target response < 2 seconds under normal demo load.
- Dashboard must show loading and last-refreshed state.

## NFR-09 Security

- RBAC
- Least privilege
- No secrets in source
- Input validation
- Safe attachment handling
- Audit privileged actions
- Protect personal email fields
- Session timeout / logout

## NFR-10 Localization

- Full TH/EN UI strings
- No accidental mixed-language labels
- Locale-aware date/time
- Translation keys instead of hard-coded strings

## NFR-11 Accessibility

- Keyboard-accessible primary actions
- Visible focus states
- Sufficient contrast
- Semantic labels
- State must not rely on color alone

## NFR-12 Observability

- Structured application logs
- Error logs
- Audit logs
- Health endpoint
- Email integration health
- SLA engine health
- Integration error visibility

## NFR-13 Data Integrity

- Idempotent ticket creation where applicable
- No silent duplicates
- SLA events consistent with Incident state
- KPI values calculated from authoritative records

---

# 21. Recommended Data Entities

```text
Organization
BusinessUnit
Department
User
UserProfile
UserEmail
Role
Permission
UserRole
SupportGroup
SupportGroupMember
Service
ServiceOwnership
Incident
IncidentActivity
IncidentParticipant
Attachment
PriorityMatrix
SLAPolicy
SLAInstance
BusinessCalendar
EmailAccount
EmailMessage
EmailThread
EmailTemplate
Notification
AIRecommendation
AuditEvent
IntegrationHealth
```

Kiro should normalize entities and preserve migration compatibility with the existing PostgreSQL schema where practical.

---

# 22. Delivery Priority

## P0 — Required Before Final Professional UAT

1. Organization / BU Master
2. User / Profile / Avatar
3. Role / Permission / Support Groups
4. P1–P4 canonical priority
5. Impact × Urgency auto-calculation
6. Configurable SLA engine
7. Response / Resolution SLA timers
8. At Risk / Breached states
9. Role-based navigation
10. Incident activity timeline
11. Assignment / Status / Resolution workflow
12. Closure / Re-open
13. CSAT
14. KPI denominator / data trust
15. Channel / Service / Category separation
16. TH/EN normalization
17. Interactive BU/SLA dashboard
18. Email configuration
19. Inbound email ticket creation
20. Acknowledgement email
21. Reply-to-ticket tracking

## P1 — Professional Product Prototype

- Agent queues
- Global search
- Quick preview drawer
- Bulk actions
- AI triage suggestions
- Similar incidents
- Knowledge recommendations
- Notification Center
- Saved filters
- Manager workload dashboard
- Email delivery/error monitor

## P2 — Enterprise Evolution

- Major Incident Management
- War Room / Swarming
- On-call schedule
- Problem Management
- Change linkage
- CMDB / service dependency
- Monitoring / AIOps intake
- Production omnichannel connectors
- Post-Incident Review

---

# 23. Kiro AIDLC Deliverables

Kiro SHALL maintain explicit:

**Requirements → Design → Tasks → Build → Test → Evidence**

Required design documentation:

- Target architecture
- Component boundaries
- Database changes
- Email adapter design
- SLA engine design
- RBAC design
- Dashboard aggregation design
- AI adapter design
- Localization design
- Security considerations

Implementation tasks must be small enough to review, dependency-sequenced, runnable after each iteration, and include tests/evidence.

---

# 24. Definition of Done

A feature is not DONE only because the UI exists.

Each P0 feature requires:

1. Requirement implemented
2. UI complete
3. API complete
4. Persistence complete
5. RBAC validated
6. TH/EN validated
7. Acceptance test passed
8. Error path tested
9. Audit evidence available
10. No regression of existing P0 functions
11. Demo data available
12. Documentation updated

---

# 25. UAT Acceptance Scenarios

### Scenario A — Business User Web Ticket
Business User creates Incident → receives Ticket ID → sees SLA → Service Desk triages → Resolver works → User confirms → CSAT → Close.

### Scenario B — Email Ticket
Verified employee sends email → Incident created → acknowledgement delivered → SLA starts → Agent replies → User replies → same Incident thread updated → Resolver resolves → closure email sent.

### Scenario C — Multi-BU SLA
Create incidents from MCR, MAG, MGC, XPENG synthetic users → applicable SLA selected → dashboard shows Overall and BU breakdown → metric drill-down returns correct incidents.

### Scenario D — Priority & Override
Impact/Urgency calculates P1–P4 → authorized user overrides → reason mandatory → audit event recorded.

### Scenario E — SLA Breach
Incident runs past warning threshold → At Risk → alert → breach → escalation → dashboard updated.

### Scenario F — RBAC
Business User cannot administer users. Resolver cannot change SLA policy. Manager can view operational dashboards. Executive sees read-only aggregated dashboard. Platform Admin configures organization, users, roles, email, and SLA.

---

# 26. Kiro Vibe Coding Control — Master Instruction

```text
You are refining an existing AI-Assisted Incident Management application.
The application already runs locally and has working login, incident list,
incident detail, role-based behavior, TH/EN switching, and dashboard functions.

YOUR OBJECTIVE:
Evolve the current system into Product Refinement Specification v3.0
without unnecessarily rebuilding the application from scratch.

OPERATING MODE:
- Inspect the existing repository first.
- Reuse working code and components where technically sound.
- Refactor only when the current implementation blocks the target architecture.
- Work in small vertical slices.
- Keep the application runnable after every completed slice.
- Do not implement all features in one uncontrolled pass.
- Do not silently change working business behavior.
- Do not invent MGC production policies, credentials, users, SLA values, or BU data.
- Use synthetic/demo data where real data is not provided.
- Flag assumptions clearly.
- Ask for a decision only when a business rule cannot be safely derived from this specification.

SOURCE OF TRUTH:
1. Product Refinement Specification v3.0
2. Existing APP-03 requirements
3. Existing codebase and database
4. Current UAT behavior

PRIORITY:
Implement P0 first.
Do not start P1/P2 until P0 has traceable acceptance evidence.

AIDLC:
Maintain explicit Requirements -> Design -> Tasks -> Build -> Test -> Evidence traceability.

UX:
Target a professional enterprise service-operations workspace:
- mature ITSM operational density
- clear role-based workspaces
- consistent TH/EN
- interactive dashboards
- visible SLA state
- minimal wasted screen space
- fast task execution
Do not copy Jira or ServiceNow UI directly.

DATA:
Create a canonical data model for:
Organization, BU, User, UserEmail, Role, Permission, SupportGroup,
Service, Incident, Priority, SLA, Email, Notification, AIRecommendation, Audit.

SECURITY:
Apply least privilege.
Do not store secrets in source code.
Protect personal email data.
Audit privileged and configuration changes.

AI:
AI is assistive.
Human-in-the-loop remains mandatory for controlled decisions.
Every AI suggestion must record suggestion, confidence, source,
human decision, and audit event.

EMAIL:
Implement via an adapter architecture.
Support real inbound ticket creation, acknowledgement, reply-to-ticket,
public reply, thread tracking, delivery/error state, and audit timeline.
Do not hard-code to one provider.

SLA:
Implement configurable SLA Policy + SLA Instance + Business Calendar.
Priority uses Impact x Urgency -> P1/P2/P3/P4.
Show response and resolution timers in the operational UI.

DASHBOARD:
All KPI cards and charts must be interactive.
Support Overall -> BU -> Service -> Incident drill-down.
Expose numerator, denominator, filters, time range, and last refresh.
Never hide Unset/Untriaged data from KPI totals.

IMPLEMENTATION SEQUENCE:
1. Repository assessment and gap report
2. Data model reconciliation
3. Organization + User + Role foundation
4. Priority + SLA engine
5. Incident workspace refinement
6. Role-based navigation/workspaces
7. Email adapter and E2E email flow
8. Interactive SLA / BU dashboards
9. AI-assist UX
10. Hardening, automated tests, audit and UAT evidence

FOR EACH ITERATION:
Before coding:
- state requirement IDs
- explain affected components
- identify schema/API changes
- identify regression risk

After coding:
- list files changed
- run relevant tests
- report test results
- provide manual UAT steps
- state remaining gaps
- do not claim complete if acceptance criteria are not proven

DEFINITION OF DONE:
A UI screenshot alone is not sufficient.
A P0 feature is complete only when UI, API, persistence, permissions,
validation, error handling, auditability, TH/EN, and acceptance evidence pass.

START NOW WITH:
Phase 0 — inspect the current repository and produce:
A. Current Architecture Snapshot
B. Requirement-to-Implementation Gap Matrix
C. Reusable vs Refactor vs New Component Matrix
D. Database Migration Impact
E. Recommended P0 implementation plan
F. Risks / assumptions / decisions required

Do not modify behavior until the Phase 0 assessment is complete.
```

---

# 27. Recommended Short Vibe Commands

## Vibe 01 — Foundation

```text
Implement only the approved P0 foundation slice:
Organization/BU Master + User/Profile/Avatar + UserEmail + Role/Permission +
Support Group.

Preserve existing login and UAT demo users.
Add migration-safe schema changes.
Add Platform Administration UI.
Add TH/EN.
Add RBAC tests.
Do not begin SLA or Email yet.

Return evidence and remaining gaps before moving on.
```

## Vibe 02 — Priority & SLA

```text
Implement canonical Impact x Urgency -> P1-P4 and the configurable SLA Engine.

Include:
Priority Matrix
SLA Policy
SLA Instance
Business Calendar
Response SLA
Resolution SLA
At Risk
Breached
Manual override with mandatory reason
Audit trail

Integrate with Incident Detail and Queues.
Do not hard-code SLA policy as MGC production truth.
Use configurable demo values only.
```

## Vibe 03 — Email E2E

```text
Implement the Email Adapter vertical slice end-to-end.

Required evidence:
Inbound email -> verified user match -> Incident creation ->
acknowledgement -> Incident timeline -> agent public reply ->
user reply -> same Incident update -> delivery/error state -> audit.

Keep provider integration abstracted.
Use safe local/mock adapter first if real credentials are unavailable.
Do not block the app when the external email provider is unavailable.
```

## Vibe 04 — Professional UX

```text
Refine the existing UX without a full rewrite.

Target:
role-based workspace
compact enterprise layout
Incident Queues
My Work
Operations Control Tower
Executive Dashboard
sticky Incident header
visible SLA timers
activity timeline
context panel
quick actions
professional TH/EN
light default + optional dark theme

Preserve working functions and routes unless a documented migration is required.
```

## Vibe 05 — Dashboard & BU Analytics

```text
Implement interactive service-performance analytics.

Required:
Overall MGC Group
BU comparison
Service drill-down
Priority
SLA At Risk
SLA Breached
MTTA
MTTR
Re-open
CSAT
time filters
click-through to source incidents
numerator/denominator
last refresh

Requester BU and Service Owner BU must be separately filterable.
Validate KPI totals against source Incident records.
```

---

# 28. Final Product Refinement Decision

The current localhost application is a valid Incident Management MVP and should be progressively refined, not discarded.

Target state:

**AI-Assisted Enterprise Service Operations Platform**

with:

- Multi-BU organization awareness
- Enterprise user / profile / role administration
- End-to-end email incident communication
- Configurable SLA engine
- Interactive SLA and BU dashboards
- Professional role-based UX
- Traceable AI assistance
- Enterprise auditability
- Progressive AIDLC delivery

**Recommendation: Proceed using incremental P0-first refinement.**

Do not attempt all enterprise functions in one pass.  
Do not rewrite the current codebase unless Phase 0 proves that a component cannot safely support the target architecture.  
Every implementation increment must preserve testability, traceability, and UAT evidence.
