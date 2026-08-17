import type { Role } from '@incident/shared';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AppShell } from './components/AppShell';
import { EmptyState } from './components/ui';
import { AlertCenterPage } from './pages/AlertCenterPage';
import { ControlTowerPage } from './pages/ControlTowerPage';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentWorkspacePage } from './pages/IncidentWorkspacePage';
import { IntakePage } from './pages/IntakePage';
import { LoginPage } from './pages/LoginPage';
import { MyIncidentsPage } from './pages/MyIncidentsPage';
import { SlaConfigPage } from './pages/SlaConfigPage';

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) {
    return <EmptyState title="Access denied" message="You do not have permission to view this page." />;
  }
  return <>{children}</>;
}

function HomeRedirect() {
  const { hasRole } = useAuth();
  if (hasRole('business_user') && !hasRole('service_desk', 'manager', 'application_support', 'infrastructure_support', 'management')) {
    return <Navigate to="/my-incidents" replace />;
  }
  if (hasRole('management') && !hasRole('manager', 'service_desk')) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/control-tower" replace />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'intake', element: <RequireRole roles={['business_user']}><IntakePage /></RequireRole> },
      { path: 'my-incidents', element: <RequireRole roles={['business_user']}><MyIncidentsPage /></RequireRole> },
      {
        path: 'control-tower',
        element: (
          <RequireRole roles={['service_desk', 'application_support', 'infrastructure_support', 'manager', 'management']}>
            <ControlTowerPage />
          </RequireRole>
        ),
      },
      { path: 'incidents/:id', element: <IncidentWorkspacePage /> },
      { path: 'alerts', element: <AlertCenterPage /> },
      { path: 'dashboard', element: <RequireRole roles={['manager', 'management']}><DashboardPage /></RequireRole> },
      { path: 'sla-config', element: <RequireRole roles={['manager', 'service_desk']}><SlaConfigPage /></RequireRole> },
      { path: '*', element: <EmptyState title="Not found" message="This page does not exist." /> },
    ],
  },
]);
