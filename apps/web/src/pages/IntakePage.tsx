import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/apiClient';
import { Button, Card } from '../components/ui';

const IMPACT_OPTIONS = ['high', 'medium', 'low'] as const;

export function IntakePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState<string>('');
  const [urgency, setUrgency] = useState<string>('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ticketId: string; duplicateWarning?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFields({});
    setError(null);
    setBusy(true);
    try {
      const idempotencyKey = `web-${title.trim().toLowerCase()}-${Date.now()}`.slice(0, 80);
      const res = await api.createIncident(
        { title, description, impact: impact || undefined, urgency: urgency || undefined },
        idempotencyKey
      );
      setResult(res);
      setTitle(''); setDescription(''); setImpact(''); setUrgency('');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) setFields(err.fields);
        else setError(err.message);
      } else setError('Submission failed.');
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <section style={{ maxWidth: 640, margin: '0 auto' }}>
        <Card>
          <div className="stack" style={{ alignItems: 'flex-start' }}>
            <CheckCircle2 size={40} color="var(--color-success)" aria-hidden="true" />
            <h2>Incident submitted</h2>
            <p>Your ticket has been created and is now traceable.</p>
            <p className="row"><strong>Ticket ID:</strong> <span className="badge badge--info">{result.ticketId}</span></p>
            {result.duplicateWarning && (
              <p className="row" style={{ color: 'var(--color-warning)' }}>
                <AlertTriangle size={16} aria-hidden="true" /> {result.duplicateWarning}
              </p>
            )}
            <div className="row">
              <Button variant="secondary" onClick={() => setResult(null)}>Report another</Button>
              <Link to="/my-incidents"><Button variant="ghost">View my incidents</Button></Link>
            </div>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1>Report an Incident</h1>
      <p className="muted">Describe the problem. A ticket ID will be created for tracking.</p>
      <Card>
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} aria-invalid={!!fields.title} />
            {fields.title && <span className="field__error">{fields.title}</span>}
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} aria-invalid={!!fields.description} />
            {fields.description && <span className="field__error">{fields.description}</span>}
            <span className="field__hint">Include what happened, when, and how many people are affected.</span>
          </div>
          <div className="row" style={{ gap: 'var(--space-4)' }}>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="impact">Impact (optional)</label>
              <select id="impact" className="select" value={impact} onChange={(e) => setImpact(e.target.value)}>
                <option value="">Auto-detect</option>
                {IMPACT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="urgency">Urgency (optional)</label>
              <select id="urgency" className="select" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                <option value="">Auto-detect</option>
                {IMPACT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="field__error" role="alert">{error}</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit incident'}</Button>
        </form>
      </Card>
    </section>
  );
}
