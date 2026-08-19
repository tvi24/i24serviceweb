import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/apiClient';
import { Button, Card } from '../components/ui';
import { useT } from '../i18n/I18nContext';

const IMPACT_OPTIONS = ['high', 'medium', 'low'] as const;

export function IntakePage() {
  const t = useT();
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
      } else setError(t('intake.submitFailed'));
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
            <h2>{t('intake.successTitle')}</h2>
            <p>{t('intake.successBody')}</p>
            <p className="row"><strong>{t('intake.ticketId')}</strong> <span className="badge badge--info">{result.ticketId}</span></p>
            {result.duplicateWarning && (
              <p className="row" style={{ color: 'var(--color-warning)' }}>
                <AlertTriangle size={16} aria-hidden="true" /> {result.duplicateWarning}
              </p>
            )}
            <div className="row">
              <Button variant="secondary" onClick={() => setResult(null)}>{t('intake.reportAnother')}</Button>
              <Link to="/my-incidents"><Button variant="ghost">{t('intake.viewMine')}</Button></Link>
            </div>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1>{t('intake.title')}</h1>
      <p className="muted">{t('intake.subtitle')}</p>
      <Card>
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="title">{t('intake.titleLabel')}</label>
            <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} aria-invalid={!!fields.title} />
            {fields.title && <span className="field__error">{fields.title}</span>}
          </div>
          <div className="field">
            <label htmlFor="description">{t('intake.descLabel')}</label>
            <textarea id="description" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} aria-invalid={!!fields.description} />
            {fields.description && <span className="field__error">{fields.description}</span>}
            <span className="field__hint">{t('intake.descHint')}</span>
          </div>
          <div className="row" style={{ gap: 'var(--space-4)' }}>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="impact">{t('intake.impact')}</label>
              <select id="impact" className="select" value={impact} onChange={(e) => setImpact(e.target.value)}>
                <option value="">{t('intake.autoDetect')}</option>
                {IMPACT_OPTIONS.map((o) => <option key={o} value={o}>{t(`iu.${o}`)}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="urgency">{t('intake.urgency')}</label>
              <select id="urgency" className="select" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                <option value="">{t('intake.autoDetect')}</option>
                {IMPACT_OPTIONS.map((o) => <option key={o} value={o}>{t(`iu.${o}`)}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="field__error" role="alert">{error}</p>}
          <Button type="submit" disabled={busy}>{busy ? t('intake.submitting') : t('intake.submit')}</Button>
        </form>
      </Card>
    </section>
  );
}
