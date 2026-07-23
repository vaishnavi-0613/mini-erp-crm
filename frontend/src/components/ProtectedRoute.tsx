import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth, Role } from '../context/AuthContext';

export function ProtectedRoute({ children, allow }: { children: ReactNode; allow?: Role[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
