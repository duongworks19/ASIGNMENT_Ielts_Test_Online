import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import HistoryFilter from '../../components/feature-student-dashboard-history/HistoryFilter';
import HistoryTable from '../../components/feature-student-dashboard-history/HistoryTable';
import { useHistoryFilter } from '../../hooks/useHistoryFilter';
import { getCurrentUser } from '../../services/authService';
import './LearningHistoryPage.css';

const LearningHistoryPage = () => {
  const currentUser = getCurrentUser();
  const userId      = currentUser?.id || '';
  const firstName   = currentUser?.name?.split(' ').slice(-1)[0] || 'bạn';

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const { handleFilterChange, filteredAttempts } = useHistoryFilter(attempts);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        if (!userId) throw new Error('Phiên đăng nhập không hợp lệ.');
        const res = await api.get(`/testAttempts?userId=${encodeURIComponent(userId)}`);
        const testRes = await api.get('/tests');
        const tests = testRes.data || [];
        
        // Filter out incomplete attempts (they don't have a submittedAt)
        const completedAttempts = (res.data || []).filter(a => a.status === 'completed' && a.submittedAt);
        
        // Map test title and time spent
        const mappedAttempts = completedAttempts.map(a => {
          const test = tests.find(t => t.id === a.testId || String(t.id) === String(a.testId));
          let timeSpent = 0;
          if (a.startTime && a.submittedAt) {
             timeSpent = Math.round((new Date(a.submittedAt) - new Date(a.startTime)) / 1000);
          }
          return {
             ...a,
             testTitle: test ? test.title : 'Unknown Test',
             timeSpent
          };
        });

        const sorted = mappedAttempts.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        setAttempts(sorted);
      } catch (err) {
        setError('Failed to fetch learning history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, [userId]);

  // Summary stats
  const totalAttempts  = attempts.length;
  const gradedAttempts = attempts.filter(a => a.gradingStatus !== 'pending' && (a.bandScore || a.overallBandScore));
  const avgBand        = gradedAttempts.length
    ? (gradedAttempts.reduce((s, a) => s + parseFloat(a.bandScore || a.overallBandScore || 0), 0) / gradedAttempts.length).toFixed(1)
    : 'N/A';
  const bestBand = gradedAttempts.length
    ? Math.max(...gradedAttempts.map(a => parseFloat(a.bandScore || a.overallBandScore || 0))).toFixed(1)
    : 'N/A';

  return (
    <div className="lhp-page">

      {/* ── HERO ── */}
      <div className="lhp-hero">
        <div className="lhp-hero-circle c1"></div>
        <div className="lhp-hero-circle c2"></div>
        <div className="container lhp-hero-inner">
          <div className="lhp-hero-badge">
            <i className="bi bi-clock-history"></i>
            Nhật ký học tập
          </div>
          <h1 className="lhp-hero-title">
            Lịch Sử Của <span>{firstName}</span>
          </h1>
          <p className="lhp-hero-sub">
            Xem lại tất cả bài kiểm tra đã làm, so sánh kết quả và theo dõi sự tiến bộ theo thời gian.
          </p>

          {/* Mini stats in hero */}
          {!loading && !error && (
            <div className="lhp-mini-stats">
              <div className="lhp-mini-stat">
                <i className="bi bi-file-earmark-check-fill me-2" style={{ color: '#60a5fa' }}></i>
                <strong>{totalAttempts}</strong>&nbsp;Bài đã làm
              </div>
              <div className="lhp-mini-stat">
                <i className="bi bi-award-fill me-2" style={{ color: '#fbbf24' }}></i>
                <strong>{avgBand}</strong>&nbsp;Band TB
              </div>
              <div className="lhp-mini-stat">
                <i className="bi bi-trophy-fill me-2" style={{ color: '#34d399' }}></i>
                <strong>{bestBand}</strong>&nbsp;Band cao nhất
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN (floating) ── */}
      <div className="container lhp-main">
        {loading ? (
          <div className="lhp-loading">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted fw-semibold">Đang tải lịch sử học tập...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger rounded-4 shadow-sm p-4" role="alert" data-testid="history-error">
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-exclamation-triangle-fill fs-3"></i>
              <div>
                <h5 className="fw-bold mb-1">Lỗi kết nối</h5>
                <p className="mb-2">{error}</p>
                <button className="btn btn-sm btn-danger rounded-pill px-4" onClick={() => window.location.reload()}>Thử lại</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lhp-content-card">
            {/* Filter */}
            <div className="lhp-filter-wrap">
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-funnel-fill text-primary" style={{ fontSize: '0.9rem' }}></i>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b' }}>Bộ lọc</span>
              </div>
              <HistoryFilter onFilterChange={handleFilterChange} />
            </div>

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 24px' }} />

            {/* Table */}
            <HistoryTable attempts={filteredAttempts} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningHistoryPage;
