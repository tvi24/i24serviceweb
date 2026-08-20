# Requirements Document

## Introduction

The Incident Management System is a greenfield workshop application for receiving, managing, resolving, and analyzing organizational IT incidents. The working delivery scope comprises Web Portal incident intake, local workshop authentication with predefined synthetic users, role-based incident operations, configurable priority and service-level tracking, an in-app Central Alert Center, user confirmation and satisfaction capture, audit history, and KPI dashboards.

Mail, LINE OA, Phone/Quick Call, and outbound external notification channels are future adapters represented only by documented integration boundaries. The workshop uses synthetic data and keeps authorized IT staff in control of classification, priority, assignment, resolution, and escalation decisions. The specification follows a comprehensive Quick Spec workflow without decomposition into incremental units.

## Glossary

- **Incident_Management_System**: The complete workshop application that provides incident intake, processing, tracking, resolution, reporting, and governance capabilities.
- **Web_Portal**: The delivered browser-based interface through which a Business User submits an Incident, tracks status, confirms resolution, reopens a Case, and submits CSAT.
- **Protected_API**: An application programming interface endpoint that requires an authenticated Synthetic_User and an authorized Role.
- **Local_Authentication_Service**: The workshop authentication capability that verifies predefined Synthetic_User credentials without an external identity provider.
- **Synthetic_User**: A fictional workshop identity that contains no real personal data and has one or more predefined Roles.
- **Role**: A named authorization profile: Business_User, Service_Desk, Application_Support, Infrastructure_Support, Manager, or Management.
- **RBAC**: Role-based access control that grants each Role only the operations and records required by the Role.
- **Business_User**: A Synthetic_User who reports Incidents, tracks submitted Incidents, confirms resolution, reopens eligible Cases, and submits CSAT.
- **Service_Desk**: A Role that reviews intake information, performs triage, and manually assigns fallback Incidents.
- **Application_Support**: A Role that investigates and resolves application-related Incidents.
- **Infrastructure_Support**: A Role that investigates and resolves infrastructure-related Incidents.
- **Manager**: A Role that supervises Incident operations, receives Escalations, and views SLA and KPI information.
- **Management**: A read-oriented Role that views organizational KPI dashboards.
- **Incident**: An IT event or problem that affects organizational operations.
- **Ticket**: The uniquely identified system record created for an Incident.
- **Ticket_ID**: The unique identifier assigned to a Ticket.
- **Case**: A Ticket throughout the managed Incident lifecycle.
- **Reporter**: The Business_User who submits an Incident.
- **Classification**: The organizational category assigned to an Incident.
- **Impact**: The organizational effect used with Urgency to determine Priority.
- **Urgency**: The time sensitivity used with Impact to determine Priority.
- **Priority**: The P1, P2, P3, or P4 service level determined from Impact and Urgency under workshop Business_Rules.
- **Business_Rules**: Editable organizational rules for Classification, Priority, Assignment, SLA, alerting, closure, and Escalation.
- **Support_Group**: The support team responsible for a category of Incident.
- **Assigned_Owner**: The authorized support user responsible for progressing a Case.
- **Fallback_Queue**: The Service_Desk queue used when Business_Rules cannot determine a Support_Group.
- **SLA**: The configured service-level targets for Incident response and resolution.
- **Response_SLA**: The configured time target for acknowledging or beginning work on an Incident.
- **Resolution_SLA**: The configured time target for resolving an Incident.
- **Business_Day**: An organizational working day used to measure P3 and P4 Resolution_SLA targets.
- **SLA_State**: The current service-level condition of a Case, including Within_Target, At_Risk, or Breached.
- **Central_Alert_Center**: The delivered in-app destination for Priority, SLA, status, and Escalation alerts.
- **Alert**: An in-app notice for a configured Priority event, SLA risk, SLA breach, status event, or Escalation.
- **Escalation**: The routing of an Incident to a higher support or management level according to Business_Rules.
- **Work_Note**: A timestamped record of support investigation or remediation activity.
- **Resolution_Code**: A required structured value describing how an Incident was resolved.
- **Resolution_Note**: A required textual description of the Incident resolution.
- **Active_Workflow**: The non-closed processing state to which a reopened Case returns.
- **CSAT**: A Reporter satisfaction rating from 1 through 5 submitted after resolution.
- **CSAT_Reminder**: A configured follow-up request for a Reporter who has not submitted CSAT.
- **KPI_Dashboard**: The interface that presents Incident counts, SLA results, aging, reopen results, recurring problems, trends, and CSAT results.
- **Aging**: The elapsed time since a Case was created while the Case remains open.
- **Audit_Event**: An append-only record of a security-relevant or business-relevant action with actor, action, target, and timestamp information.
- **AI_Assistance**: A classification and Priority recommendation produced through an optional Bedrock adapter or a rules/mock fallback and reviewed by authorized IT staff.
- **Integration_Boundary**: A documented contract for a future inbound or outbound channel without a working external channel implementation in the workshop scope.
- **Idempotency_Key**: A client-provided identifier used to recognize repeated submissions of the same intake request.
- **Duplicate_Criteria**: Configured comparison rules used to identify a submission that may describe an existing Incident.
- **Structured_Log**: A machine-readable application or error record that excludes credentials, secrets, and unnecessary personal data.
- **Health_Endpoint**: An endpoint that reports whether the deployed application can serve requests without exposing internal technical details.
- **Synthetic_Data**: Fictional, non-identifying information used for workshop development, testing, and demonstration.
- **API**: An application programming interface used by application clients to request operations or data.
- **KPI**: A key performance indicator calculated from stored Incident, SLA, reopen, aging, or CSAT data.
- **Bedrock**: The optional AWS model service that may provide AI_Assistance during the workshop.
- **OWASP_Top_10**: The Open Worldwide Application Security Project categories for prevalent web application security risks.
- **PDPA**: Thailand's Personal Data Protection Act B.E. 2562 and associated privacy obligations relevant to workshop data handling.
- **Critical_Test**: An acceptance test for intake, authentication, authorization, SLA state transition, Alert creation, resolution, reopen, closure, audit history, or KPI calculation.

