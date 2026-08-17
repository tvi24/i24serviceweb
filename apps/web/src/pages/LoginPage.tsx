import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { Button, Card } from '../components/ui';
import './LoginPage.css';

const DEMO_USERS = [
  { username: 'emma', role: 'Business User' },
  { username: 'sam', role: 'Service Desk' },
  { username: 'alex', role: 'Application Support' },
  { username: 'ivan', role: 'Infrastructure Support' },
  { username: 'mary', role: 'Manager' },
  { username: 'gary', role: 'Management' },
];

export function LoginPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      setError(err instanceof ApiError ? err.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <Card className="login__card">
        <div className="login__head">
          <ShieldCheck size={32} aria-hidden="true" />
          <h1>Incident Management</h1>
          <p className="muted">Sign in to continue</p>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          {error && <p className="field__error" role="alert">{error}</p>}
          <Button type="submit" block disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        </form>
        <div className="login__demo">
          <p className="field__hint">Workshop demo users (password: <code>Passw0rd!</code>)</p>
          <div className="login__demo-grid">
            {DEMO_USERS.map((u) => (
              <button
                key={u.username}
                type="button"
                className="login__demo-user"
                onClick={() => { setUsername(u.username); setPassword('Passw0rd!'); }}
              >
                <strong>{u.username}</strong>
                <span className="muted">{u.role}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
