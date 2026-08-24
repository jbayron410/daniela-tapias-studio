import { useAuth } from '../../context/AuthContext';

export default function DashboardHeader({ onRefresh, loading }) {
  const { user, logout } = useAuth();

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <h1>Daniela Tapias Studio</h1>
        <span className="admin-badge">Admin</span>
      </div>
      <div className="admin-header-right">
        <button
          className="admin-refresh-btn"
          onClick={onRefresh}
          disabled={loading}
          title="Refrescar datos"
        >
          {loading ? '⏳' : '🔄'} {loading ? 'Cargando...' : 'Refrescar'}
        </button>
        <span className="admin-user">{user?.email}</span>
        <button onClick={logout} className="admin-logout-btn">Cerrar Sesión</button>
      </div>
    </header>
  );
}