## Requirements

### Requirement 1: Web Portal Incident Intake (FR-01, BR-01, EX-04, EX-05)

**User Story:** As a Business User, I want to submit an Incident through the Web Portal, so that I receive a traceable Ticket without manual ticket creation.

#### Acceptance Criteria

1. WHEN a Business_User submits all required Incident fields through the Web_Portal, THE Incident_Management_System SHALL create one Ticket with a unique Ticket_ID.
2. WHEN the Incident_Management_System creates a Ticket, THE Web_Portal SHALL present the Ticket_ID and submission confirmation to the Reporter.
3. IF a Web_Portal submission omits required Incident information, THEN THE Incident_Management_System SHALL identify the required information without creating a Ticket.
4. IF a submission repeats an Idempotency_Key associated with an existing Ticket, THEN THE Incident_Management_System SHALL return the existing Ticket_ID with a duplicate warning.
5. IF a submission matches Duplicate_Criteria without matching an Idempotency_Key, THEN THE Incident_Management_System SHALL present an existing-or-duplicate warning for review.
6. WHILE a Business_User views submitted Cases, THE Web_Portal SHALL limit Case visibility to Cases reported by the authenticated Business_User.

### Requirement 2: Local Authentication and Role-Based Access (NFR-02)

**User Story:** As a workshop administrator, I want local authentication and RBAC, so that predefined users access only authorized Incident functions and data.

#### Acceptance Criteria

1. THE Local_Authentication_Service SHALL authenticate only predefined Synthetic_Users without using an external identity provider.
2. WHEN a Synthetic_User submits valid credentials, THE Local_Authentication_Service SHALL establish an authenticated session associated with the Synthetic_User Roles.
3. IF submitted credentials are invalid, THEN THE Local_Authentication_Service SHALL return a generic authentication failure without identifying which credential failed.
4. WHEN a Protected_API request is received, THE Incident_Management_System SHALL verify the authenticated Synthetic_User before processing the request.
5. WHEN a Protected_API request is received, THE Incident_Management_System SHALL authorize the requested operation and target resource against the authenticated Synthetic_User Roles before processing the request.
6. IF a Synthetic_User lacks permission for a Protected_API operation or resource, THEN THE Incident_Management_System SHALL reject the request without disclosing protected resource content.
7. THE Incident_Management_System SHALL grant each Role only the Incident operations and records required by the Role responsibilities defined in this document.

### Requirement 3: Classification, Priority, and Human Control (FR-02)

**User Story:** As Service Desk staff, I want suggested Classification and Priority values that remain under staff control, so that triage effort decreases without transferring operational authority to automation.

#### Acceptance Criteria

1. WHEN a Ticket is created, THE Incident_Management_System SHALL derive a Classification recommendation from submitted Incident information and configured Business_Rules.
2. WHEN Impact and Urgency values are available, THE Incident_Management_System SHALL derive a P1, P2, P3, or P4 Priority recommendation from configured Business_Rules.
3. WHERE AI_Assistance is enabled, THE Incident_Management_System SHALL label AI-produced recommendations as recommendations requiring authorized IT staff review.
4. WHERE AI_Assistance is unavailable, THE Incident_Management_System SHALL produce Classification and Priority recommendations through the rules/mock fallback.
5. WHEN authorized IT staff confirms or overrides a Classification or Priority recommendation, THE Incident_Management_System SHALL store the authorized value as the Case value.
6. WHEN authorized IT staff overrides a recommendation, THE Incident_Management_System SHALL record the recommendation and override in Audit_Event records.

