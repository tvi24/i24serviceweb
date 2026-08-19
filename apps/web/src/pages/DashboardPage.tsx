import { type IncidentStatus } from '@incident/shared';
import { RefreshCw } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, LoadingSkeleton } from '../components/ui';
import { useT } from '../i18n/I18nContext';
import { useKpi } from '../hooks/useIncidents';
import './Dashboard.css';

export function DashboardPage() {
  const t = useT();
  const { data, isLoading, isError, error, refetch, isFetching } = useKpi();

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState message={(error as Error)?.message ?? t('dash.loadFailed')} />;
  if (!data || !data.hasData) return <EmptyState title={t('dash.emptyTitle')} message={t('dash.emptyMsg')} />;

  const maxTrend = Math.max(1, ...data.trend.map((t) => t.count));
  const maxRecurring = Math.max(1, ...data.recurring.map((r) => r.count));

  return (
    <section>
      <div className="section-title">
        <div>
          <h1>{t('dash.title')}</h1>
          <p className="muted">{t('dash.subtitle')}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={14} aria-hidden="true" /> {isFetching ? t('dash.refreshing') : t('dash.refresh')}
        </Button>
      </div>

      <div className="kpi-grid">
        <Kpi label={t('dash.slaCompliance')} value={`${data.slaCompliancePct}%`} tone={data.slaCompliancePct >= 90 ? 'good' : 'warn'} />
        <Kpi label={t('dash.slaBreaches')} value={data.slaBreachCount} tone={data.slaBreachCount === 0 ? 'good' : 'bad'} />
        <Kpi label={t('dash.reopened')} value={data.reopenCount} />
        <Kpi label={t('dash.avgCsat')} value={data.avgCsat != null ? t('dash.csatValue', { value: data.avgCsat }) : t('common.na')} tone={data.avgCsat && data.avgCsat >= 4 ? 'good' : undefined} />
      </div>

      <div className="dash-cols">
        <Card>
          <h3>{t('dash.byStatus')}</h3>
          <BarList items={Object.entries(data.countsByStatus).map(([k, v]) => ({ label: t(`status.${k as IncidentStatus}`), value: v }))} />
        </Card>
        <Card>
          <h3>{t('dash.byPriority')}</h3>
          <BarList items={['P1', 'P2', 'P3', 'P4'].map((p) => ({ label: p, value: data.countsByPriority[p] ?? 0 }))} />
        </Card>
        <Card>
          <h3>{t('dash.aging')}</h3>
          <BarList items={Object.entries(data.agingBuckets).map(([k, v]) => ({ label: k, value: v }))} />
        </Card>
      </div>

      <div className="dash-cols">
        <Card>
          <h3>{t('dash.recurring')}</h3>
          {data.recurring.length === 0 ? <EmptyState title={t('common.noData')} /> : (
            <div className="stack" style={{ gap: 'var(--space-2)' }}>
              {data.recurring.map((r) => (
                <div key={r.classification}>
                  <div className="row between"><span>{t(`class.${r.classification as 'application'}`)}</span><strong>{r.count}</strong></div>
                  <div className="bar"><div className="bar__fill" style={{ width: `${(r.count / maxRecurring) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3>{t('dash.trend')}</h3>
          {data.trend.length === 0 ? <EmptyState title={t('common.noData')} /> : (
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
