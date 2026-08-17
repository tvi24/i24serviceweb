import type { Role } from '@incident/shared';
import { Bell, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useAlerts } from '../hooks/useIncidents';
import './AppShell.css';

interface NavItem {
  to: string;
  label: string;
  roles: Role[];
}

const NAV: NavItem[] = [
  { to: '/intake', label: 'Report Incident', roles: ['business_user'] },
  { to: '/my-incidents', label: 'My Incidents', roles: ['business_user'] },
  { to: '/control-tower', label: 'Control Tower', roles: ['service_desk', 'application_support', 'infrastructure_support', 'manager', 'management'] },
  { to: '/dashboard', label: 'Dashboard', roles: ['manager', 'management'] },
  { to: '/sla-config', label: 'SLA Config', roles: ['manager', 'service_desk'] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const alerts = useAlerts();
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
            <button className="app-shell__menu-btn" aria-label="Toggle navigation" onClick={() => setDrawerOpen((o) => !o)}>
              {drawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <NavLink className="app-shell__brand" to="/">
              <ShieldCheck size={24} aria-hidden="true" />
              <span>Incident Management</span>
            </NavLink>
          </div>

          <nav className="app-shell__nav" aria-label="Primary">
            {items.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `app-shell__link${isActive ? ' is-active' : ''}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="row" style={{ gap: 'var(--space-3)' }}>
            <NavLink to="/alerts" className="app-shell__bell" aria-label={`Alert center, ${unacked} unread`}>
              <Bell size={20} aria-hidden="true" />
              {unacked > 0 && <span className="app-shell__badge">{unacked}</span>}
            </NavLink>
            <div className="app-shell__user">
              <span className="app-shell__user-name">{user?.displayName}</span>
            </div>
            <button className="app-shell__icon-btn" onClick={handleLogout} aria-label="Sign out">
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {drawerOpen && (
          <nav className="app-shell__drawer" aria-label="Mobile navigation">
            {items.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setDrawerOpen(false)} className={({ isActive }) => `app-shell__drawer-link${isActive ? ' is-active' : ''}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="container app-shell__content">{children}</main>
    </div>
  );
}
