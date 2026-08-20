import { CATEGORIES, CHANNELS, SUBCATEGORIES } from '@incident/shared';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api } from '../api/apiClient';
import { Button, Card } from '../components/ui';
import { useT } from '../i18n/I18nContext';

const IMPACT_OPTIONS = ['high', 'medium', 'low'] as const;

export function IntakePage() {
  const t = useT();
  const services = useQuery({ queryKey: ['services'], queryFn: () => api.getServices() });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState<string>('');
  const [urgency, setUrgency] = useState<string>('');
  const [channel, setChannel] = useState<string>('web_portal');
  const [serviceId, setServiceId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
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
        { title, description, impact: impact || undefined, urgency: urgency || undefined, channel: channel || undefined, serviceId: serviceId || null, category: category || null, subcategory: subcategory || null },
        idempotencyKey
      );
      setResult(res);
      setTitle(''); setDescription(''); setImpact(''); setUrgency(''); setServiceId(''); setCategory(''); setSubcategory('');
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
          <div className="row" style={{ gap: 'var(--space-4)' }}>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="channel">{t('intake.channel')}</label>
              <select id="channel" className="select" value={channel} onChange={(e) => setChannel(e.target.value)}>
                {CHANNELS.map((c) => <option key={c} value={c}>{t(`channel.${c}`)}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="service">{t('intake.service')} <span className="muted">({t('intake.optional')})</span></label>
              <select id="service" className="select" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">{t('common.dash')}</option>
                {(services.data ?? []).filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="row" style={{ gap: 'var(--space-4)' }}>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="category">{t('intake.category')} <span className="muted">({t('intake.optional')})</span></label>
              <select id="category" className="select" value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}>
                <option value="">{t('common.dash')}</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{t(`class.${c}`)}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label htmlFor="subcategory">{t('intake.subcategory')} <span className="muted">({t('intake.optional')})</span></label>
              <select id="subcategory" className="select" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} disabled={!category}>
                <option value="">{t('common.dash')}</option>
                {(SUBCATEGORIES[category] ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
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
