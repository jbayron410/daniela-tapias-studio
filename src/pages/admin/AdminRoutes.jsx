import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import AdminLayout from './AdminLayout';

function LoginGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/admin" replace />;
  return <Login />;
}

export default function AdminRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginGuard />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}