### Requirement 4: Assignment and Fallback Routing (FR-03, BR-02, EX-03)

**User Story:** As Service Desk staff, I want Cases routed to responsible support teams, so that each Case has clear ownership.

#### Acceptance Criteria

1. WHEN a Case has an authorized Classification, THE Incident_Management_System SHALL assign the Case to a Support_Group according to configured Business_Rules.
2. WHEN an authorized user assigns an Assigned_Owner, THE Incident_Management_System SHALL associate the Assigned_Owner with the Case.
3. IF Business_Rules cannot identify a Support_Group, THEN THE Incident_Management_System SHALL route the Case to the Fallback_Queue for manual assignment.
4. WHEN the Incident_Management_System routes a Case to the Fallback_Queue, THE Incident_Management_System SHALL record the fallback action in an Audit_Event.
5. WHEN an authorized user changes the Support_Group or Assigned_Owner, THE Incident_Management_System SHALL preserve the assignment change in Case history.

### Requirement 5: Configurable SLA Tracking (FR-03, FR-04, BR-03, EX-01)

**User Story:** As a Manager, I want configurable response and resolution targets tracked for every prioritized Case, so that SLA risk and breaches are visible.

#### Acceptance Criteria

1. THE Incident_Management_System SHALL provide editable workshop configuration for Response_SLA and Resolution_SLA targets by Priority.
2. THE Incident_Management_System SHALL initialize the P1 targets to a 15-minute Response_SLA and a 4-hour Resolution_SLA.
3. THE Incident_Management_System SHALL initialize the P2 targets to a 30-minute Response_SLA and an 8-hour Resolution_SLA.
4. THE Incident_Management_System SHALL initialize the P3 targets to a 4-hour Response_SLA and a 3-Business_Day Resolution_SLA.
5. THE Incident_Management_System SHALL initialize the P4 targets to an 8-hour Response_SLA and a 5-Business_Day Resolution_SLA.
6. WHILE a Case has an authorized Priority, WHEN the Case is assigned to a Support_Group, THE Incident_Management_System SHALL start Response_SLA and Resolution_SLA tracking.
7. WHILE a Case has active SLA tracking, THE Incident_Management_System SHALL evaluate elapsed time against the configured targets and thresholds.
8. WHEN a Case crosses a configured At_Risk threshold, THE Incident_Management_System SHALL set the applicable SLA_State to At_Risk.
9. WHEN a Case exceeds a configured SLA target, THE Incident_Management_System SHALL set the applicable SLA_State to Breached.
10. WHEN authorized workshop configuration changes an SLA target, THE Incident_Management_System SHALL retain the configuration change in an Audit_Event.

### Requirement 6: Central Alert Center and Escalation (FR-04, BR-05, NFR-04, EX-01)

**User Story:** As an Assigned Owner or Manager, I want actionable in-app alerts, so that Priority and SLA events receive attention according to organizational rules.

#### Acceptance Criteria

1. WHEN a Case meets the configured Urgent or High Priority alert criterion, THE Incident_Management_System SHALL create an Alert in the Central_Alert_Center.
2. WHEN an SLA_State changes to At_Risk, THE Incident_Management_System SHALL create an Alert for the Assigned_Owner and configured Manager recipients.
3. WHEN an SLA_State changes to Breached, THE Incident_Management_System SHALL create a breach Alert for the Assigned_Owner and configured Manager recipients.
4. WHEN Business_Rules trigger an Escalation, THE Incident_Management_System SHALL route the Case to the configured support or management level.
5. WHEN an Escalation occurs, THE Incident_Management_System SHALL create an Escalation Alert in the Central_Alert_Center.
6. WHEN a configured Case status event occurs, THE Incident_Management_System SHALL create a status Alert for the configured in-app recipients.
7. WHEN an authorized recipient acknowledges an Alert, THE Central_Alert_Center SHALL record the acknowledgement state and actor.
8. WHEN the Incident_Management_System creates an Alert, THE Incident_Management_System SHALL record the Alert as an Audit_Event and KPI event.

### Requirement 7: Incident Investigation and Status Management (FR-05)

**User Story:** As support staff, I want to record investigation work and status changes, so that authorized stakeholders can follow Case progress.

#### Acceptance Criteria

1. WHEN authorized support staff adds a Work_Note, THE Incident_Management_System SHALL append the Work_Note with author and timestamp information to the Case history.
2. WHEN authorized support staff performs a permitted status transition, THE Incident_Management_System SHALL update the Case status.
3. IF a requested status transition violates configured Business_Rules, THEN THE Incident_Management_System SHALL preserve the current status and return a non-technical validation message.
4. WHILE a Case is assigned to a Support_Group, THE Incident_Management_System SHALL display current assignment, status, Priority, SLA_State, and Work_Notes to authorized staff.
5. WHEN a Case status changes, THE Incident_Management_System SHALL record the prior status and new status in an Audit_Event.

