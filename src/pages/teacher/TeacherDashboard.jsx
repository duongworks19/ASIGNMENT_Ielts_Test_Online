import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';
import { teacherLessonService } from '../../services/teacherLessonService';
import { teacherTestService } from '../../services/teacherTestService';
import { teacherStudentService } from '../../services/teacherStudentService';
import { teacherApprovalService } from '../../services/teacherApprovalService';

const STAT_DEFS = [
  {
    key: 'coursesCount',
    label: 'Khóa học đã tạo',
    icon: 'bi-journal-bookmark-fill',
    gradient: 'tp-gradient-blue',
    link: '/teacher/courses',
    linkText: 'Quản lý khóa học',
  },
  {
    key: 'lessonsCount',
    label: 'Bài học đã viết',
    icon: 'bi-file-earmark-text-fill',
    gradient: 'tp-gradient-green',
    link: '/teacher/lessons',
    linkText: 'Xem giáo trình',
  },
  {
    key: 'testsCount',
    label: 'Đề luyện tập',
    icon: 'bi-patch-question-fill',
    gradient: 'tp-gradient-purple',
    link: '/teacher/tests',
    linkText: 'Quản lý ngân hàng đề',
  },
  {
    key: 'studentsCount',
    label: 'Học viên đang học',
    icon: 'bi-people-fill',
    gradient: 'tp-gradient-amber',
    link: '/teacher/students',
    linkText: 'Theo dõi tiến độ',
  },
];

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ coursesCount: 0, lessonsCount: 0, testsCount: 0, studentsCount: 0 });
  const [recentApprovals, setRecentApprovals] = useState([]);

  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id || 'u-teacher-001';
  const firstName = currentUser?.fullName?.split(' ').slice(-1)[0] || 'Giảng viên';

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [courses, lessons, tests, enrollments, approvals] = await Promise.all([
        teacherCourseService.getCourses(teacherId),
        teacherLessonService.getLessons(teacherId),
        teacherTestService.getTests(teacherId),
        teacherStudentService.getEnrollments(),
        teacherApprovalService.getApprovalRequests(teacherId),
      ]);

      const teacherCourseIds = courses.map(c => String(c.id));
      const activeEnrollments = enrollments.filter(e => teacherCourseIds.includes(String(e.courseId)));
      const uniqueUserIds = new Set(activeEnrollments.map(e => e.userId));

      setStats({
        coursesCount: courses.length,
        lessonsCount: lessons.length,
        testsCount: tests.length,
        studentsCount: uniqueUserIds.size,
      });

      const sortedApprovals = [...approvals]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentApprovals(sortedApprovals);
    } catch (err) {
      setError('Không thể tải dữ liệu thống kê. Vui lòng kiểm tra lại kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="tp-badge tp-badge-success"><i className="bi bi-check-circle-fill"></i> Approved</span>;
      case 'pending': return <span className="tp-badge tp-badge-warning"><i className="bi bi-clock-fill"></i> Pending</span>;
      case 'rejected': return <span className="tp-badge tp-badge-danger"><i className="bi bi-x-circle-fill"></i> Rejected</span>;
      default: return <span className="tp-badge tp-badge-secondary">Draft</span>;
    }
  };

  if (loading) {
    return (
      <div className="tp-loading">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
        <p className="mt-3 fw-semibold text-secondary">Đang tải Dashboard...</p>
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
              <i className="bi bi-mortarboard-fill"></i>
              IELTS MASTER — Giảng Viên
            </div>
            <h1 className="tp-hero-title">
              Xin chào, <span>{firstName}</span>! 👋
            </h1>
            <p className="tp-hero-sub">
              Chào mừng trở lại không gian giảng dạy. Theo dõi thống kê, quản lý nội dung và hỗ trợ học viên một cách hiệu quả nhất.
            </p>
            <div className="tp-hero-actions">
              <Link to="/teacher/courses/create" className="tp-btn-primary">
                <i className="bi bi-plus-circle-fill"></i> Tạo Khóa học mới
              </Link>
              <Link to="/teacher/lessons/create" className="tp-btn-ghost">
                <i className="bi bi-pencil-fill"></i> Viết Bài học mới
              </Link>
            </div>
          </Container>
        </div>
      </div>

      {/* ── FLOATING MAIN CONTENT ── */}
      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">

          {error && (
            <div className="tp-error mb-4">
              <i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i>
              <div>
                <div className="fw-bold text-dark mb-1">Lỗi kết nối</div>
                <div className="text-secondary small">{error}</div>
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

          {/* ── RECENT APPROVALS TABLE ── */}
          <div className="tp-card-static">
            <div className="tp-card-header">
              <div className="d-flex align-items-center gap-3">
                <div className="tp-card-header-icon tp-gradient-slate">
                  <i className="bi bi-clock-history"></i>
                </div>
                <div>
                  <h5 className="tp-card-title mb-0">Yêu cầu phê duyệt gần đây</h5>
                  <p className="text-secondary small mb-0" style={{ fontSize: '0.8rem' }}>5 yêu cầu gần nhất của bạn</p>
                </div>
              </div>
              <span className="tp-badge tp-badge-info">Gần nhất</span>
            </div>

            {recentApprovals.length === 0 ? (
              <div className="tp-empty">
                <div className="tp-empty-icon">
                  <i className="bi bi-inbox"></i>
                </div>
                <div className="tp-empty-title">Chưa có yêu cầu phê duyệt</div>
                <p className="tp-empty-sub">Khi bạn gửi nội dung để kiểm duyệt, chúng sẽ hiện ở đây.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tp-table">
                  <thead>
                    <tr>
                      <th>Loại nội dung</th>
                      <th>ID Nội dung</th>
                      <th>Ngày gửi</th>
                      <th>Trạng thái</th>
                      <th>Ghi chú / Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApprovals.map(req => (
                      <tr key={req.id}>
                        <td>
                          <span className="fw-semibold text-dark">
                            {req.contentType === 'course' ? 'Khóa học' : req.contentType}
                          </span>
                        </td>
                        <td><code className="text-secondary small">{req.contentId}</code></td>
                        <td><span className="text-secondary small">{new Date(req.createdAt).toLocaleString('vi-VN')}</span></td>
                        <td>{getStatusBadge(req.status)}</td>
                        <td className="text-secondary small">{req.reason || <span className="text-muted fst-italic">Không có ghi chú</span>}</td>
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
