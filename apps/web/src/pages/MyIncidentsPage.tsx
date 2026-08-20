import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/apiClient';
import { IncidentTable } from '../components/IncidentTable';
import { Button, Card, EmptyState, ErrorState, LoadingSkeleton } from '../components/ui';
import { useT } from '../i18n/I18nContext';
import { useIncidents } from '../hooks/useIncidents';

function MySlaSummaryCard() {
  const t = useT();
  const { data } = useQuery({ queryKey: ['my-sla'], queryFn: () => api.getMySlaSummary() });
  if (!data) return null;
  const cell = (label: string, value: string | number, cls?: string) => (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', color: cls }}>{value}</div>
    </div>
  );
  return (
    <Card>
      <div className="row" style={{ gap: 'var(--space-5)', alignItems: 'flex-start' }}>
        {cell(t('mysla.within'), data.withinPct == null ? t('common.dash') : `${data.withinPct}%`, 'var(--color-success)')}
        {cell(t('mysla.atRisk'), data.atRisk, 'var(--color-warning)')}
        {cell(t('mysla.breached'), data.breached, 'var(--color-danger)')}
        {cell(t('mysla.open'), data.open)}
      </div>
    </Card>
  );
}

export function MyIncidentsPage() {
  const t = useT();
  const { data, isLoading, isError, error } = useIncidents({ mine: true });

  return (
    <section>
      <div className="section-title">
        <div>
          <h1>{t('my.title')}</h1>
          <p className="muted">{t('my.subtitle')}</p>
        </div>
        <Link to="/intake"><Button>{t('nav.reportIncident')}</Button></Link>
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}><MySlaSummaryCard /></div>

      {isLoading && <LoadingSkeleton rows={5} />}
      {isError && <ErrorState message={(error as Error)?.message ?? t('common.loadFailed')} />}
      {data && (data.length === 0
        ? <EmptyState title={t('my.emptyTitle')} message={t('my.emptyMsg')} />
        : <IncidentTable incidents={data} />)}
    </section>
  );
}