### Requirement 8: Resolution, Confirmation, CSAT, Reopen, and Closure (FR-06, FR-07, BR-04, EX-02)

**User Story:** As a Reporter, I want to confirm a resolution, rate the service, or reopen an unresolved problem, so that the Case outcome reflects the actual result.

#### Acceptance Criteria

1. IF authorized support staff requests resolution without a Resolution_Code, THEN THE Incident_Management_System SHALL preserve the active Case status and request a Resolution_Code.
2. IF authorized support staff requests resolution without a Resolution_Note, THEN THE Incident_Management_System SHALL preserve the active Case status and request a Resolution_Note.
3. WHEN authorized support staff supplies a Resolution_Code and Resolution_Note, THE Incident_Management_System SHALL set the Case to Resolved.
4. WHEN a Case becomes Resolved, THE Incident_Management_System SHALL create an in-app confirmation and CSAT request for the Reporter.
5. WHEN the Reporter confirms the resolution, THE Incident_Management_System SHALL record the Reporter confirmation.
6. WHEN the Reporter submits a CSAT value, THE Incident_Management_System SHALL accept an integer rating from 1 through 5 for the resolved Case.
7. IF a submitted CSAT value is outside 1 through 5, THEN THE Incident_Management_System SHALL reject the rating with a validation message.
8. WHERE CSAT reminders are configured, WHILE a resolved Case has no CSAT response, WHEN a configured reminder point is reached, THE Incident_Management_System SHALL create a CSAT_Reminder for the Reporter until the configured reminder count is reached.
9. IF the Reporter requests a reopen without a reason, THEN THE Incident_Management_System SHALL preserve the resolved Case state and request a reopen reason.
10. WHEN the Reporter submits a reopen reason for an eligible resolved Case, THE Incident_Management_System SHALL return the Case to Active_Workflow with the reason recorded.
11. WHEN the Reporter confirms resolution and configured closure conditions are satisfied, THE Incident_Management_System SHALL close the Case.
12. WHEN configured closure conditions expire for a resolved Case, THE Incident_Management_System SHALL close the Case according to Business_Rules.
13. WHEN a Case is resolved, reopened, or closed, THE Incident_Management_System SHALL record the lifecycle action in an Audit_Event.

### Requirement 9: Incident Analytics and KPI Dashboard (FR-08)

**User Story:** As a Manager or Management user, I want Incident and service KPIs, so that operational performance and recurring issues are visible.

#### Acceptance Criteria

1. THE KPI_Dashboard SHALL present Incident counts grouped by Case status.
2. THE KPI_Dashboard SHALL present Incident counts grouped by Priority.
3. THE KPI_Dashboard SHALL present SLA compliance and breach results calculated from Case SLA records.
4. THE KPI_Dashboard SHALL present Aging results for open Cases.
5. THE KPI_Dashboard SHALL present Case reopen counts.
6. THE KPI_Dashboard SHALL present the average of recorded CSAT ratings.
7. THE KPI_Dashboard SHALL present recurring Incident results derived from stored Incident data.
8. THE KPI_Dashboard SHALL present Incident trend results derived from stored Incident data.
9. WHEN an authorized dashboard user selects available dashboard criteria, THE KPI_Dashboard SHALL refresh KPI results using matching stored records.
10. IF no stored records match selected dashboard criteria, THEN THE KPI_Dashboard SHALL present a no-data state without fabricating KPI values.

### Requirement 10: Auditability and Traceability (FR-09, NFR-02)

**User Story:** As an authorized auditor or Manager, I want append-only action history, so that Incident decisions and changes can be reconstructed.

#### Acceptance Criteria

1. WHEN a Ticket is created, THE Incident_Management_System SHALL append an Audit_Event for the creation action.
2. WHEN Incident data changes, THE Incident_Management_System SHALL append an Audit_Event that identifies the actor, action, target Case, and timestamp.
3. WHEN authentication, authorization, assignment, Alert, Escalation, resolution, reopen, closure, or SLA configuration actions occur, THE Incident_Management_System SHALL append corresponding Audit_Event records.
4. THE Incident_Management_System SHALL preserve Audit_Event records as append-only records accessible only to authorized Roles.
5. WHEN an authorized user views Case history, THE Incident_Management_System SHALL present applicable Audit_Event records in chronological order.
6. IF an unauthorized user requests Audit_Event records, THEN THE Incident_Management_System SHALL reject the request without disclosing Audit_Event content.

### Requirement 11: External Channel Integration Boundaries

**User Story:** As a future integration developer, I want documented channel boundaries, so that later adapters can connect without changing the workshop delivery scope.

