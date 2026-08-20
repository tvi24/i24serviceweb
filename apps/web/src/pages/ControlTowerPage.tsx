import { PRIORITIES, STATUS_LABELS, type Incident, type IncidentStatus } from '@incident/shared';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button, EmptyState, ErrorState, LoadingSkeleton } from '../components/ui';
import { IncidentTable } from '../components/IncidentTable';
import { useT } from '../i18n/I18nContext';
import { useIncidents } from '../hooks/useIncidents';

const STATUSES = Object.keys(STATUS_LABELS) as IncidentStatus[];

type Queue = 'all' | 'untriaged' | 'unassigned' | 'p1' | 'p2' | 'at_risk' | 'breached' | 'reopened' | 'mywork';
const QUEUES: Queue[] = ['all', 'untriaged', 'unassigned', 'p1', 'p2', 'at_risk', 'breached', 'reopened', 'mywork'];

export function ControlTowerPage() {
  const t = useT();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [queue, setQueue] = useState<Queue>((params.get('queue') as Queue) || 'all');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>(params.get('priority') || '');
  // Dashboard drill-down filters (from URL): BU / service / support group.
  const buFilter = params.get('bu');
  const serviceFilter = params.get('service');
  const groupFilter = params.get('group');
  const drill = buFilter ?? serviceFilter ?? groupFilter ?? null;
  // Fetch the full authorized list, then apply queue + filters client-side so
  // queues that depend on multiple fields (unassigned, assigned-to-me) work uniformly.
  const { data, isLoading, isError, error } = useIncidents({});

  function applyQueue(list: Incident[]): Incident[] {
    switch (queue) {
      case 'untriaged': return list.filter((i) => i.status === 'new' || i.status === 'triaged');
      case 'unassigned': return list.filter((i) => !i.assignedOwnerId && i.status !== 'closed');
      case 'p1': return list.filter((i) => i.priority === 'P1');
      case 'p2': return list.filter((i) => i.priority === 'P2');
      case 'at_risk': return list.filter((i) => i.slaState === 'at_risk');
      case 'breached': return list.filter((i) => i.slaState === 'breached');
      case 'reopened': return list.filter((i) => i.status === 'reopened');
      case 'mywork': return list.filter((i) => i.assignedOwnerId === user?.id);
      default: return list;
    }
  }

  function clearDrill() {
    const next = new URLSearchParams(params);
    next.delete('bu'); next.delete('service'); next.delete('group');
    setParams(next);
  }

  const filtered = (data ?? [])
    .filter((i) => (status ? i.status === status : true))
    .filter((i) => (priority ? i.priority === priority : true))
    .filter((i) => (buFilter ? i.requesterBuId === buFilter : true))
    .filter((i) => (serviceFilter ? i.serviceId === serviceFilter : true))
    .filter((i) => (groupFilter ? i.supportGroup === groupFilter : true));
  const shown = applyQueue(filtered);

  return (
    <section>
      <div className="section-title">
        <div>
          <h1>{t('ct.title')}</h1>
          <p className="muted">{t('ct.subtitle')}</p>
        </div>
        <div className="row">
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('ct.filterStatus')} style={{ width: 'auto' }}>
            <option value="">{t('ct.allStatuses')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </select>
          <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label={t('ct.filterPriority')} style={{ width: 'auto' }}>
            <option value="">{t('ct.allPriorities')}</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {drill && (
        <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
          <span className="chip">{t('ct.filtered', { label: drill })}</span>
          <Button size="sm" variant="ghost" onClick={clearDrill}>{t('ct.clearFilter')}</Button>
        </div>
      )}

      <div className="tabs" role="tablist" aria-label={t('nav.queues')}>
        {QUEUES.map((q) => (
          <button key={q} role="tab" aria-selected={queue === q} className={`tab${queue === q ? ' is-active' : ''}`} onClick={() => setQueue(q)}>
            {t(`queue.${q}`)}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSkeleton rows={6} />}
      {isError && <ErrorState message={(error as Error)?.message ?? t('ct.loadFailed')} />}
      {data && (shown.length === 0
        ? <EmptyState title={t('ct.noMatchTitle')} message={t('ct.noMatchMsg')} />
        : <IncidentTable incidents={shown} />)}
    </section>
  );
}
