import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getHomePathForRole } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return children;
}