#### Acceptance Criteria

1. THE Incident_Management_System SHALL document an Integration_Boundary for future Mail intake.
2. THE Incident_Management_System SHALL document an Integration_Boundary for future LINE OA intake.
3. THE Incident_Management_System SHALL document an Integration_Boundary for future Phone/Quick Call intake.
4. THE Incident_Management_System SHALL document an Integration_Boundary for future outbound external notifications.
5. THE Integration_Boundary SHALL identify required input data, validation outcomes, duplicate handling, authentication expectations, and response outcomes for each future adapter.
6. WHERE an external channel adapter is absent, THE Incident_Management_System SHALL keep Web_Portal intake and Central_Alert_Center operation independent of the absent adapter.

### Requirement 12: Security, Input Handling, and Safe Failure

**User Story:** As a system owner, I want security controls applied to application requests and data, so that workshop operations follow secure development expectations.

#### Acceptance Criteria

1. WHEN the Incident_Management_System receives input, THE Incident_Management_System SHALL validate data type, format, length, allowed values, and required fields before business processing.
2. WHEN the Incident_Management_System renders user-provided content, THE Incident_Management_System SHALL encode the content for the output context.
3. WHEN the Incident_Management_System accesses stored data, THE Incident_Management_System SHALL use data access controls that prevent injection through submitted input.
4. WHEN a state-changing authenticated request is received, THE Incident_Management_System SHALL verify request authenticity according to the selected local authentication mechanism.
5. IF application processing fails, THEN THE Incident_Management_System SHALL return a non-technical error response with a traceable error identifier.
6. IF application processing fails, THEN THE Incident_Management_System SHALL write a Structured_Log without credentials, secrets, authentication tokens, or unnecessary personal data.
7. THE Incident_Management_System SHALL obtain API keys, passwords, tokens, and encryption keys from environment configuration or an approved secret store.
8. THE Incident_Management_System SHALL protect data in transit with an encrypted transport protocol in deployed environments.
9. THE Local_Authentication_Service SHALL store passwords as salted one-way password hashes.
10. THE Incident_Management_System SHALL encrypt sensitive application data at rest.
11. THE Incident_Management_System SHALL address every OWASP_Top_10 category through a documented control or a documented non-applicability rationale.

### Requirement 13: Privacy and Workshop Data Minimization

**User Story:** As a workshop participant, I want synthetic and minimized data, so that development and demonstration align with PDPA privacy principles without requiring real personal data.

#### Acceptance Criteria

1. THE Incident_Management_System SHALL use Synthetic_Data for workshop development, testing, and demonstration.
2. THE Incident_Management_System SHALL collect only Incident, account, SLA, CSAT, and audit fields required by the requirements in this document.
3. WHEN a Structured_Log references a user or Case, THE Incident_Management_System SHALL use a non-sensitive identifier or masked value instead of unnecessary identifying content.
4. WHEN configured retention ends for application data, THE Incident_Management_System SHALL delete or anonymize the applicable data according to the configured retention rule.
5. WHEN an authorized user requests protected user-related data, THE Incident_Management_System SHALL limit the returned fields to the fields required for the authorized operation.

### Requirement 14: Reliability, Observability, and Acceptance Evidence (NFR-01, NFR-03, NFR-06)

**User Story:** As a workshop operator, I want traceable operations and deployment health evidence, so that working behavior and failures can be verified.

#### Acceptance Criteria

1. WHEN the Incident_Management_System accepts a valid Incident submission, THE Incident_Management_System SHALL persist the Ticket before returning the Ticket_ID.
2. IF Ticket persistence fails, THEN THE Incident_Management_System SHALL return an error response without presenting a successful Ticket creation result.
3. THE Incident_Management_System SHALL emit Structured_Logs for application operations and application errors.
4. THE Incident_Management_System SHALL expose a Health_Endpoint for deployed runtime checks.
5. WHEN the Health_Endpoint is requested, THE Incident_Management_System SHALL return service health without exposing credentials, secrets, internal stack traces, or protected Incident data.
6. THE Incident_Management_System SHALL provide at least one automated or scripted acceptance test mapped to each mandatory requirement in this document.
7. THE Incident_Management_System SHALL provide passing results for every Critical_Test before workshop delivery is accepted.

### Requirement 15: Versioned Runtime and Deployment Readiness (NFR-07)

**User Story:** As a workshop operator, I want reproducible local and deployed runtime assets, so that the application can be redeployed or rolled back from version-controlled definitions.

#### Acceptance Criteria

