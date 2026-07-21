import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Spinner, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getDashboardSummary } from '../../services/adminService';
import { getCurrentUser } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

const STAT_DEFS = [
  {
    key: 'totalUsers',
    label: 'Tổng người dùng',
    icon: 'bi-people-fill',
    gradient: 'tp-gradient-blue',
    link: '/admin/users',
    linkText: 'Quản lý thành viên',
  },
  {
    key: 'totalCourses',
    label: 'Khóa học hệ thống',
    icon: 'bi-journal-check',
    gradient: 'tp-gradient-green',
    link: '/admin/courses',
    linkText: 'Quản lý khóa học',
  },
  {
    key: 'pendingContent',
    label: 'Hàng chờ duyệt',
    icon: 'bi-shield-exclamation',
    gradient: 'tp-gradient-amber',
    link: '/admin/courses', // Approvals moved to individual pages
    linkText: 'Duyệt nội dung',
  },
  {
    key: 'totalLogs',
    label: 'Lịch sử hoạt động',
    icon: 'bi-card-text',
    gradient: 'tp-gradient-purple',
    link: '/admin/audit-logs',
    linkText: 'Xem Audit Logs',
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    pendingContent: 0,
    totalLogs: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user: contextUser } = useAuth();
  const currentUser = contextUser || getCurrentUser();
  const firstName = currentUser?.fullName?.split(' ').slice(-1)[0] || 'System Admin';

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const summary = await getDashboardSummary();
      setStats(summary.stats);
      setRecentLogs(Array.isArray(summary.recentLogs) ? summary.recentLogs : []);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải dữ liệu tổng quan quản trị.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getActionBadge = (action) => {
    const normalizedAction = String(action || '').toUpperCase();
    if (normalizedAction.includes('DELETE')) return <Badge bg="danger">Delete</Badge>;
    if (normalizedAction.includes('CREATE') || normalizedAction.includes('ADD')) return <Badge bg="success">Create</Badge>;
    if (normalizedAction.includes('UPDATE') || normalizedAction.includes('EDIT') || normalizedAction.includes('CHANGE')) return <Badge bg="warning" text="dark">Update</Badge>;
    if (normalizedAction.includes('LOGIN') || normalizedAction.includes('LOGOUT')) return <Badge bg="info">Auth</Badge>;
    return <Badge bg="secondary">System</Badge>;
  };

  if (loading) {
    return (
      <div className="tp-loading">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
        <p className="mt-3 fw-semibold text-secondary">Đang tải Overview...</p>
      </div>
    );
  }

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <div className="tp-hero">
        <div className="tp-hero-dots">
          {Array(15).fill(0).map((_, i) => <span key={i}></span>)}
        </div>
        <div className="tp-hero-inner">
          <Container fluid="xxl" className="px-4">
            <div className="tp-hero-badge">
              <i className="bi bi-shield-lock-fill"></i>
              IELTS MASTER — Admin Center
            </div>
            <h1 className="tp-hero-title">
              Xin chào, <span>{firstName}</span>! 👋
            </h1>
            <p className="tp-hero-sub">
              Chào mừng bạn đến với trung tâm quản trị. Giám sát toàn bộ hoạt động, người dùng và hệ thống từ một nơi duy nhất.
            </p>
            <div className="tp-hero-actions">
              <Link to="/admin/users" className="tp-btn-primary">
                <i className="bi bi-people-fill"></i> Quản lý Người dùng
              </Link>
              <Link to="/admin/transactions" className="tp-btn-ghost">
                <i className="bi bi-credit-card-fill"></i> Lịch sử Giao dịch
              </Link>
            </div>
          </Container>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">
          
          {error && (
            <div className="tp-error mb-4">
              <i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i>
              <div>
                <div className="fw-bold text-dark mb-1">Lỗi kết nối</div>
                <div className="text-secondary small">{error}</div>
                <Button variant="outline-danger" size="sm" className="mt-2" onClick={fetchStats}>
                  Thử tải lại
                </Button>
              </div>
            </div>
          )}

          {/* ── STAT CARDS ── */}
          <Row className="g-3 mb-4">
            {STAT_DEFS.map(def => (
              <Col key={def.key} xl={3} md={6}>
                <div className="tp-stat-card">
                  <div className={`tp-stat-icon ${def.gradient}`}>
                    <i className={`bi ${def.icon}`}></i>
                  </div>
                  <div>
                    <div className="tp-stat-label">{def.label}</div>
                    <div className="tp-stat-value">{stats[def.key]}</div>
                    <Link to={def.link} className="tp-stat-link">
                      {def.linkText} <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* ── RECENT AUDIT LOGS TABLE ── */}
          <div className="tp-card-static">
            <div className="tp-card-header">
              <div className="d-flex align-items-center gap-3">
                <div className="tp-card-header-icon tp-gradient-slate">
                  <i className="bi bi-activity"></i>
                </div>
                <div>
                  <h5 className="tp-card-title mb-0">Hoạt động hệ thống gần đây</h5>
                  <p className="text-secondary small mb-0" style={{ fontSize: '0.8rem' }}>5 logs mới nhất của Admin</p>
                </div>
              </div>
              <span className="tp-badge tp-badge-info">Trực tiếp</span>
            </div>

            {recentLogs.length === 0 ? (
              <div className="tp-empty">
                <div className="tp-empty-icon">
                  <i className="bi bi-shield-check"></i>
                </div>
                <div className="tp-empty-title">Chưa có hoạt động nào</div>
                <p className="tp-empty-sub">Các thay đổi quan trọng trên hệ thống sẽ được ghi nhận tại đây.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tp-table">
                  <thead>
                    <tr>
                      <th className="ps-4">Timestamp</th>
                      <th>Admin ID</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th className="text-end pe-4">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map(log => (
                      <tr key={log.id}>
                        <td className="ps-4">
                          <span className="text-secondary small fw-medium">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <code className="text-secondary small">{log.actorId || 'System'}</code>
                        </td>
                        <td>{getActionBadge(log.action)}</td>
                        <td>
                          <span className="fw-semibold text-dark">{log.targetType || log.targetEntity || log.action}</span>
                          {log.targetId && <code className="ms-2 small text-muted">#{log.targetId}</code>}
                        </td>
                        <td className="text-end pe-4">
                          <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                            {log.newValue ? JSON.stringify(log.newValue) : 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
        </Container>
      </div>
    </div>
  );
}
