import {
  CLASSIFICATIONS,
  PRIORITIES,
  RESOLUTION_CODES,
  slaInstanceState,
  SUPPORT_GROUPS,
  type ImpactUrgency,
  type IncidentDetail,
  type Priority,
  type SlaRecord,
  type SupportGroup,
} from '@incident/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError, api } from '../api/apiClient';
import { ActivityTimeline, AuditTimeline } from '../components/AuditTimeline';
import { CsatForm } from '../components/CsatForm';
import { Button, Card, ErrorState, LoadingSkeleton, PriorityBadge, SlaBadge, StatusBadge } from '../components/ui';
import { useT } from '../i18n/I18nContext';
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
  const t = useT();
  const { user, hasRole } = useAuth();
  const { data: inc, isLoading, isError, error } = useIncident(id);
  const audit = useAudit(id);

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (isError || !inc) return <ErrorState message={(error as Error)?.message ?? t('ws.notFound')} />;

  const isReporter = inc.reporterId === user?.id;
  const isSupport = hasRole('service_desk', 'application_support', 'infrastructure_support', 'manager');
  const canViewAudit = hasRole('service_desk', 'manager');

  return (
    <section>
      <div className="section-title ws-header">
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
            <h3>{t('ws.description')}</h3>
            <p>{inc.description}</p>
            <div className="row muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 'var(--space-3)', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <span>{t('ws.reporter', { name: inc.reporter?.displayName ?? '—' })}</span>
              <span>{t('ws.owner', { name: inc.owner?.displayName ?? t('ws.unassigned') })}</span>
              <span>{t('ws.classification', { value: inc.classification ?? inc.classificationSuggested ?? '—' })}</span>
              <span>{t('ws.channel', { value: t(`channel.${inc.channel}`) })}</span>
              <span>{t('ws.category', { value: inc.category ?? '—' })}</span>
              <span>{t('ws.requesterBu', { value: inc.requesterBuId ?? '—' })}</span>
            </div>
          </Card>

          <Card>
            <h3>{t('ws.activity')}</h3>
            <ActivityTimeline activities={inc.activities} />
            {isSupport && inc.status !== 'closed' && <WorkNoteInput id={inc.id} />}
          </Card>

          <EmailPanel incidentId={inc.id} isSupport={isSupport} />

          {canViewAudit && (
            <Card>
              <h3>{t('ws.auditHistory')}</h3>
              <AuditTimeline events={(audit.data as any) ?? []} />
            </Card>
          )}
        </div>

        <div className="stack">
          <SlaPanel inc={inc} />
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

function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const mins = Math.floor(abs / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function SlaClockRow({ label, targetAt, metAt }: { label: string; targetAt: string; metAt?: string | null }) {
  const t = useT();
  const now = Date.now();
  const target = new Date(targetAt).getTime();
  let text: string;
  let cls = 'within_target';
  if (metAt) { text = t('ws.slaMet'); cls = 'within_target'; }
  else if (now >= target) { text = t('ws.slaOverdue', { time: formatDuration(now - target) }); cls = 'breached'; }
  else { text = t('ws.slaRemaining', { time: formatDuration(target - now) }); cls = 'within_target'; }
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <span className="muted">{label}</span>
      <span className={`badge badge--${cls}`}>{text}</span>
    </div>
  );
}

function SlaPanel({ inc }: { inc: IncidentDetail }) {
  const t = useT();
  const sla = inc.sla as SlaRecord | null | undefined;
  return (
    <Card>
      <h3>{t('ws.slaTitle')}</h3>
      {!sla ? (
        <p className="muted">{t('ws.slaNone')}</p>
      ) : (
        <div className="stack" style={{ gap: 'var(--space-2)' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">{t('ws.slaTitle')}</span>
            <span className={`badge badge--${slaInstanceState(sla) === 'breached' ? 'breached' : slaInstanceState(sla) === 'at_risk' ? 'at_risk' : 'within_target'}`}>
              {t(`slaState.${slaInstanceState(sla)}`)}
            </span>
          </div>
          <SlaClockRow label={t('ws.responseSla')} targetAt={sla.responseTargetAt} metAt={sla.responseAt} />
          <SlaClockRow label={t('ws.resolutionSla')} targetAt={sla.resolutionTargetAt} metAt={sla.resolutionMetAt} />
          {sla.policyName && <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{t('ws.slaPolicy', { name: sla.policyName })}</div>}
        </div>
      )}
    </Card>
  );
}

function EmailPanel({ incidentId, isSupport }: { incidentId: string; isSupport: boolean }) {
  const t = useT();
  const qc = useQueryClient();
  const emails = useQuery({ queryKey: ['emails', incidentId], queryFn: () => api.getIncidentEmails(incidentId) });
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'internal'>('public');
  const reply = useMutation({
    mutationFn: () => api.replyIncident(incidentId, body, visibility),
    onSuccess: () => { setBody(''); qc.invalidateQueries({ queryKey: ['emails', incidentId] }); qc.invalidateQueries({ queryKey: ['incident', incidentId] }); },
  });

  // Reporters only see public messages.
  const list = (emails.data ?? []).filter((m) => isSupport || m.visibility === 'public');

  return (
    <Card>
      <h3><Mail size={16} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 6 }} />{t('email.threadTitle')}</h3>
      {list.length === 0 ? (
        <p className="muted">{t('email.noThread')}</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {list.map((m) => (
            <li key={m.id} style={{ border: '1px solid var(--color-border)', borderLeft: `3px solid ${m.visibility === 'internal' ? 'var(--color-warning)' : m.direction === 'inbound' ? 'var(--color-info)' : 'var(--color-primary)'}`, borderRadius: 'var(--radius-sm)', padding: 'var(--space-2) var(--space-3)' }}>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
                <span className="row" style={{ gap: 6 }}>
                  <span className="chip">{t(`email.dir.${m.direction}`)}</span>
                  {m.visibility === 'internal' && <span className="chip">{t('email.vis.internal')}</span>}
                  <span className="muted">{m.fromAddr} → {m.toAddr}</span>
                </span>
                <span className="muted">{new Date(m.createdAt).toLocaleString()} · {m.deliveryState}</span>
              </div>
              <div style={{ fontWeight: 'var(--fw-medium)', marginTop: 4 }}>{m.subject}</div>
              <div className="muted" style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--fs-sm)' }}>{m.body}</div>
            </li>
          ))}
        </ul>
      )}
      {isSupport && (
        <div className="stack" style={{ marginTop: 'var(--space-3)' }}>
          <div className="tabs" style={{ marginBottom: 'var(--space-2)' }}>
            <button className={`tab${visibility === 'public' ? ' is-active' : ''}`} onClick={() => setVisibility('public')}>{t('email.publicReply')}</button>
            <button className={`tab${visibility === 'internal' ? ' is-active' : ''}`} onClick={() => setVisibility('internal')}>{t('email.internalNote')}</button>
          </div>
          <textarea className="textarea" value={body} placeholder={visibility === 'public' ? t('email.replyPlaceholder') : t('email.notePlaceholder')} onChange={(e) => setBody(e.target.value)} />
          <div>
            <Button size="sm" disabled={reply.isPending || !body.trim()} onClick={() => reply.mutate()}>{t('email.send')}</Button>
          </div>
          {reply.isError && <p className="field__error">{(reply.error as Error)?.message}</p>}
        </div>
      )}
    </Card>
  );
}

