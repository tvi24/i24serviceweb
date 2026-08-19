// English dictionary (source of truth for keys). th.ts must provide the same keys.
export const en = {
  // Common
  'common.loadFailed': 'Failed to load.',
  'common.failed': 'Failed.',
  'common.dash': '—',
  'common.na': 'N/A',
  'common.noData': 'No data',
  'error.title': 'Something went wrong',

  // App shell / nav
  'brand.name': 'Incident Management',
  'nav.reportIncident': 'Report Incident',
  'nav.myIncidents': 'My Incidents',
  'nav.controlTower': 'Control Tower',
  'nav.dashboard': 'Dashboard',
  'nav.slaConfig': 'SLA Config',
  'shell.toggleNav': 'Toggle navigation',
  'shell.alertCenter': 'Alert center, {count} unread',
  'shell.signOut': 'Sign out',
  'shell.theme.toLight': 'Switch to light theme',
  'shell.theme.toDark': 'Switch to dark theme',
  'shell.lang.label': 'Language',

  // Access / not found
  'access.deniedTitle': 'Access denied',
  'access.deniedMsg': 'You do not have permission to view this page.',
  'notFound.title': 'Not found',
  'notFound.msg': 'This page does not exist.',

  // Login
  'login.subtitle': 'Sign in to continue',
  'login.username': 'Username',
  'login.password': 'Password',
  'login.signIn': 'Sign in',
  'login.signingIn': 'Signing in…',
  'login.failed': 'Login failed.',
  'login.demoHint': 'Workshop demo users (password: {password})',

  // Intake
  'intake.title': 'Report an Incident',
  'intake.subtitle': 'Describe the problem. A ticket ID will be created for tracking.',
  'intake.titleLabel': 'Title',
  'intake.descLabel': 'Description',
  'intake.descHint': 'Include what happened, when, and how many people are affected.',
  'intake.impact': 'Impact (optional)',
  'intake.urgency': 'Urgency (optional)',
  'intake.autoDetect': 'Auto-detect',
  'intake.submit': 'Submit incident',
  'intake.submitting': 'Submitting…',
  'intake.submitFailed': 'Submission failed.',
  'intake.successTitle': 'Incident submitted',
  'intake.successBody': 'Your ticket has been created and is now traceable.',
  'intake.ticketId': 'Ticket ID:',
  'intake.reportAnother': 'Report another',
  'intake.viewMine': 'View my incidents',

  // My incidents
  'my.title': 'My Incidents',
  'my.subtitle': 'Incidents you have reported. Click a row to view details, confirm, or reopen.',
  'my.emptyTitle': 'No incidents yet',
  'my.emptyMsg': 'Report your first incident to get started.',

  // Control tower
  'ct.title': 'Incident Control Tower',
  'ct.subtitle': 'All incidents with live status and priority.',
  'ct.allStatuses': 'All statuses',
  'ct.allPriorities': 'All priorities',
  'ct.filterStatus': 'Filter by status',
  'ct.filterPriority': 'Filter by priority',
  'ct.noMatchTitle': 'No incidents match',
  'ct.noMatchMsg': 'Try adjusting the filters.',
  'ct.loadFailed': 'Failed to load incidents.',

  // Incident table
  'table.ticket': 'Ticket',
  'table.title': 'Title',
  'table.priority': 'Priority',
  'table.status': 'Status',
  'table.group': 'Group',
  'table.created': 'Created',

  // Badges / SLA states
  'badge.unset': 'Unset',
  'badge.noSla': 'No SLA',
  'sla.within_target': 'On track',
  'sla.at_risk': 'At risk',
  'sla.breached': 'Breached',

  // Workspace
  'ws.notFound': 'Incident not found.',
  'ws.description': 'Description',
  'ws.reporter': 'Reporter: {name}',
  'ws.owner': 'Owner: {name}',
  'ws.classification': 'Classification: {value}',
  'ws.unassigned': 'Unassigned',
  'ws.activity': 'Activity',
  'ws.auditHistory': 'Audit history',
  'ws.addNotePlaceholder': 'Add a work note…',
  'ws.workNoteAria': 'Work note',
  'ws.addNote': 'Add note',
  'ws.adding': 'Adding…',

  // Triage panel
  'triage.title': 'Triage',
  'triage.classification': 'Classification',
  'triage.impact': 'Impact',
  'triage.urgency': 'Urgency',
  'triage.priority': 'Priority',
  'triage.getAi': 'Get AI recommendation',
  'triage.suggested': 'Suggested: {classification} / {priority}',
  'triage.apply': 'Apply suggestion',
  'triage.save': 'Save triage',
  'triage.saving': 'Saving…',

  // Assign panel
  'assign.title': 'Assignment',
  'assign.group': 'Support group',
  'assign.autoRules': 'Auto (by rules)',
  'assign.owner': 'Owner',
  'assign.unassigned': 'Unassigned',
  'assign.assign': 'Assign',
  'assign.autoRoute': 'Auto-route',
  'assign.fallbackMsg': 'No matching group — routed to fallback queue.',
  'assign.assignedMsg': 'Assigned.',

  // Status panel
  'status.title': 'Status',
  'status.moveTo': 'Move to {status}',

  // Resolve panel
  'resolve.title': 'Resolve',
  'resolve.code': 'Resolution code',
  'resolve.selectCode': 'Select…',
  'resolve.note': 'Resolution note',
  'resolve.markResolved': 'Mark resolved',
  'resolve.resolving': 'Resolving…',
  'resolve.resolvedTitle': 'Resolved',
  'resolve.awaiting': 'Awaiting reporter confirmation. Code: {code}',
  'resolve.closeNow': 'Close now',

  // Reporter panel
  'reporter.confirmTitle': 'Confirm resolution',
  'reporter.confirmBody': 'Was your issue resolved?',
  'reporter.confirmBtn': 'Yes, confirm & close',
  'reporter.reopenTitle': 'Reopen',
  'reporter.reopenPlaceholder': 'Reason for reopening…',
  'reporter.reopenBtn': 'Reopen incident',
  'reporter.thankTitle': 'Thank you',
  'reporter.thankBody': 'You rated this {rating}/5.',
  'reporter.rateTitle': 'Rate your experience',
  'reporter.statusTitle': 'Status',
  'reporter.statusBody': 'Your incident is being handled by the support team.',

  // Activity / audit timeline
  'activity.work_note': 'Work note',
  'activity.status_change': 'Status changed',
  'activity.assignment': 'Assignment',
  'activity.resolution': 'Resolved',
  'activity.reopen': 'Reopened',
  'activity.emptyTitle': 'No activity yet',
  'audit.emptyTitle': 'No audit records',
  'audit.by': 'by {actor}',

  // CSAT
  'csat.ratingAria': 'Satisfaction rating',
  'csat.starAria': '{n} star',
  'csat.starAria_plural': '{n} stars',
  'csat.comment': 'Comment (optional)',
  'csat.error': 'Please select a rating from 1 to 5.',
  'csat.submit': 'Submit rating',
  'csat.submitting': 'Submitting…',

  // Alerts
  'alerts.title': 'Central Alert Center',
  'alerts.subtitle': 'Priority, SLA, status and escalation alerts routed to you.',
  'alerts.emptyTitle': 'No alerts',
  'alerts.emptyMsg': "You're all caught up.",
  'alerts.loadFailed': 'Failed to load alerts.',
  'alerts.sev.danger': 'Critical',
  'alerts.sev.warning': 'Warning',
  'alerts.sev.info': 'Info',
  'alerts.group': '{label} ({count})',
  'alerts.viewIncident': 'View incident',
  'alerts.acknowledged': 'Acknowledged',
  'alerts.acknowledge': 'Acknowledge',

  // Dashboard
  'dash.title': 'Incident & KPI Dashboard',
  'dash.subtitle': 'Operational performance across all incidents.',
  'dash.refresh': 'Refresh',
  'dash.refreshing': 'Refreshing…',
  'dash.loadFailed': 'Failed to load KPIs.',
  'dash.emptyTitle': 'No data yet',
  'dash.emptyMsg': 'KPIs will appear once incidents exist.',
  'dash.slaCompliance': 'SLA Compliance',
  'dash.slaBreaches': 'SLA Breaches',
  'dash.reopened': 'Reopened',
  'dash.avgCsat': 'Avg CSAT',
  'dash.csatValue': '{value} / 5',
  'dash.byStatus': 'By Status',
  'dash.byPriority': 'By Priority',
  'dash.aging': 'Aging (open)',
  'dash.recurring': 'Recurring incidents',
  'dash.trend': 'Trend',

  // SLA config
  'slacfg.title': 'SLA Configuration',
  'slacfg.subtitleEdit': 'Editable workshop targets.',
  'slacfg.subtitleReadonly': 'Editable workshop targets. (Read-only — manager access required to edit.)',
  'slacfg.priority': 'Priority',
  'slacfg.responseMin': 'Response (min)',
  'slacfg.resolution': 'Resolution',
  'slacfg.businessDays': '{n} business days',
  'slacfg.atRisk': 'At-risk threshold (%)',
  'slacfg.reminderMax': 'CSAT reminders (max)',
  'slacfg.save': 'Save configuration',
  'slacfg.saving': 'Saving…',
  'slacfg.saved': 'Saved',
  'slacfg.loadFailed': 'Failed to load config.',
  'slacfg.bdAria': '{priority} resolution business days',

  // Enum: status
  'status.new': 'New',
  'status.triaged': 'Triaged',
  'status.assigned': 'Assigned',
  'status.in_progress': 'In Progress',
  'status.pending': 'Pending',
  'status.resolved': 'Resolved',
  'status.reopened': 'Reopened',
  'status.closed': 'Closed',
  'status.fallback': 'Fallback Queue',

  // Enum: role
  'role.business_user': 'Business User',
  'role.service_desk': 'Service Desk',
  'role.application_support': 'Application Support',
  'role.infrastructure_support': 'Infrastructure Support',
  'role.manager': 'Manager',
  'role.management': 'Management',

  // Enum: impact / urgency
  'iu.high': 'High',
  'iu.medium': 'Medium',
  'iu.low': 'Low',

  // Enum: classification
  'class.application': 'Application',
  'class.infrastructure': 'Infrastructure',
  'class.network': 'Network',
  'class.access': 'Access',
  'class.email': 'Email',
  'class.other': 'Other',

  // Enum: support group
  'group.service_desk': 'Service Desk',
  'group.application_support': 'Application Support',
  'group.infrastructure_support': 'Infrastructure Support',

  // Enum: resolution code
  'rescode.fixed': 'Fixed',
  'rescode.workaround': 'Workaround',
  'rescode.configuration_change': 'Configuration change',
  'rescode.no_fault_found': 'No fault found',
  'rescode.duplicate': 'Duplicate',
  'rescode.user_error': 'User error',
} as const;

export type TranslationKey = keyof typeof en;
export type Dict = Record<TranslationKey, string>;
