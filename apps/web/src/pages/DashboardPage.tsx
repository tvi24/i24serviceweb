import { type IncidentStatus, type KpiDimensionRow } from '@incident/shared';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, LoadingSkeleton } from '../components/ui';
import { useT } from '../i18n/I18nContext';
import { useKpi } from '../hooks/useIncidents';
import './Dashboard.css';

const RANGES = ['7d', '30d', 'qtd', 'ytd', 'all'] as const;

function fmtMins(t: (k: 'dash.minutes' | 'dash.hours', v: { n: number }) => string, mins: number | null): string {
  if (mins == null) return '—';
  return mins >= 90 ? t('dash.hours', { n: Math.round((mins / 60) * 10) / 10 }) : t('dash.minutes', { n: mins });
}

export function DashboardPage() {
  const t = useT();
  const navigate = useNavigate();
  const [range, setRange] = useState<string>('all');
  const { data, isLoading, isError, error, refetch, isFetching } = useKpi(range);

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState message={(error as Error)?.message ?? t('dash.loadFailed')} />;
  if (!data || !data.hasData) return <EmptyState title={t('dash.emptyTitle')} message={t('dash.emptyMsg')} />;

  const maxTrend = Math.max(1, ...data.trend.map((t) => t.count));
  const maxRecurring = Math.max(1, ...data.recurring.map((r) => r.count));
  const go = (params: Record<string, string>) => navigate(`/control-tower?${new URLSearchParams(params).toString()}`);

  return (
    <section>
      <div className="section-title">
        <div>
          <h1>{t('dash.title')}</h1>
          <p className="muted">{t('dash.subtitle')} · {t('dash.lastRefresh', { time: new Date(data.lastRefreshedAt).toLocaleTimeString() })}</p>
        </div>
        <div className="row">
          <div className="tabs" role="tablist" aria-label="time range" style={{ marginBottom: 0, borderBottom: 'none' }}>
            {RANGES.map((r) => (
              <button key={r} role="tab" aria-selected={range === r} className={`tab${range === r ? ' is-active' : ''}`} onClick={() => setRange(r)}>
                {t(`dash.range.${r}`)}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} aria-hidden="true" /> {isFetching ? t('dash.refreshing') : t('dash.refresh')}
          </Button>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi label={t('dash.slaCompliance')} value={`${data.slaCompliancePct}%`} sub={t('dash.complianceDetail', { met: data.slaMet, eligible: data.slaEligible })} tone={data.slaCompliancePct >= 90 ? 'good' : 'warn'} />
        <Kpi label={t('dash.slaBreaches')} value={data.breachedCount} tone={data.breachedCount === 0 ? 'good' : 'bad'} onClick={() => go({ queue: 'breached' })} />
        <Kpi label={t('dash.atRisk')} value={data.atRiskCount} tone={data.atRiskCount === 0 ? 'good' : 'warn'} onClick={() => go({ queue: 'at_risk' })} />
        <Kpi label={t('dash.avgCsat')} value={data.avgCsat != null ? t('dash.csatValue', { value: data.avgCsat }) : t('common.na')} tone={data.avgCsat && data.avgCsat >= 4 ? 'good' : undefined} />
      </div>
      <div className="kpi-grid">
        <Kpi label="P1" value={data.p1Count} tone={data.p1Count ? 'bad' : 'good'} onClick={() => go({ priority: 'P1' })} />
        <Kpi label="P2" value={data.p2Count} tone={data.p2Count ? 'warn' : 'good'} onClick={() => go({ priority: 'P2' })} />
        <Kpi label={t('dash.mtta')} value={fmtMins(t, data.mttaMinutes)} />
        <Kpi label={t('dash.mttr')} value={fmtMins(t, data.mttrMinutes)} />
        <Kpi label={t('dash.untriaged')} value={data.untriagedCount} onClick={() => go({ queue: 'untriaged' })} />
        <Kpi label={t('dash.reopenRate')} value={data.reopenRate != null ? `${data.reopenRate}%` : t('common.na')} />
      </div>

      <div className="dash-cols">
        <DimTable title={t('dash.byBu')} rows={data.byBu} onDrill={(r) => go(r.key === 'unset' ? {} : { bu: r.key })} />
        <DimTable title={t('dash.byService')} rows={data.byService} onDrill={(r) => go(r.key === 'unset' ? {} : { service: r.key })} />
        <DimTable title={t('dash.bySupportGroup')} rows={data.bySupportGroup} onDrill={(r) => go(r.key === 'unset' ? {} : { group: r.key })} />
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

function Kpi({ label, value, tone, sub, onClick }: { label: string; value: string | number; tone?: 'good' | 'warn' | 'bad'; sub?: string; onClick?: () => void }) {
  return (
    <Card hover={!!onClick}>
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
        style={onClick ? { cursor: 'pointer' } : undefined}
      >
        <div className={`kpi__value kpi__value--${tone ?? 'neutral'}`}>{value}</div>
        <div className="muted">{label}</div>
        {sub && <div className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 2 }}>{sub}</div>}
      </div>
    </Card>
  );
}

function DimTable({ title, rows, onDrill }: { title: string; rows: KpiDimensionRow[]; onDrill: (r: KpiDimensionRow) => void }) {
  const t = useT();
  return (
    <Card>
      <h3>{title}</h3>
      {rows.length === 0 ? <EmptyState title={t('common.noData')} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{title}</th><th>{t('dash.colTotal')}</th><th>{t('dash.colOpen')}</th><th>{t('dash.colBreached')}</th><th>{t('dash.colAtRisk')}</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} onClick={() => onDrill(r)} title={t('dash.drill')}>
                  <td><strong>{r.label}</strong></td>
                  <td>{r.total}</td>
                  <td>{r.open}</td>
                  <td>{r.breached > 0 ? <span className="badge badge--breached">{r.breached}</span> : r.breached}</td>
                  <td>{r.atRisk > 0 ? <span className="badge badge--at_risk">{r.atRisk}</span> : r.atRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
