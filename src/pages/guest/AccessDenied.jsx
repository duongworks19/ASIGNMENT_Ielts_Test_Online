import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardPathByRole } from '../../services/authService';

export default function AccessDenied() {
  const { user } = useAuth();
  const location = useLocation();
  const dashboard = location.state?.dashboard || getDashboardPathByRole(user?.role);
  return (
    <div className="container py-5 text-center">
      <div className="display-1 fw-bold text-danger">403</div>
      <h1 className="h3">Bạn không có quyền truy cập trang này</h1>
      <p className="text-muted">Vui lòng quay lại khu vực phù hợp với tài khoản của bạn.</p>
      <Link className="btn btn-primary rounded-pill px-4" to={dashboard === '/403' ? '/' : dashboard}>Về trang phù hợp</Link>
    </div>
  );
}
