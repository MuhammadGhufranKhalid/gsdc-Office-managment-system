import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

import Login from './pages/Login.jsx';
import SuperAdminLogin from './pages/SuperAdminLogin.jsx';
import RegisterCompany from './pages/RegisterCompany.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Calendar from './pages/Calendar.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import ResourcePage from './pages/ResourcePage.jsx';

import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard.jsx';
import Companies from './pages/superadmin/Companies.jsx';
import CompanyAdmins from './pages/superadmin/CompanyAdmins.jsx';

import { resources } from './config/resources.jsx';

const MODULE_ROUTES = {
  employees: 'employees', teams: 'teams', departments: 'departments', clients: 'clients',
  projects: 'projects', tasks: 'tasks', milestones: 'milestones',
  timelogs: 'timelogs', attendance: 'attendance', leaves: 'leaves',
  payroll: 'payroll', contracts: 'contracts', meetings: 'meetings',
  assets: 'assets', notifications: 'notifications',
};

function HomeRedirect() {
  const { scope, loading } = useAuth();
  if (loading) return null;
  if (scope === 'super') return <Navigate to="/super-admin" replace />;
  if (scope === 'company') return <Navigate to="/" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterCompany />} />
      <Route path="/super-admin/login" element={<SuperAdminLogin />} />

      {}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute scope="super">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminDashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="admins" element={<CompanyAdmins />} />
      </Route>

      {}
      <Route
        element={
          <ProtectedRoute scope="company">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />

        {Object.entries(MODULE_ROUTES).map(([key, path]) => (
          <Route key={key} path={`/${path}`} element={<ResourcePage config={resources[key]} />} />
        ))}
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