1. THE Incident_Management_System SHALL provide version-controlled application, database, infrastructure, and runtime configuration definitions without committed secret values.
2. THE Incident_Management_System SHALL support the workshop local runtime using containerized application services and PostgreSQL.
3. THE Incident_Management_System SHALL provide documented deployment steps for the workshop target environment.
4. THE Incident_Management_System SHALL provide documented redeployment steps for the workshop target environment.
5. THE Incident_Management_System SHALL provide documented rollback steps for the workshop target environment.
6. WHEN a deployed release starts, THE Incident_Management_System SHALL make runtime health available through the Health_Endpoint.

---

## Add-on

> Change requests approved after the initial spec was accepted. Implemented on top of the delivered scope; does not alter Requirements 1–15.

### Requirement 16: Theme Preference (Light / Dark) — Add-on

**User Story:** As any authenticated or unauthenticated user of the Web_Portal, I want to switch between a light and a dark visual theme, so that I can use the interface comfortably in different lighting conditions per common enterprise practice.

Rationale: user-requested enhancement (2026-08-17) following UX testing. Light remains the product default per the design-system policy.

#### Acceptance Criteria

1. THE Web_Portal SHALL provide a control that switches the interface between a light theme and a dark theme.
2. THE Web_Portal SHALL default to the light theme when no stored theme preference and no operating-system preference are available.
3. WHEN no stored theme preference exists, THE Web_Portal SHALL initialize the theme from the operating-system color-scheme preference (`prefers-color-scheme`).
4. WHEN a user selects a theme, THE Web_Portal SHALL persist the selected theme in browser local storage and apply it on subsequent visits.
5. THE Web_Portal SHALL expose the theme control on both the authenticated application shell and the login screen.
6. THE Web_Portal SHALL render both themes using the shared design tokens only, without hardcoded colors in components, and SHALL keep text/background contrast at WCAG 2.2 AA.
7. THE Web_Portal SHALL keep the theme control keyboard operable with a visible focus indicator and an accessible label reflecting the current state.

### Requirement 17: Interface Localization (Thai / English) — Add-on

**User Story:** As a user of the Web_Portal, I want the interface available in Thai and English, so that I can operate the system in my preferred language per common enterprise practice.

Rationale: user-requested enhancement (2026-08-17). Localization covers interface text only; user-entered Incident content is preserved as entered.

#### Acceptance Criteria

1. THE Web_Portal SHALL provide a control that switches the interface language between Thai and English.
2. THE Web_Portal SHALL translate interface labels, navigation, form fields, buttons, table headers, badges, and empty/loading/error state text for the selected language.
3. THE Web_Portal SHALL present localized display labels for enumerated values (Case status, Priority, SLA_State, Role) without changing stored enum values.
4. THE Web_Portal SHALL preserve user-entered content (Incident title, description, notes) in its original form regardless of the selected language.
5. WHEN no stored language preference exists, THE Web_Portal SHALL initialize the language from the browser language, defaulting to English when the browser language is neither Thai nor English.
6. WHEN a user selects a language, THE Web_Portal SHALL persist the selected language in browser local storage and apply it on subsequent visits.
7. THE Web_Portal SHALL expose the language control on both the authenticated application shell and the login screen.
8. IF a translation key is missing for the selected language, THEN THE Web_Portal SHALL fall back to the English string without exposing a raw key.

---

## Add-on — Product Refinement v3.0 (Enterprise Service Operations)

> Source: `product refinements/AI_Assisted_Enterprise_Service_Operations_Product_Refinement_v3.0_Kiro.md` (2026-08-19).
> Evolves the delivered MVP into an enterprise service-operations platform via incremental **P0-first** vertical slices; existing R1–R17 behavior is preserved. New enum/config values default so current data and the 57 tests keep passing. Full traceability recorded in `.aidlc/workflow/incident-management/phase0-assessment.md`.
> New glossary: **Organization/Business_Unit (BU)/Department** (configurable org hierarchy), **User_Profile** (avatar + contact + preferences), **User_Email** (WORK/PERSONAL/ALTERNATE identity, verifiable), **Permission/Support_Group_Member** (granular RBAC objects), **Platform_Administrator** (separate configuration-control role), **Service/Category/Subcategory** (catalog dimensions distinct from Channel), **SLA_Policy/SLA_Instance** (configurable policy engine), **Business_Calendar** (support hours/holidays/time zone), **Email_Message/Email_Thread/Email_Account** (real email channel), **AI_Recommendation** (per-suggestion record).

### Requirement 18: Organization / Business Unit Master (FR-10, BR-07)

**User Story:** As a Platform_Administrator, I want a configurable organization hierarchy, so that incidents and users carry business-unit context without hard-coded org rules.

