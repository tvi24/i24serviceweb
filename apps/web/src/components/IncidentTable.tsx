import type { Incident } from '@incident/shared';
import { useNavigate } from 'react-router-dom';
import { PriorityBadge, StatusBadge } from './ui';

export function IncidentTable({ incidents }: { incidents: Incident[] }) {
  const navigate = useNavigate();
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Group</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((i) => (
            <tr key={i.id} onClick={() => navigate(`/incidents/${i.id}`)} tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/incidents/${i.id}`); }}>
              <td><code>{i.ticketId}</code></td>
              <td>{i.title}</td>
              <td><PriorityBadge priority={i.priority} /></td>
              <td><StatusBadge status={i.status} /></td>
              <td className="muted">{i.supportGroup ?? '—'}</td>
              <td className="muted">{new Date(i.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
