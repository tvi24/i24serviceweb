import type { Role } from '@incident/shared';
import { Bell, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useAlerts } from '../hooks/useIncidents';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/en';
import { LanguageSwitch, ThemeToggle } from './Controls';
import './AppShell.css';

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  roles: Role[];
}

const NAV: NavItem[] = [
  { to: '/intake', labelKey: 'nav.reportIncident', roles: ['business_user'] },
  { to: '/my-incidents', labelKey: 'nav.myRequests', roles: ['business_user'] },
  { to: '/control-tower', labelKey: 'nav.queues', roles: ['service_desk', 'application_support', 'infrastructure_support', 'manager', 'management'] },
  { to: '/dashboard', labelKey: 'nav.execDashboard', roles: ['manager', 'management'] },
  { to: '/sla-config', labelKey: 'nav.slaConfig', roles: ['manager', 'service_desk'] },
  { to: '/admin', labelKey: 'nav.admin', roles: ['platform_admin'] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const alerts = useAlerts();
  const t = useT();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const unacked = (alerts.data ?? []).filter((a) => !a.acknowledgedAt).length;
  const items = NAV.filter((n) => hasRole(...n.roles));

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-shell__bar">
        <div className="container app-shell__bar-inner">
          <div className="row" style={{ gap: 'var(--space-3)' }}>
            <button className="app-shell__menu-btn" aria-label={t('shell.toggleNav')} onClick={() => setDrawerOpen((o) => !o)}>
              {drawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <NavLink className="app-shell__brand" to="/">
              <ShieldCheck size={24} aria-hidden="true" />
              <span>{t('brand.name')}</span>
            </NavLink>
          </div>

          <nav className="app-shell__nav" aria-label="Primary">
            {items.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `app-shell__link${isActive ? ' is-active' : ''}`}>
                {t(n.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="row" style={{ gap: 'var(--space-3)' }}>
            <LanguageSwitch />
            <ThemeToggle />
            <NavLink to="/alerts" className="app-shell__bell" aria-label={t('shell.alertCenter', { count: unacked })}>
              <Bell size={20} aria-hidden="true" />
              {unacked > 0 && <span className="app-shell__badge">{unacked}</span>}
            </NavLink>
            <NavLink to="/profile" className="app-shell__user" aria-label={t('nav.profile')}>
              <span className="app-shell__user-name">{user?.displayName}</span>
            </NavLink>
            <button className="app-shell__icon-btn" onClick={handleLogout} aria-label={t('shell.signOut')}>
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {drawerOpen && (
          <nav className="app-shell__drawer" aria-label="Mobile navigation">
            {items.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setDrawerOpen(false)} className={({ isActive }) => `app-shell__drawer-link${isActive ? ' is-active' : ''}`}>
                {t(n.labelKey)}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="container app-shell__content">{children}</main>
    </div>
  );
}
