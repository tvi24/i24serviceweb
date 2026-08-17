import type { AuthUser, Role } from '@incident/shared';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { setAuthToken } from '../api/apiClient';

interface Session {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setSession: (session: Session) => void;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const STORAGE_KEY = 'incident.session';

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(() => {
    const s = loadSession();
    setAuthToken(s?.token ?? null);
    return s;
  });

  const setSession = useCallback((next: Session) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAuthToken(next.token);
    setSessionState(next);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setSessionState(null);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => {
      if (!session) return false;
      return roles.some((r) => session.user.roles.includes(r));
    },
    [session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: !!session,
      setSession,
      logout,
      hasRole,
    }),
    [session, setSession, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
