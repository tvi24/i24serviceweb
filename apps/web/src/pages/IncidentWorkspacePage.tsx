import {
  CLASSIFICATIONS,
  PRIORITIES,
  RESOLUTION_CODES,
  SUPPORT_GROUPS,
  type ImpactUrgency,
  type IncidentDetail,
  type Priority,
  type SupportGroup,
} from '@incident/shared';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../api/apiClient';
import { ActivityTimeline, AuditTimeline } from '../components/AuditTimeline';
import { CsatForm } from '../components/CsatForm';
import { Button, Card, ErrorState, LoadingSkeleton, PriorityBadge, SlaBadge, StatusBadge } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import {
  useAddNote,
  useAssign,
  useAudit,
  useChangeStatus,
  useClose,
  useConfirm,
  useIncident,
  useReopen,
  useResolve,
  useSubmitCsat,
  useSuggestions,
  useTriage,
  useUsers,
} from '../hooks/useIncidents';
import './IncidentWorkspace.css';

const IU: ImpactUrgency[] = ['high', 'medium', 'low'];

export function IncidentWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const { data: inc, isLoading, isError, error } = useIncident(id);
  const audit = useAudit(id);

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (isError || !inc) return <ErrorState message={(error as Error)?.message ?? 'Incident not found.'} />;

  const isReporter = inc.reporterId === user?.id;
  const isSupport = hasRole('service_desk', 'application_support', 'infrastructure_support', 'manager');
  const canViewAudit = hasRole('service_desk', 'manager');

  return (
    <section>
      <div className="section-title">
        <div>
          <div className="row"><code>{inc.ticketId}</code></div>
          <h1 style={{ marginBottom: 4 }}>{inc.title}</h1>
          <div className="row">
            <PriorityBadge priority={inc.priority} />
            <SlaBadge state={inc.sla?.resolutionState} />
            <StatusBadge status={inc.status} />
          </div>
        </div>
      </div>

      <div className="workspace">
        <div className="stack">
          <Card>
            <h3>Description</h3>
            <p>{inc.description}</p>
            <div className="row muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 'var(--space-3)' }}>
              <span>Reporter: {inc.reporter?.displayName ?? '—'}</span>
              <span>Owner: {inc.owner?.displayName ?? 'Unassigned'}</span>
              <span>Classification: {inc.classification ?? inc.classificationSuggested ?? '—'}</span>
            </div>
          </Card>

          <Card>
            <h3>Activity</h3>
            <ActivityTimeline activities={inc.activities} />
            {isSupport && inc.status !== 'closed' && <WorkNoteInput id={inc.id} />}
          </Card>

          {canViewAudit && (
            <Card>
              <h3>Audit history</h3>
              <AuditTimeline events={(audit.data as any) ?? []} />
            </Card>
          )}
        </div>

        <div className="stack">
          {isSupport && <TriagePanel inc={inc} />}
          {isSupport && <AssignPanel inc={inc} />}
          {isSupport && <StatusPanel inc={inc} />}
          {isSupport && <ResolvePanel inc={inc} />}
          {isReporter && <ReporterPanel inc={inc} />}
        </div>
      </div>
    </section>
  );
}

function WorkNoteInput({ id }: { id: string }) {
  const [note, setNote] = useState('');
  const addNote = useAddNote(id);
  return (
    <div className="stack" style={{ marginTop: 'var(--space-4)' }}>
      <textarea className="textarea" placeholder="Add a work note…" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Work note" />
      <div>
        <Button size="sm" disabled={addNote.isPending || !note.trim()} onClick={() => addNote.mutate(note, { onSuccess: () => setNote('') })}>
          {addNote.isPending ? 'Adding…' : 'Add note'}
        </Button>
      </div>
    </div>
  );
}