function WorkNoteInput({ id }: { id: string }) {
  const t = useT();
  const [note, setNote] = useState('');
  const addNote = useAddNote(id);
  return (
    <div className="stack" style={{ marginTop: 'var(--space-4)' }}>
      <textarea className="textarea" placeholder={t('ws.addNotePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} aria-label={t('ws.workNoteAria')} />
      <div>
        <Button size="sm" disabled={addNote.isPending || !note.trim()} onClick={() => addNote.mutate(note, { onSuccess: () => setNote('') })}>
          {addNote.isPending ? t('ws.adding') : t('ws.addNote')}
        </Button>
      </div>
    </div>
  );
}

function TriagePanel({ inc }: { inc: IncidentDetail }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const suggestions = useSuggestions(inc.id, open);
  const triage = useTriage(inc.id);
  const [classification, setClassification] = useState(inc.classification ?? inc.classificationSuggested ?? 'other');
  const [impact, setImpact] = useState<ImpactUrgency>((inc.impact as ImpactUrgency) ?? 'medium');
  const [urgency, setUrgency] = useState<ImpactUrgency>((inc.urgency as ImpactUrgency) ?? 'medium');
  const [priority, setPriority] = useState<Priority>(inc.priority ?? inc.prioritySuggested ?? 'P3');
  const [overrideReason, setOverrideReason] = useState('');
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  const recommended = inc.prioritySuggested ?? null;
  const isOverride = !!recommended && recommended !== priority;

  return (
    <Card>
      <h3>{t('triage.title')}</h3>
      <div className="field">
        <label>{t('triage.classification')}</label>
        <select className="select" value={classification} onChange={(e) => setClassification(e.target.value)}>
          {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{t(`class.${c}`)}</option>)}
        </select>
      </div>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>{t('triage.impact')}</label>
          <select className="select" value={impact} onChange={(e) => setImpact(e.target.value as ImpactUrgency)}>
            {IU.map((v) => <option key={v} value={v}>{t(`iu.${v}`)}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>{t('triage.urgency')}</label>
          <select className="select" value={urgency} onChange={(e) => setUrgency(e.target.value as ImpactUrgency)}>
            {IU.map((v) => <option key={v} value={v}>{t(`iu.${v}`)}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>{t('triage.priority')}</label>
        <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {!open && <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><Sparkles size={14} /> {t('triage.getAi')}</Button>}
      {open && suggestions.data && (
        <div className="ai-suggestion">
          <strong>{suggestions.data.label}</strong>
          <div className="muted">{t('triage.suggested', { classification: suggestions.data.classification, priority: suggestions.data.priority })}</div>
          <Button variant="ghost" size="sm" onClick={() => { setClassification(suggestions.data!.classification); setPriority(suggestions.data!.priority); }}>
            {t('triage.apply')}
          </Button>
        </div>
      )}

      {isOverride && (
        <div className="field">
          <label>{t('triage.overrideReason')}</label>
          <p className="muted" style={{ fontSize: 'var(--fs-xs)', margin: '0 0 4px' }}>{t('triage.overrideReasonHint', { recommended: recommended! })}</p>
          <textarea className="textarea" value={overrideReason} placeholder={t('triage.overrideReasonPlaceholder')} onChange={(e) => setOverrideReason(e.target.value)} aria-invalid={!!fieldErr.overrideReason} />
          {fieldErr.overrideReason && <span className="field__error">{fieldErr.overrideReason}</span>}
        </div>
      )}

      <div style={{ marginTop: 'var(--space-3)' }}>
        <Button disabled={triage.isPending || (isOverride && !overrideReason.trim())} onClick={() =>
          triage.mutate(
            { classification, impact, urgency, priority, overrideReason: isOverride ? overrideReason.trim() : undefined },
            { onError: (e) => { if (e instanceof ApiError && e.fields) setFieldErr(e.fields); } }
          )
        }>
          {triage.isPending ? t('triage.saving') : t('triage.save')}
        </Button>
      </div>
    </Card>
  );
}

function AssignPanel({ inc }: { inc: IncidentDetail }) {
  const t = useT();
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
        onSuccess: (d: any) => setMsg(d.status === 'fallback' ? t('assign.fallbackMsg') : t('assign.assignedMsg')),
        onError: (e) => setMsg(e instanceof ApiError ? e.message : t('common.failed')),
      }
    );
  }

  return (
    <Card>
      <h3>{t('assign.title')}</h3>
      <div className="field">
        <label>{t('assign.group')}</label>
        <select className="select" value={group} onChange={(e) => setGroup(e.target.value as SupportGroup)}>
          <option value="">{t('assign.autoRules')}</option>
          {SUPPORT_GROUPS.map((g) => <option key={g} value={g}>{t(`group.${g}`)}</option>)}
        </select>
      </div>
      <div className="field">
        <label>{t('assign.owner')}</label>
        <select className="select" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          <option value="">{t('assign.unassigned')}</option>
          {owners.map((u) => <option key={u.id} value={u.id}>{u.displayName}</option>)}
        </select>
      </div>
      <div className="row">
        <Button size="sm" disabled={assign.isPending} onClick={() => doAssign(false)}>{t('assign.assign')}</Button>
        <Button size="sm" variant="secondary" disabled={assign.isPending} onClick={() => doAssign(true)}>{t('assign.autoRoute')}</Button>
      </div>
      {msg && <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{msg}</p>}
    </Card>
  );
}

function StatusPanel({ inc }: { inc: IncidentDetail }) {
  const t = useT();
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
      <h3>{t('status.title')}</h3>
      <div className="row">
        {options.map((s) => (
          <Button key={s} size="sm" variant="secondary" disabled={change.isPending}
            onClick={() => change.mutate(s as any, { onError: (e) => setMsg(e instanceof ApiError ? e.message : t('common.failed')) })}>
            {t('status.moveTo', { status: t(`status.${s as 'in_progress'}`) })}
          </Button>
        ))}
      </div>
      {msg && <p className="field__error">{msg}</p>}
    </Card>
  );
}

function ResolvePanel({ inc }: { inc: IncidentDetail }) {
  const t = useT();
  const resolve = useResolve(inc.id);
  const close = useClose(inc.id);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

  if (inc.status === 'closed') return null;
  if (inc.status === 'resolved') {
    return (
      <Card>
        <h3>{t('resolve.resolvedTitle')}</h3>
        <p className="muted">{t('resolve.awaiting', { code: inc.resolutionCode ? t(`rescode.${inc.resolutionCode as 'fixed'}`) : '—' })}</p>
        <Button size="sm" variant="secondary" disabled={close.isPending} onClick={() => close.mutate()}>{t('resolve.closeNow')}</Button>
      </Card>
    );
  }
  return (
    <Card>
      <h3>{t('resolve.title')}</h3>
      <div className="field">
        <label>{t('resolve.code')}</label>
        <select className="select" value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={!!fields.resolutionCode}>
          <option value="">{t('resolve.selectCode')}</option>
          {RESOLUTION_CODES.map((c) => <option key={c} value={c}>{t(`rescode.${c}`)}</option>)}
        </select>
        {fields.resolutionCode && <span className="field__error">{fields.resolutionCode}</span>}
      </div>
      <div className="field">
        <label>{t('resolve.note')}</label>
        <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} aria-invalid={!!fields.resolutionNote} />
        {fields.resolutionNote && <span className="field__error">{fields.resolutionNote}</span>}
      </div>
      <Button disabled={resolve.isPending} onClick={() =>
        resolve.mutate({ resolutionCode: code, resolutionNote: note }, { onError: (e) => { if (e instanceof ApiError && e.fields) setFields(e.fields); } })
      }>
        {resolve.isPending ? t('resolve.resolving') : t('resolve.markResolved')}
      </Button>
    </Card>
  );
}

