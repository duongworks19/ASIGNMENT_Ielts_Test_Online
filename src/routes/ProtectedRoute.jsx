import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardPathByRole, isRoleAllowed } from '../services/authService';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const { user, isAuthenticated, isInitializing, logout } = useAuth();
  const hasInvalidRole = Boolean(user && !['student', 'teacher', 'admin'].includes(user.role));
  const hasBlockedStatus = Boolean(user && user.status !== 'active');

  useEffect(() => {
    if (!isInitializing && isAuthenticated && (hasInvalidRole || hasBlockedStatus)) logout();
  }, [hasBlockedStatus, hasInvalidRole, isAuthenticated, isInitializing, logout]);

  if (isInitializing) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100" role="status" aria-label="Đang kiểm tra phiên đăng nhập">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (hasInvalidRole) {
    return <Navigate to="/403" replace />;
  }

  if (hasBlockedStatus) {
    return <Navigate to="/login" replace state={{ accountStatus: user.status }} />;
  }

  if (!isRoleAllowed(user, allowedRoles)) {
    const dashboard = getDashboardPathByRole(user.role);
    return <Navigate to="/403" replace state={{ dashboard }} />;
  }

  return <Outlet />;
}
