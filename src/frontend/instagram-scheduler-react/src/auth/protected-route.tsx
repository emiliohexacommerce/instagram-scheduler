import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';

const DEV_BYPASS = import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === 'true';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated && !DEV_BYPASS) return <Navigate to="/auth/login" state={{ from: location }} replace />;
  return <Outlet />;
}