function TriagePanel({ inc }: { inc: IncidentDetail }) {
  const [open, setOpen] = useState(false);
  const suggestions = useSuggestions(inc.id, open);
  const triage = useTriage(inc.id);
  const [classification, setClassification] = useState(inc.classification ?? inc.classificationSuggested ?? 'other');
  const [impact, setImpact] = useState<ImpactUrgency>((inc.impact as ImpactUrgency) ?? 'medium');
  const [urgency, setUrgency] = useState<ImpactUrgency>((inc.urgency as ImpactUrgency) ?? 'medium');
  const [priority, setPriority] = useState<Priority>(inc.priority ?? inc.prioritySuggested ?? 'P3');

  return (
    <Card>
      <h3>Triage</h3>
      <div className="field">
        <label>Classification</label>
        <select className="select" value={classification} onChange={(e) => setClassification(e.target.value)}>
          {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Impact</label>
          <select className="select" value={impact} onChange={(e) => setImpact(e.target.value as ImpactUrgency)}>
            {IU.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Urgency</label>
          <select className="select" value={urgency} onChange={(e) => setUrgency(e.target.value as ImpactUrgency)}>
            {IU.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Priority</label>
        <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {!open && <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><Sparkles size={14} /> Get AI recommendation</Button>}
      {open && suggestions.data && (
        <div className="ai-suggestion">
          <strong>{suggestions.data.label}</strong>
          <div className="muted">Suggested: {suggestions.data.classification} / {suggestions.data.priority}</div>
          <Button variant="ghost" size="sm" onClick={() => { setClassification(suggestions.data!.classification); setPriority(suggestions.data!.priority); }}>
            Apply suggestion
          </Button>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-3)' }}>
        <Button disabled={triage.isPending} onClick={() => triage.mutate({ classification, impact, urgency, priority })}>
          {triage.isPending ? 'Saving…' : 'Save triage'}
        </Button>
      </div>
    </Card>
  );
}

function AssignPanel({ inc }: { inc: IncidentDetail }) {
  const assign = useAssign(inc.id);
  const users = useUsers();
  const [group, setGroup] = useState<SupportGroup | ''>(inc.supportGroup ?? '');
  const [ownerId, setOwnerId] = useState<string>(inc.assignedOwnerId ?? '');
  const [msg, setMsg] = useState<string | null>(null);

  const owners = (users.data ?? []).filter((u) => u.supportGroup && (!group || u.supportGroup === group));

  function doAssign(auto: boolean) {
    setMsg(null);
    assign.mutate(
      auto ? {} : { supportGroup: (group || undefined) as SupportGroup | undefined, ownerId: ownerId || null },
      {
        onSuccess: (d: any) => setMsg(d.status === 'fallback' ? 'No matching group — routed to fallback queue.' : 'Assigned.'),
        onError: (e) => setMsg(e instanceof ApiError ? e.message : 'Failed.'),
      }
    );
  }

  return (
    <Card>
      <h3>Assignment</h3>
      <div className="field">
        <label>Support group</label>
        <select className="select" value={group} onChange={(e) => setGroup(e.target.value as SupportGroup)}>
          <option value="">Auto (by rules)</option>
          {SUPPORT_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Owner</label>
        <select className="select" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          <option value="">Unassigned</option>
          {owners.map((u) => <option key={u.id} value={u.id}>{u.displayName}</option>)}
        </select>
      </div>
      <div className="row">
        <Button size="sm" disabled={assign.isPending} onClick={() => doAssign(false)}>Assign</Button>
        <Button size="sm" variant="secondary" disabled={assign.isPending} onClick={() => doAssign(true)}>Auto-route</Button>
      </div>
      {msg && <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{msg}</p>}
    </Card>
  );
}

function StatusPanel({ inc }: { inc: IncidentDetail }) {
  const change = useChangeStatus(inc.id);
  const [msg, setMsg] = useState<string | null>(null);
  const next: Record<string, string[]> = {
    assigned: ['in_progress', 'pending'],
    in_progress: ['pending'],
    pending: ['in_progress'],
    reopened: ['in_progress'],
  };
  const options = next[inc.status] ?? [];
  if (options.length === 0) return null;
  return (
    <Card>
      <h3>Status</h3>
      <div className="row">
        {options.map((s) => (
          <Button key={s} size="sm" variant="secondary" disabled={change.isPending}
            onClick={() => change.mutate(s as any, { onError: (e) => setMsg(e instanceof ApiError ? e.message : 'Failed.') })}>
            Move to {s}
          </Button>
        ))}
      </div>
      {msg && <p className="field__error">{msg}</p>}
    </Card>
  );
}

function ResolvePanel({ inc }: { inc: IncidentDetail }) {
  const resolve = useResolve(inc.id);
  const close = useClose(inc.id);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

  if (inc.status === 'closed') return null;
  if (inc.status === 'resolved') {
    return (
      <Card>
        <h3>Resolved</h3>
        <p className="muted">Awaiting reporter confirmation. Code: {inc.resolutionCode}</p>
        <Button size="sm" variant="secondary" disabled={close.isPending} onClick={() => close.mutate()}>Close now</Button>
      </Card>
    );
  }
  return (
    <Card>
      <h3>Resolve</h3>
      <div className="field">
        <label>Resolution code</label>
        <select className="select" value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={!!fields.resolutionCode}>
          <option value="">Select…</option>
          {RESOLUTION_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {fields.resolutionCode && <span className="field__error">{fields.resolutionCode}</span>}
      </div>
      <div className="field">
        <label>Resolution note</label>
        <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} aria-invalid={!!fields.resolutionNote} />
        {fields.resolutionNote && <span className="field__error">{fields.resolutionNote}</span>}
      </div>
      <Button disabled={resolve.isPending} onClick={() =>
        resolve.mutate({ resolutionCode: code, resolutionNote: note }, { onError: (e) => { if (e instanceof ApiError && e.fields) setFields(e.fields); } })
      }>
        {resolve.isPending ? 'Resolving…' : 'Mark resolved'}
      </Button>
    </Card>
  );
}

function ReporterPanel({ inc }: { inc: IncidentDetail }) {
  const confirm = useConfirm(inc.id);
  const csat = useSubmitCsat(inc.id);
  const reopen = useReopen(inc.id);
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState<string | null>(null);

  if (inc.status === 'resolved') {
    return (
      <>
        <Card>
          <h3>Confirm resolution</h3>
          <p className="muted">Was your issue resolved?</p>
          <div className="row">
            <Button disabled={confirm.isPending} onClick={() => confirm.mutate()}>Yes, confirm & close</Button>
          </div>
        </Card>
        <Card>
          <h3>Reopen</h3>
          <div className="field">
            <textarea className="textarea" placeholder="Reason for reopening…" value={reason} onChange={(e) => setReason(e.target.value)} />
            {reasonErr && <span className="field__error">{reasonErr}</span>}
          </div>
          <Button variant="secondary" disabled={reopen.isPending} onClick={() =>
            reopen.mutate(reason, { onError: (e) => setReasonErr(e instanceof ApiError ? e.message : 'Failed.') })
          }>Reopen incident</Button>
        </Card>
      </>
    );
  }

  if (inc.status === 'closed') {
    if (inc.csat?.submittedAt) {
      return <Card><h3>Thank you</h3><p className="muted">You rated this {inc.csat.rating}/5.</p></Card>;
    }
    return (
      <Card>
        <h3>Rate your experience</h3>
        <CsatForm busy={csat.isPending} onSubmit={(rating, comment) => csat.mutate({ rating, comment })} />
      </Card>
    );
  }

  return <Card><h3>Status</h3><p className="muted">Your incident is being handled by the support team.</p></Card>;
}