#### Acceptance Criteria
1. THE Incident_Management_System SHALL support a configurable hierarchy of Group, Company, Business_Unit, Department, and Location, and SHALL NOT hard-code the example MGC tree.
2. THE Incident_Management_System SHALL associate each User with a Business_Unit (and optionally Department, Manager, Location).
3. WHEN an Incident is created, THE Incident_Management_System SHALL preserve the Requester_BU, and SHALL allow recording Affected_BU and Service_Owner_BU.
4. THE Incident_Management_System SHALL provide Platform_Administrator UI to create, edit, and deactivate organization entities using Synthetic_Data.
5. WHERE no Business_Unit applies, THE Incident_Management_System SHALL keep Incident operations functional with an unassigned/unset BU value that remains visible (never silently dropped).

### Requirement 19: User Profile, Avatar, and Email Identity (FR-11, FR-13, BR-06)

**User Story:** As a user, I want a profile with avatar and verifiable email identities, so that my organizational identity and notifications are accurate.

#### Acceptance Criteria
1. THE Incident_Management_System SHALL let a user maintain profile fields: display name, job title, avatar, organization email, optional personal/alternate email, mobile, preferred language, preferred notification channel, time zone.
2. THE Incident_Management_System SHALL support avatar upload/change/remove with file-type and size validation, and SHALL show initials as a fallback.
3. THE Incident_Management_System SHALL treat the verified organization email as the default primary identity.
4. WHERE a secondary email is added, THE Incident_Management_System SHALL support a verification state and SHALL prevent duplicate ownership of the same verified email unless policy allows.
5. THE Incident_Management_System SHALL protect personal email fields under RBAC (NFR-09) and SHALL NOT expose them to unauthorized roles.

### Requirement 20: Roles, Permissions, and Support Groups (FR-12)

**User Story:** As a Platform_Administrator, I want role/permission/support-group administration, so that access is least-privilege and configurable.

#### Acceptance Criteria
1. THE Incident_Management_System SHALL model Role, Permission, User↔Role, Support_Group, and Support_Group_Member as administrable objects.
2. THE Incident_Management_System SHALL introduce a Platform_Administrator role that is separate from Incident Manager by default and controls organization, users, roles, services, SLA, email, and audit configuration.
3. THE Incident_Management_System SHALL enforce permissions for page/navigation visibility and for configuration actions in addition to existing role checks, without weakening current R2 RBAC.
4. WHEN an unauthorized user requests an administration operation, THE Incident_Management_System SHALL reject it without disclosing protected content.

### Requirement 21: Configurable SLA Policy Engine and Business Calendar (FR-17, FR-18, BR-08)

**User Story:** As a Manager/Platform_Administrator, I want SLA policies resolved from configurable conditions with business-calendar-aware clocks, so that targets reflect BU, service, and priority.

#### Acceptance Criteria
1. THE Incident_Management_System SHALL support SLA_Policy records with conditions (Business_Unit, Service, Priority, Request_Type), Response_Target, Resolution_Target, Business_Calendar, warning threshold, escalation threshold, and effective dates.
2. WHEN a Case starts SLA tracking, THE Incident_Management_System SHALL create an SLA_Instance from the applicable SLA_Policy resolved by configured precedence.
3. WHERE no specific SLA_Policy matches, THE Incident_Management_System SHALL fall back to the existing default configuration so current SLA behavior is preserved.
4. THE Incident_Management_System SHALL support Business_Calendar configuration for support hours, 24x7, weekends, public holidays, and time zone, and SHALL apply it to SLA clock computation.
5. THE SLA_Instance SHALL expose Not_Started, Running, Paused, At_Risk, Met, Breached, and Cancelled states and SHALL record response/resolution due and met times.
6. THE Incident_Management_System SHALL retain SLA_Policy and Business_Calendar changes as Audit_Events.

### Requirement 22: Canonical Priority with Governed Override (FR-02 refined, BR-11)

**User Story:** As Service_Desk staff, I want auto-calculated P1–P4 priority with a governed override, so that prioritization is consistent and accountable.

#### Acceptance Criteria
1. THE Incident_Management_System SHALL auto-calculate Priority as P1–P4 from Impact×Urgency using the configurable Priority_Matrix by default.
2. WHEN authorized staff overrides the calculated Priority, THE Incident_Management_System SHALL require a mandatory override reason and SHALL record the reason, actor, timestamp, prior value, and new value in an Audit_Event.
3. THE Incident_Management_System SHALL make the Priority_Matrix editable by the Platform_Administrator.

### Requirement 23: Incident Channel / Service / Category Model (FR refinement, BR-07)

**User Story:** As support staff, I want channel, service, category, and subcategory as distinct fields, so that incidents are classified along real service dimensions.

#### Acceptance Criteria
1. THE Incident_Management_System SHALL record Channel (Web, Email, LINE, Phone, Monitoring) separately from Service, Category, and Subcategory.
2. THE Incident_Management_System SHALL provide a configurable Service catalog and Category/Subcategory values.
3. THE Incident_Management_System SHALL keep these fields optional so existing incidents remain valid, and SHALL keep unset values visible in lists and analytics.

