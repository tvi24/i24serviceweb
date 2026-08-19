import { PRIORITIES, STATUS_LABELS, type IncidentFilters, type IncidentStatus, type Priority } from '@incident/shared';
import { useState } from 'react';
import { IncidentTable } from '../components/IncidentTable';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui';
import { useT } from '../i18n/I18nContext';
import { useIncidents } from '../hooks/useIncidents';

const STATUSES = Object.keys(STATUS_LABELS) as IncidentStatus[];

export function ControlTowerPage() {
  const t = useT();
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const filters: IncidentFilters = {
    status: (status || undefined) as IncidentStatus | undefined,
    priority: (priority || undefined) as Priority | undefined,
  };
  const { data, isLoading, isError, error } = useIncidents(filters);

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

      {isLoading && <LoadingSkeleton rows={6} />}
      {isError && <ErrorState message={(error as Error)?.message ?? t('ct.loadFailed')} />}
      {data && (data.length === 0
        ? <EmptyState title={t('ct.noMatchTitle')} message={t('ct.noMatchMsg')} />
        : <IncidentTable incidents={data} />)}
    </section>
  );
}
