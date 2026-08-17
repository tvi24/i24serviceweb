import { PRIORITIES, STATUS_LABELS, type IncidentFilters, type IncidentStatus, type Priority } from '@incident/shared';
import { useState } from 'react';
import { IncidentTable } from '../components/IncidentTable';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui';
import { useIncidents } from '../hooks/useIncidents';

const STATUSES = Object.keys(STATUS_LABELS) as IncidentStatus[];

export function ControlTowerPage() {
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
          <h1>Incident Control Tower</h1>
          <p className="muted">All incidents with live status and priority.</p>
        </div>
        <div className="row">
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" style={{ width: 'auto' }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority" style={{ width: 'auto' }}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {isLoading && <LoadingSkeleton rows={6} />}
      {isError && <ErrorState message={(error as Error)?.message ?? 'Failed to load incidents.'} />}
      {data && (data.length === 0
        ? <EmptyState title="No incidents match" message="Try adjusting the filters." />
        : <IncidentTable incidents={data} />)}
    </section>
  );
}
