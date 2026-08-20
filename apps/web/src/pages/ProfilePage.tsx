import type { User } from '@incident/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, CheckCircle2, Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, ErrorState, LoadingSkeleton } from '../components/ui';
import { useT } from '../i18n/I18nContext';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

const AVATAR_MAX = 512 * 1024;

export function ProfilePage() {
  const t = useT();
  const qc = useQueryClient();
  const { user: authUser } = useAuth();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['profile'], queryFn: () => api.getMyProfile() });

  const [draft, setDraft] = useState<Partial<User>>({});
  const [saved, setSaved] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data?.user) {
      const u = data.user;
      setDraft({
        displayName: u.displayName,
        jobTitle: u.jobTitle ?? '',
        timeZone: u.timeZone ?? '',
        preferredLanguage: u.preferredLanguage ?? null,
        preferredChannel: u.preferredChannel ?? null,
        avatarUrl: u.avatarUrl ?? null,
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (patch: Partial<User>) => api.updateMyProfile(patch),
    onSuccess: () => { setSaved(true); qc.invalidateQueries({ queryKey: ['profile'] }); },
  });
  const addEmail = useMutation({
    mutationFn: (emailAddress: string) => api.addMyEmail({ emailAddress, emailType: 'alternate' }),
    onSuccess: () => { setNewEmail(''); qc.invalidateQueries({ queryKey: ['profile'] }); },
  });
  const verify = useMutation({
    mutationFn: (id: string) => api.verifyMyEmail(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });

  if (isLoading || !data) return <LoadingSkeleton rows={6} />;
  if (isError) return <ErrorState message={(error as Error)?.message ?? t('profile.loadFailed')} />;

  const displayName = draft.displayName ?? data.user.displayName;
  const avatar = draft.avatarUrl ?? data.user.avatarUrl;

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > AVATAR_MAX) { alert(t('profile.avatarHint')); return; }
    const reader = new FileReader();
    reader.onload = () => { setDraft((d) => ({ ...d, avatarUrl: String(reader.result) })); setSaved(false); };
    reader.readAsDataURL(file);
  }

  return (
    <section>
      <div className="section-title">
        <div>
          <h1>{t('profile.title')}</h1>
          <p className="muted">{t('profile.subtitle')}</p>
        </div>
      </div>

      <div className="grid-2">
        <Card>
          <div className="row" style={{ gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            {avatar ? (
              <img src={avatar} alt="" width={72} height={72} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div aria-hidden="true" style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-primary-weak)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)' }}>
                {initials(displayName)}
              </div>
            )}
            <div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onPickFile} style={{ display: 'none' }} />
              <div className="row" style={{ gap: 'var(--space-2)' }}>
                <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>{t('profile.avatarUpload')}</Button>
                {avatar && <Button variant="ghost" size="sm" onClick={() => { setDraft((d) => ({ ...d, avatarUrl: null })); setSaved(false); }}>{t('profile.avatarRemove')}</Button>}
              </div>
              <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 'var(--space-2)' }}>{t('profile.avatarHint')}</p>
            </div>
          </div>

          <div className="field">
            <label>{t('profile.displayName')}</label>
            <input className="input" value={draft.displayName ?? ''} onChange={(e) => { setDraft({ ...draft, displayName: e.target.value }); setSaved(false); }} />
          </div>
          <div className="field">
            <label>{t('profile.jobTitle')}</label>
            <input className="input" value={draft.jobTitle ?? ''} onChange={(e) => { setDraft({ ...draft, jobTitle: e.target.value }); setSaved(false); }} />
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>{t('profile.preferredLanguage')}</label>
              <select className="input" value={draft.preferredLanguage ?? ''} onChange={(e) => { setDraft({ ...draft, preferredLanguage: (e.target.value || null) as User['preferredLanguage'] }); setSaved(false); }}>
                <option value="">{t('common.dash')}</option>
                <option value="th">ไทย</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>{t('profile.preferredChannel')}</label>
              <select className="input" value={draft.preferredChannel ?? ''} onChange={(e) => { setDraft({ ...draft, preferredChannel: (e.target.value || null) as User['preferredChannel'] }); setSaved(false); }}>
                <option value="">{t('common.dash')}</option>
                <option value="email">{t('profile.channel.email')}</option>
                <option value="in_app">{t('profile.channel.in_app')}</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>{t('profile.timeZone')}</label>
            <input className="input" value={draft.timeZone ?? ''} onChange={(e) => { setDraft({ ...draft, timeZone: e.target.value }); setSaved(false); }} placeholder="Asia/Bangkok" />
          </div>
          <div className="row" style={{ marginTop: 'var(--space-3)' }}>
            <Button disabled={save.isPending} onClick={() => save.mutate(draft)}>{save.isPending ? t('profile.saving') : t('profile.save')}</Button>
            {saved && <span className="badge badge--within_target"><CheckCircle2 size={13} aria-hidden="true" /> {t('profile.saved')}</span>}
          </div>
          {save.isError && <p className="muted" style={{ color: 'var(--color-danger)' }}>{(save.error as Error)?.message}</p>}
        </Card>

        <Card>
          <h2 style={{ fontSize: 'var(--fs-lg)', marginTop: 0 }}>{t('profile.emails')}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {data.emails.map((em) => (
              <li key={em.id} className="row" style={{ justifyContent: 'space-between', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2) var(--space-3)' }}>
                <span className="row" style={{ gap: 'var(--space-2)' }}>
                  <Mail size={16} aria-hidden="true" />
                  <span>{em.emailAddress}</span>
                  <span className="badge badge--status">{t(`profile.emailType.${em.emailType}`)}</span>
                  {em.isPrimary && <span className="badge badge--status">{t('profile.emailPrimary')}</span>}
                </span>
                {em.isVerified ? (
                  <span className="badge badge--within_target"><BadgeCheck size={13} aria-hidden="true" /> {t('profile.emailVerified')}</span>
                ) : (
                  <Button variant="secondary" size="sm" disabled={verify.isPending} onClick={() => verify.mutate(em.id)}>{t('profile.verify')}</Button>
                )}
              </li>
            ))}
          </ul>
          <div className="field" style={{ marginTop: 'var(--space-3)' }}>
            <label>{t('profile.addEmail')}</label>
            <div className="row" style={{ gap: 'var(--space-2)' }}>
              <input className="input" type="email" value={newEmail} placeholder={t('profile.addEmailPlaceholder')} onChange={(e) => setNewEmail(e.target.value)} />
              <Button variant="secondary" disabled={addEmail.isPending || !newEmail.trim()} onClick={() => addEmail.mutate(newEmail.trim())}>{t('profile.addEmail')}</Button>
            </div>
            {addEmail.isError && <p className="muted" style={{ color: 'var(--color-danger)' }}>{(addEmail.error as Error)?.message}</p>}
          </div>
        </Card>
      </div>
    </section>
  );
}
