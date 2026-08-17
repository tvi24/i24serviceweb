import { Link } from 'react-router-dom';
import { IncidentTable } from '../components/IncidentTable';
import { Button, EmptyState, ErrorState, LoadingSkeleton } from '../components/ui';
import { useIncidents } from '../hooks/useIncidents';

export function MyIncidentsPage() {
  const { data, isLoading, isError, error } = useIncidents({ mine: true });

  return (
    <section>
      <div className="section-title">
        <div>
          <h1>My Incidents</h1>
          <p className="muted">Incidents you have reported. Click a row to view details, confirm, or reopen.</p>
        </div>
        <Link to="/intake"><Button>Report Incident</Button></Link>
      </div>

      {isLoading && <LoadingSkeleton rows={5} />}
      {isError && <ErrorState message={(error as Error)?.message ?? 'Failed to load.'} />}
      {data && (data.length === 0
        ? <EmptyState title="No incidents yet" message="Report your first incident to get started." />
        : <IncidentTable incidents={data} />)}
    </section>
  );
}
