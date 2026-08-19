import type { Role } from '@incident/shared';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { LanguageSwitch, ThemeToggle } from '../components/Controls';
import { Button, Card } from '../components/ui';
import { useT } from '../i18n/I18nContext';
import './LoginPage.css';

const DEMO_USERS: { username: string; role: Role }[] = [
  { username: 'emma', role: 'business_user' },
  { username: 'sam', role: 'service_desk' },
  { username: 'alex', role: 'application_support' },
  { username: 'ivan', role: 'infrastructure_support' },
  { username: 'mary', role: 'manager' },
  { username: 'gary', role: 'management' },
];

export function LoginPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string })?.from ?? '/';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.login(username.trim(), password);
      setSession(res);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login__topbar">
        <LanguageSwitch />
        <ThemeToggle />
      </div>
      <Card className="login__card">
        <div className="login__head">
          <ShieldCheck size={32} aria-hidden="true" />
          <h1>{t('brand.name')}</h1>
          <p className="muted">{t('login.subtitle')}</p>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="username">{t('login.username')}</label>
            <input id="username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">{t('login.password')}</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          {error && <p className="field__error" role="alert">{error}</p>}
          <Button type="submit" block disabled={busy}>{busy ? t('login.signingIn') : t('login.signIn')}</Button>
        </form>
        <div className="login__demo">
          <p className="field__hint">{t('login.demoHint', { password: 'Passw0rd!' })}</p>
          <div className="login__demo-grid">
            {DEMO_USERS.map((u) => (
              <button
                key={u.username}
                type="button"
                className="login__demo-user"
                onClick={() => { setUsername(u.username); setPassword('Passw0rd!'); }}
              >
                <strong>{u.username}</strong>
                <span className="muted">{t(`role.${u.role}`)}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
