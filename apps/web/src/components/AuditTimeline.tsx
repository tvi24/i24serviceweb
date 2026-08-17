import type { Activity, AuditEvent } from '@incident/shared';
import { EmptyState } from './ui';
import './AuditTimeline.css';

type TimelineItem =
  | { kind: 'activity'; at: string; label: string; note?: string | null }
  | { kind: 'audit'; at: string; label: string; note?: string | null };

const ACTIVITY_LABEL: Record<string, string> = {
  work_note: 'Work note',
  status_change: 'Status changed',
  assignment: 'Assignment',
  resolution: 'Resolved',
  reopen: 'Reopened',
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return <EmptyState title="No activity yet" />;
  return (
    <ol className="timeline">
      {activities.map((a) => (
        <li key={a.id} className="timeline__item">
          <span className="timeline__dot" aria-hidden="true" />
          <div>
            <div className="timeline__head">
              <strong>{ACTIVITY_LABEL[a.type] ?? a.type}</strong>
              <span className="muted">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
            {a.type === 'status_change' && <div className="muted">{a.fromStatus} → {a.toStatus}</div>}
            {a.note && <div>{a.note}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (!events || events.length === 0) return <EmptyState title="No audit records" />;
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
            <div className="muted">by {e.actorLabel}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
