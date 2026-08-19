import { PRIORITIES, type SlaConfig } from '@incident/shared';
import { useEffect, useState } from 'react';
import { Button, Card, ErrorState, LoadingSkeleton } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { useT } from '../i18n/I18nContext';
import { useSlaConfig, useUpdateSlaConfig } from '../hooks/useIncidents';

export function SlaConfigPage() {
  const t = useT();
  const { hasRole } = useAuth();
  const canEdit = hasRole('manager');
  const { data, isLoading, isError, error } = useSlaConfig();
  const update = useUpdateSlaConfig();
  const [draft, setDraft] = useState<SlaConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (data) setDraft(structuredClone(data)); }, [data]);

  if (isLoading || !draft) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState message={(error as Error)?.message ?? t('slacfg.loadFailed')} />;

  function setTarget(p: string, key: 'responseMin' | 'resolutionMin' | 'resolutionBd', value: number) {
    setDraft((d) => {
      if (!d) return d;
      const next = structuredClone(d);
      (next.targets[p as keyof typeof next.targets] as any)[key] = value;
      return next;
    });
    setSaved(false);
  }

  return (
    <section>
      <div className="section-title">
        <div>
          <h1>{t('slacfg.title')}</h1>
          <p className="muted">{canEdit ? t('slacfg.subtitleEdit') : t('slacfg.subtitleReadonly')}</p>
        </div>
      </div>

      <Card>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>{t('slacfg.priority')}</th><th>{t('slacfg.responseMin')}</th><th>{t('slacfg.resolution')}</th></tr>
            </thead>
            <tbody>
              {PRIORITIES.map((p) => {
                const target = draft.targets[p];
                const bd = typeof target.resolutionBd === 'number';
                return (
                  <tr key={p} style={{ cursor: 'default' }}>
                    <td><strong>{p}</strong></td>
                    <td>
                      <input className="input" type="number" min={1} value={target.responseMin} disabled={!canEdit}
                        onChange={(e) => setTarget(p, 'responseMin', Number(e.target.value))} style={{ maxWidth: 120 }} />
                    </td>
                    <td>
                      {bd ? (
                        <span>{t('slacfg.businessDays', { n: target.resolutionBd as number })}</span>
                      ) : (
                        <input className="input" type="number" min={1} value={target.resolutionMin} disabled={!canEdit}
                          onChange={(e) => setTarget(p, 'resolutionMin', Number(e.target.value))} style={{ maxWidth: 120 }} />
                      )}
                      {bd && canEdit && (
                        <input className="input" type="number" min={1} value={target.resolutionBd} aria-label={t('slacfg.bdAria', { priority: p })}
                          onChange={(e) => setTarget(p, 'resolutionBd', Number(e.target.value))} style={{ maxWidth: 120, marginTop: 6 }} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="row" style={{ marginTop: 'var(--space-4)' }}>
          <div className="field" style={{ maxWidth: 220 }}>
            <label>{t('slacfg.atRisk')}</label>
            <input className="input" type="number" min={1} max={99} value={draft.atRiskPct} disabled={!canEdit}
              onChange={(e) => { setDraft({ ...draft, atRiskPct: Number(e.target.value) }); setSaved(false); }} />
          </div>
          <div className="field" style={{ maxWidth: 220 }}>
            <label>{t('slacfg.reminderMax')}</label>
            <input className="input" type="number" min={0} max={10} value={draft.reminderMax} disabled={!canEdit}
              onChange={(e) => { setDraft({ ...draft, reminderMax: Number(e.target.value) }); setSaved(false); }} />
          </div>
        </div>

        {canEdit && (
          <div className="row" style={{ marginTop: 'var(--space-3)' }}>
            <Button disabled={update.isPending} onClick={() => update.mutate(draft, { onSuccess: () => setSaved(true) })}>
              {update.isPending ? t('slacfg.saving') : t('slacfg.save')}
            </Button>
            {saved && <span className="badge badge--within_target">{t('slacfg.saved')}</span>}
          </div>
        )}
      </Card>
    </section>
  );
}
