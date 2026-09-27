import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#c0c0c0',
        fontFamily: 'var(--font-sans)'
      }}>
        Cargando...
      </div>
    );
  }

  if (!user) {
    const fullPath = location.pathname + location.search;
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(fullPath)}`} replace />;
  }

  return <Outlet />;
}
