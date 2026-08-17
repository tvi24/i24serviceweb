import { STATUS_LABELS, type IncidentStatus } from '@incident/shared';
import { RefreshCw } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, LoadingSkeleton } from '../components/ui';
import { useKpi } from '../hooks/useIncidents';
import './Dashboard.css';

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useKpi();

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState message={(error as Error)?.message ?? 'Failed to load KPIs.'} />;
  if (!data || !data.hasData) return <EmptyState title="No data yet" message="KPIs will appear once incidents exist." />;

  const maxTrend = Math.max(1, ...data.trend.map((t) => t.count));
  const maxRecurring = Math.max(1, ...data.recurring.map((r) => r.count));

  return (
    <section>
      <div className="section-title">
        <div>
          <h1>Incident & KPI Dashboard</h1>
          <p className="muted">Operational performance across all incidents.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={14} aria-hidden="true" /> {isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="kpi-grid">
        <Kpi label="SLA Compliance" value={`${data.slaCompliancePct}%`} tone={data.slaCompliancePct >= 90 ? 'good' : 'warn'} />
        <Kpi label="SLA Breaches" value={data.slaBreachCount} tone={data.slaBreachCount === 0 ? 'good' : 'bad'} />
        <Kpi label="Reopened" value={data.reopenCount} />
        <Kpi label="Avg CSAT" value={data.avgCsat != null ? `${data.avgCsat} / 5` : 'N/A'} tone={data.avgCsat && data.avgCsat >= 4 ? 'good' : undefined} />
      </div>

      <div className="dash-cols">
        <Card>
          <h3>By Status</h3>
          <BarList items={Object.entries(data.countsByStatus).map(([k, v]) => ({ label: STATUS_LABELS[k as IncidentStatus] ?? k, value: v }))} />
        </Card>
        <Card>
          <h3>By Priority</h3>
          <BarList items={['P1', 'P2', 'P3', 'P4'].map((p) => ({ label: p, value: data.countsByPriority[p] ?? 0 }))} />
        </Card>
        <Card>
          <h3>Aging (open)</h3>
          <BarList items={Object.entries(data.agingBuckets).map(([k, v]) => ({ label: k, value: v }))} />
        </Card>
      </div>

      <div className="dash-cols">
        <Card>
          <h3>Recurring incidents</h3>
          {data.recurring.length === 0 ? <EmptyState title="No data" /> : (
            <div className="stack" style={{ gap: 'var(--space-2)' }}>
              {data.recurring.map((r) => (
                <div key={r.classification}>
                  <div className="row between"><span>{r.classification}</span><strong>{r.count}</strong></div>
                  <div className="bar"><div className="bar__fill" style={{ width: `${(r.count / maxRecurring) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3>Trend</h3>
          {data.trend.length === 0 ? <EmptyState title="No data" /> : (
            <div className="trend">
              {data.trend.map((t) => (
                <div key={t.date} className="trend__col" title={`${t.date}: ${t.count}`}>
                  <div className="trend__bar" style={{ height: `${(t.count / maxTrend) * 100}%` }} />
                  <span className="trend__label">{t.date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <Card>
      <div className={`kpi__value kpi__value--${tone ?? 'neutral'}`}>{value}</div>
      <div className="muted">{label}</div>
    </Card>
  );
}

function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="stack" style={{ gap: 'var(--space-2)' }}>
      {items.map((i) => (
        <div key={i.label}>
          <div className="row between"><span>{i.label}</span><strong>{i.value}</strong></div>
          <div className="bar"><div className="bar__fill" style={{ width: `${(i.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
