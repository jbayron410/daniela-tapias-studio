import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import AdminLayout from './AdminLayout';

function LoginGuard() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';

  if (loading) return null;
  if (user) return <Navigate to={redirect} replace />;
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