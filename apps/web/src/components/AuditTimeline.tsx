import type { Activity, AuditEvent, IncidentStatus } from '@incident/shared';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/en';
import { EmptyState } from './ui';
import './AuditTimeline.css';

const ACTIVITY_LABEL_KEY: Record<string, TranslationKey> = {
  work_note: 'activity.work_note',
  status_change: 'activity.status_change',
  assignment: 'activity.assignment',
  resolution: 'activity.resolution',
  reopen: 'activity.reopen',
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  const t = useT();
  if (activities.length === 0) return <EmptyState title={t('activity.emptyTitle')} />;
  return (
    <ol className="timeline">
      {activities.map((a) => (
        <li key={a.id} className="timeline__item">
          <span className="timeline__dot" aria-hidden="true" />
          <div>
            <div className="timeline__head">
              <strong>{ACTIVITY_LABEL_KEY[a.type] ? t(ACTIVITY_LABEL_KEY[a.type]) : a.type}</strong>
              <span className="muted">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
            {a.type === 'status_change' && (
              <div className="muted">
                {t(`status.${a.fromStatus as IncidentStatus}`)} → {t(`status.${a.toStatus as IncidentStatus}`)}
              </div>
            )}
            {a.note && <div>{a.note}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  const t = useT();
  if (!events || events.length === 0) return <EmptyState title={t('audit.emptyTitle')} />;
  return (
    <ol className="timeline">
      {events.map((e) => (
        <li key={e.id} className="timeline__item">
          <span className="timeline__dot" aria-hidden="true" />
          <div>
            <div className="timeline__head">
              <strong>{e.action}</strong>
              <span className="muted">{new Date(e.createdAt).toLocaleString()}</span>
            </div>
            <div className="muted">{t('audit.by', { actor: e.actorLabel })}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
