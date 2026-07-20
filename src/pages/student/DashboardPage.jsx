import React from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import { useDashboardData } from '../../hooks/useDashboardData';
import TestScoreChart from '../../components/feature-student-dashboard-history/TestScoreChart';
import SkillRadarChart from '../../components/feature-student-dashboard-history/SkillRadarChart';
import './DashboardPage.css';

const STAT_DEFS = [
  {
    key: 'completedLessons',
    title: 'Bài học hoàn thành',
    icon: 'bi-journal-check',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
    bg: '#eff6ff',
  },
  {
    key: 'completedTests',
    title: 'Đề thi đã làm',
    icon: 'bi-file-earmark-check-fill',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    bg: '#f5f3ff',
  },
  {
    key: 'averageBandScore',
    title: 'Band trung bình',
    icon: 'bi-award-fill',
    gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
    bg: '#fffbeb',
  },
  {
    key: 'studyHours',
    title: 'Giờ học tập',
    icon: 'bi-clock-history',
    gradient: 'linear-gradient(135deg, #047857 0%, #34d399 100%)',
    bg: '#ecfdf5',
  },
];

const DashboardPage = () => {
  const currentUser = getCurrentUser();
  const userId      = currentUser?.id || '';
  const firstName   = currentUser?.name?.split(' ').slice(-1)[0] || 'bạn';
  const { data, loading, error } = useDashboardData(userId);

  return (
    <div className="dbp-page">

      {/* ── HERO ── */}
      <div className="dbp-hero">
        <div className="dbp-hero-bg-circle c1"></div>
        <div className="dbp-hero-bg-circle c2"></div>
        <div className="container dbp-hero-inner">
          <div className="dbp-hero-badge">
            <i className="bi bi-speedometer2"></i>
            Bảng điều khiển
          </div>
          <h1 className="dbp-hero-title">
            Dashboard của <span>{firstName}</span>
          </h1>
          <p className="dbp-hero-sub">
            Theo dõi tiến độ học tập, điểm số bài thi và phân tích kỹ năng chi tiết.
          </p>
          <div className="dbp-hero-actions">
            <Link to="/learning/tests" className="dbp-btn-solid">
              <i className="bi bi-pencil-square"></i> Làm bài thi mới
            </Link>
            <Link to="/learning/history" className="dbp-btn-ghost">
              <i className="bi bi-clock-history"></i> Lịch sử học tập
            </Link>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="container dbp-main">

        {loading ? (
          <div className="dbp-loading">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted fw-semibold">Đang tải dashboard...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger rounded-4 shadow-sm p-4" role="alert" data-testid="dashboard-error">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-exclamation-triangle-fill fs-3"></i>
              <div>
                <h5 className="fw-bold mb-1">Lỗi kết nối</h5>
                <p className="mb-2">{error}</p>
                <button className="btn btn-sm btn-danger rounded-pill px-4" onClick={() => window.location.reload()}>
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── STAT CARDS ── */}
            <div className="row g-4 mb-4">
              {STAT_DEFS.map(({ key, title, icon, gradient, bg }) => {
                const val = data.stats[key];
                const display = val === null || val === undefined || val === '' ? 'N/A' : val;
                return (
                  <div className="col-12 col-sm-6 col-lg-3" key={key}>
                    <div className="dbp-stat-card">
                      <div className="dbp-stat-icon" style={{ background: gradient }}>
                        <i className={`bi ${icon}`}></i>
                      </div>
                      <div className="dbp-stat-body">
                        <div className="dbp-stat-label">{title}</div>
                        <div className="dbp-stat-value">{display}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── CHARTS ── */}
            <div className="row g-4">
              <div className="col-12 col-lg-8">
                <div className="dbp-chart-card">
                  <div className="dbp-chart-header">
                    <div className="dbp-chart-icon" style={{ background: 'linear-gradient(135deg,#2563eb,#60a5fa)' }}>
                      <i className="bi bi-graph-up-arrow"></i>
                    </div>
                    <div>
                      <div className="dbp-chart-title">Xu hướng điểm thi</div>
                      <div className="dbp-chart-sub">Lịch sử band score theo thời gian</div>
                    </div>
                  </div>
                  <TestScoreChart data={data.lineChartData} />
                </div>
              </div>
              <div className="col-12 col-lg-4">
                <div className="dbp-chart-card h-100">
                  <div className="dbp-chart-header">
                    <div className="dbp-chart-icon" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                      <i className="bi bi-hexagon-fill"></i>
                    </div>
                    <div>
                      <div className="dbp-chart-title">Cân bằng kỹ năng</div>
                      <div className="dbp-chart-sub">4 kỹ năng IELTS</div>
                    </div>
                  </div>
                  <SkillRadarChart data={data.radarChartData} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