### Requirement 24: End-to-End Email Ticketing (FR-14, FR-15, FR-16, BR-09)

**User Story:** As a Business_User, I want to raise and continue an incident by email, so that email is a real operational channel.

#### Acceptance Criteria
1. THE Incident_Management_System SHALL implement email via an adapter architecture and SHALL NOT hard-code a single provider, and SHALL NOT store email secrets in source.
2. WHEN an inbound email is received from a matchable verified user, THE Incident_Management_System SHALL create an Incident (Channel=Email), determine Requester_BU, apply classification/priority/SLA, and send an acknowledgement containing Incident ID, title, status, priority, and SLA summary.
3. WHEN a user replies to a ticket email that can be reliably matched to an existing Incident, THE Incident_Management_System SHALL append the message to that Incident timeline rather than creating a new Incident.
4. THE Incident_Management_System SHALL let an agent send an Internal Note or a Public Reply, and Public Reply SHALL email the requester, preserve the thread reference, and record delivery state and the message in the timeline.
5. THE Incident_Management_System SHALL track Email_Message attributes (message id, thread id, incident id, direction, from/to/cc, subject, timestamp, delivery/processing/error state, attachment metadata) and SHALL provide a Platform_Administrator Email_Account console with test-connection/send-test.
6. WHERE the external email provider is unavailable, THE Incident_Management_System SHALL remain operational (safe local/mock adapter) and SHALL record integration errors.

### Requirement 25: AI Triage Recommendation Record (FR-23 refined)

**User Story:** As support staff, I want AI triage suggestions I can accept/review/dismiss with a governed record, so that AI stays assistive and auditable.

#### Acceptance Criteria
1. THE Incident_Management_System SHALL present AI triage suggestions (service, category, impact, urgency, recommended priority, suggested support group) as recommendations requiring human confirmation.
2. FOR every AI suggestion, THE Incident_Management_System SHALL record suggested value, confidence, model/rule source, human decision (accepted/rejected/overridden), reviewer, and timestamp.
3. WHERE external AI is unavailable, THE Incident_Management_System SHALL use the rules/mock classifier and remain operational.

### Requirement 26: Interactive SLA & BU Analytics (FR-19, FR-20, FR-22, BR-10, NFR-08)

**User Story:** As a Manager/Executive, I want interactive dashboards traceable to source incidents, so that operational and BU performance are trustworthy.

#### Acceptance Criteria
1. THE KPI_Dashboard SHALL support Overall, By-BU, By-Service, By-Priority, and By-Support-Group views with time filters (7D/30D/QTD/YTD).
2. FOR each KPI, THE KPI_Dashboard SHALL expose numerator, denominator, filter context, time range, and last-refresh time.
3. WHEN a KPI card, segment, or chart element is selected, THE KPI_Dashboard SHALL drill through to the matching source Incident list where permission allows.
4. THE KPI_Dashboard SHALL keep Unset/Untriaged records visible in totals and SHALL NOT silently exclude them.
5. THE KPI_Dashboard SHALL present MTTA, MTTR, Re-open rate, CSAT, SLA compliance %, and P1/P2/breached/at-risk counts, calculated from authoritative Incident records.

### Requirement 27: Role-Based Workspaces and Navigation (FR-21, FR refinement)

**User Story:** As each role, I want a workspace tailored to my responsibilities, so that daily work is efficient.

#### Acceptance Criteria
1. THE Web_Portal SHALL render role-based navigation generated from the authenticated user's permissions.
2. THE Web_Portal SHALL provide Business_User "My Requests" (with a My-SLA summary: within %, at-risk, breached), Service_Desk "Incident Queues", Resolver "My Work", Manager "Operations Control Tower", Executive "Executive Dashboard", and Platform_Administrator administration workspaces.
3. THE Incident Workspace SHALL present a sticky incident header (priority, status, SLA state, response/resolution timers), a main work area, and a role-sensitive context panel, keeping fields editable only for permitted roles.
4. THE Web_Portal SHALL localize all new interface strings (TH/EN) and meet accessibility expectations (R16, R17, NFR-11).

### New Business Rules (v3.0)
- **BR-06..BR-13** as defined in the refinement spec are adopted; BR-11 (mandatory priority-override reason) and BR-08 (SLA precedence with default fallback) are reflected in R21/R22 above.

### New Non-Functional Requirements (v3.0)
- **NFR-08 Performance:** main workspace and search/filter target < 2s under normal demo load; dashboards show loading + last-refreshed state.
- **NFR-09..NFR-13** (Security, Localization, Accessibility, Observability incl. email/SLA/integration health, Data integrity) extend R12/R16/R17/R14 to all new features.

### Delivery Priority
P0 items (Refinement §22) are implemented first as vertical slices (see `phase0-assessment.md` §E); P1/P2 items are deferred until P0 has acceptance evidence.
