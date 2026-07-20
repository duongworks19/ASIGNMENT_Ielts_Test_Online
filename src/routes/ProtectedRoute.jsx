import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser, getDashboardPathByRole, isRoleAllowed } from '../services/authService';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isRoleAllowed(user, allowedRoles)) {
    return <Navigate to={getDashboardPathByRole(user.role)} replace />;
  }

  return <Outlet />;
}
