import type { Alert, AlertSeverity } from '@incident/shared';
import { BellRing, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, LoadingSkeleton } from '../components/ui';
import { useAckAlert, useAlerts } from '../hooks/useIncidents';

const SEVERITY_ORDER: AlertSeverity[] = ['danger', 'warning', 'info'];
const SEVERITY_LABEL: Record<AlertSeverity, string> = { danger: 'Critical', warning: 'Warning', info: 'Info' };

export function AlertCenterPage() {
  const { data, isLoading, isError, error } = useAlerts();
  const ack = useAckAlert();

  return (
    <section>
      <div className="section-title">
        <div>
          <h1>Central Alert Center</h1>
          <p className="muted">Priority, SLA, status and escalation alerts routed to you.</p>
        </div>
      </div>

      {isLoading && <LoadingSkeleton rows={5} />}
      {isError && <ErrorState message={(error as Error)?.message ?? 'Failed to load alerts.'} />}
      {data && (data.length === 0
        ? <EmptyState title="No alerts" message="You're all caught up." icon={BellRing} />
        : (
          <div className="stack">
            {SEVERITY_ORDER.map((sev) => {
              const group = data.filter((a) => a.severity === sev);
              if (group.length === 0) return null;
              return (
                <div key={sev}>
                  <h3>{SEVERITY_LABEL[sev]} ({group.length})</h3>
                  <div className="stack">
                    {group.map((a) => <AlertCard key={a.id} alert={a} onAck={() => ack.mutate(a.id)} acking={ack.isPending} />)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </section>
  );
}

function AlertCard({ alert, onAck, acking }: { alert: Alert; onAck: () => void; acking: boolean }) {
  return (
    <Card hover>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <span className={`badge badge--${alert.severity}`}>{alert.type.replace(/_/g, ' ')}</span>
          <p style={{ margin: 'var(--space-2) 0 4px' }}>{alert.message}</p>
          <div className="row muted" style={{ fontSize: 'var(--fs-xs)' }}>
            <span>{new Date(alert.createdAt).toLocaleString()}</span>
            <Link to={`/incidents/${alert.incidentId}`}>View incident</Link>
          </div>
        </div>
        {alert.acknowledgedAt
          ? <span className="badge badge--within_target"><Check size={13} /> Acknowledged</span>
          : <Button size="sm" variant="secondary" onClick={onAck} disabled={acking}>Acknowledge</Button>}
      </div>
    </Card>
  );
}