function ReporterPanel({ inc }: { inc: IncidentDetail }) {
  const t = useT();
  const confirm = useConfirm(inc.id);
  const csat = useSubmitCsat(inc.id);
  const reopen = useReopen(inc.id);
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState<string | null>(null);

  if (inc.status === 'resolved') {
    return (
      <>
        <Card>
          <h3>{t('reporter.confirmTitle')}</h3>
          <p className="muted">{t('reporter.confirmBody')}</p>
          <div className="row">
            <Button disabled={confirm.isPending} onClick={() => confirm.mutate()}>{t('reporter.confirmBtn')}</Button>
          </div>
        </Card>
        <Card>
          <h3>{t('reporter.reopenTitle')}</h3>
          <div className="field">
            <textarea className="textarea" placeholder={t('reporter.reopenPlaceholder')} value={reason} onChange={(e) => setReason(e.target.value)} />
            {reasonErr && <span className="field__error">{reasonErr}</span>}
          </div>
          <Button variant="secondary" disabled={reopen.isPending} onClick={() =>
            reopen.mutate(reason, { onError: (e) => setReasonErr(e instanceof ApiError ? e.message : t('common.failed')) })
          }>{t('reporter.reopenBtn')}</Button>
        </Card>
      </>
    );
  }

  if (inc.status === 'closed') {
    if (inc.csat?.submittedAt) {
      return <Card><h3>{t('reporter.thankTitle')}</h3><p className="muted">{t('reporter.thankBody', { rating: inc.csat.rating ?? 0 })}</p></Card>;
    }
    return (
      <Card>
        <h3>{t('reporter.rateTitle')}</h3>
        <CsatForm busy={csat.isPending} onSubmit={(rating, comment) => csat.mutate({ rating, comment })} />
      </Card>
    );
  }

  return <Card><h3>{t('reporter.statusTitle')}</h3><p className="muted">{t('reporter.statusBody')}</p></Card>;
}
