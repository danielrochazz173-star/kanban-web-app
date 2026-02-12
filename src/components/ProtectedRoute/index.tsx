import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../api';

type Props = {
  children: React.ReactNode;
  roles?: Array<User['role']>;
};

export default function ProtectedRoute({ children, roles }: Props) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && roles.length && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'gestor' ? '/gestor' : '/'} replace />;
  }
  return <>{children}</>;
}
