import { Link } from 'react-router-dom';
import { IncidentTable } from '../components/IncidentTable';
import { Button, EmptyState, ErrorState, LoadingSkeleton } from '../components/ui';
import { useT } from '../i18n/I18nContext';
import { useIncidents } from '../hooks/useIncidents';

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

      {isLoading && <LoadingSkeleton rows={5} />}
      {isError && <ErrorState message={(error as Error)?.message ?? t('common.loadFailed')} />}
      {data && (data.length === 0
        ? <EmptyState title={t('my.emptyTitle')} message={t('my.emptyMsg')} />
        : <IncidentTable incidents={data} />)}
    </section>
  );
}
