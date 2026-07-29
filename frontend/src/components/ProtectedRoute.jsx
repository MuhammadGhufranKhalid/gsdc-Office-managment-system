import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './Spinner.jsx';

/**
 * Guards a route by authentication and, optionally, by scope.
 *
 * @param {'super'|'company'} [scope] restrict to a principal type. A Super
 *        Admin landing on a company route (or vice versa) is redirected to
 *        their own home rather than shown an error.
 */
export default function ProtectedRoute({ children, scope }) {
  const { user, scope: current, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid h-screen place-items-center">
        <Spinner label="Authenticating…" />
      </div>
    );
  }

  if (!user) {
    const to = scope === 'super' ? '/super-admin/login' : '/login';
    return <Navigate to={to} state={{ from: location }} replace />;
  }

  if (scope && current !== scope) {
    return <Navigate to={current === 'super' ? '/super-admin' : '/'} replace />;
  }

  return children;
}
