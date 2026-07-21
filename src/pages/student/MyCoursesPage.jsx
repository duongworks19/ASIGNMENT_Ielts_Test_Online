import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnrollmentsByUser, getCourseById } from '../../services/courseLearning.service';
import { getCurrentUser } from '../../services/authService';
import './MyCoursesPage.css';

/**
 * MyCoursesPage — CL-05 (Premium Redesign)
 */
const SKILL_STYLE = {
  Reading:   { bg: 'rgba(219,234,254,0.85)', text: '#1d4ed8', ribbon: 'rgba(219,234,254,0.9)' },
  Listening: { bg: 'rgba(243,232,255,0.85)', text: '#7e22ce', ribbon: 'rgba(243,232,255,0.9)' },
  Writing:   { bg: 'rgba(255,237,213,0.85)', text: '#c2410c', ribbon: 'rgba(255,237,213,0.9)' },
  Speaking:  { bg: 'rgba(209,250,229,0.85)', text: '#047857', ribbon: 'rgba(209,250,229,0.9)' },
};

const getProgressStatus = (enrollment) => {
  if (enrollment.status === 'completed' || enrollment.progress === 100) return 'completed';
  if (enrollment.progress > 0) return 'inprogress';
  return 'notstarted';
};

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userId = user?.id || '';

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchMyCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!userId) throw new Error('Phiên đăng nhập không hợp lệ.');
        const enrollments = await getEnrollmentsByUser(userId);
        const courseResults = await Promise.allSettled(
          enrollments.map((enr) => getCourseById(enr.courseId))
        );
        const combined = enrollments
          .map((enr, idx) => {
            const result = courseResults[idx];
            if (result.status === 'fulfilled' && result.value) {
              return { enrollment: enr, course: result.value };
            }
            return null;
          })
          .filter(Boolean);
        setEnrolledCourses(combined);
      } catch (err) {
        setError(err.message || 'Failed to load your courses. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyCourses();
  }, [userId]);

  const handleContinueLearning = (courseId) => navigate(`/learning/courses/${courseId}/lessons`);

  const stats = {
    total:      enrolledCourses.length,
    completed:  enrolledCourses.filter(({ enrollment }) => getProgressStatus(enrollment) === 'completed').length,
    inprogress: enrolledCourses.filter(({ enrollment }) => getProgressStatus(enrollment) === 'inprogress').length,
  };

  const filteredCourses = enrolledCourses.filter(({ enrollment }) => {
    if (activeFilter === 'all') return true;
    return getProgressStatus(enrollment) === activeFilter;
  });

  const STAT_ITEMS = [
    { label: 'Total Enrolled', value: stats.total, icon: 'bi-collection-fill', iconBg: 'linear-gradient(135deg,#2563eb,#60a5fa)', textColor: '#2563eb', bg: '#eff6ff' },
    { label: 'Completed',      value: stats.completed, icon: 'bi-patch-check-fill', iconBg: 'linear-gradient(135deg,#16a34a,#4ade80)', textColor: '#16a34a', bg: '#f0fdf4' },
    { label: 'In Progress',    value: stats.inprogress, icon: 'bi-play-circle-fill', iconBg: 'linear-gradient(135deg,#d97706,#fbbf24)', textColor: '#d97706', bg: '#fffbeb' },
  ];

  const FILTER_TABS = [
    { key: 'all',        label: 'All Courses',  icon: 'bi-grid-3x3-gap', count: stats.total },
    { key: 'inprogress', label: 'In Progress',  icon: 'bi-play-fill',    count: stats.inprogress },
    { key: 'completed',  label: 'Completed',    icon: 'bi-check2-circle',count: stats.completed },
    { key: 'notstarted', label: 'Not Started',  icon: 'bi-clock',        count: stats.total - stats.completed - stats.inprogress },
  ];

  return (
    <div className="my-courses-page">
      {/* ── HERO ── */}
      <div className="mcp-hero">
        <div className="container text-center position-relative" style={{ zIndex: 2 }}>
          <div className="mcp-hero-badge">
            <i className="bi bi-journal-bookmark-fill"></i>
            MY LEARNING JOURNEY
          </div>
          <h1>Khóa Học Của Tôi</h1>
          <p className="mx-auto">
            Tiếp tục các khóa học đang dang dở và xem lại những kiến thức bạn đã hoàn thành.
            Lộ trình IELTS của bạn được theo dõi từng bước.
          </p>
        </div>
      </div>

      <div className="container">
        {/* ── STATS ROW ── */}
        {!isLoading && !error && enrolledCourses.length > 0 && (
          <div className="row g-3 mcp-stats-row">
            {STAT_ITEMS.map(({ label, value, icon, iconBg, textColor, bg }) => (
              <div className="col-12 col-sm-4" key={label}>
                <div className="mcp-stat-card">
                  <div className="mcp-stat-icon" style={{ background: iconBg, color: '#fff' }}>
                    <i className={`bi ${icon}`}></i>
                  </div>
                  <div>
                    <div className="mcp-stat-value" style={{ color: textColor }}>{value}</div>
                    <div className="mcp-stat-label">{label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── LOADING ── */}
        {isLoading && (
          <div className="py-5 text-center" data-testid="loading-spinner" style={{ paddingTop: '60px' }}>
            <div className="spinner-border text-primary" role="status" style={{ width: '3.5rem', height: '3.5rem', borderWidth: '4px' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-4 text-muted fw-semibold">Đang tải khóa học của bạn...</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {!isLoading && error && (
          <div className="py-5" style={{ paddingTop: '60px' }}>
            <div className="alert alert-danger shadow-sm rounded-4 d-flex align-items-center gap-2" role="alert" data-testid="error-alert">
              <i className="bi bi-exclamation-triangle-fill fs-5"></i>
              <div>
                <strong>Something went wrong.</strong> {error}
                <button className="btn btn-sm btn-outline-danger ms-3" onClick={() => window.location.reload()}>Retry</button>
              </div>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!isLoading && !error && enrolledCourses.length === 0 && (
          <div className="mcp-empty" style={{ paddingTop: '60px' }} data-testid="empty-state">
            <div className="mcp-empty-icon">
              <i className="bi bi-journal-bookmark"></i>
            </div>
            <h3 className="fw-bold mb-2">Bạn chưa đăng ký khóa học nào</h3>
            <p className="text-muted mb-5" style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
              Khám phá danh mục khóa học IELTS đa dạng và bắt đầu hành trình chinh phục điểm số mơ ước!
            </p>
            <button
              className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm"
              onClick={() => navigate('/learning/courses')}
              data-testid="btn-browse-courses"
              style={{ fontSize: '1rem' }}
            >
              <i className="bi bi-compass me-2"></i>Khám Phá Khóa Học
            </button>
          </div>
        )}

        {/* ── COURSE LIST ── */}
        {!isLoading && !error && enrolledCourses.length > 0 && (
          <>
            {/* Filter Bar */}
            <div className="mcp-filter-bar">
              {FILTER_TABS.map(({ key, label, icon, count }) => (
                <button
                  key={key}
                  className={`mcp-filter-btn ${activeFilter === key ? 'active' : ''}`}
                  onClick={() => setActiveFilter(key)}
                >
                  <i className={`bi ${icon}`}></i>
                  {label}
                  <span className="mcp-filter-count">{count}</span>
                </button>
              ))}
            </div>

            {/* Empty filter result */}
            {filteredCourses.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-filter-circle fs-1 d-block mb-3 opacity-40"></i>
                <p className="fw-semibold">Không có khóa học trong danh mục này.</p>
              </div>
            ) : (
              <div className="row g-4 pb-5" data-testid="course-list">
                {filteredCourses.map(({ enrollment, course }) => {
                  const progress = enrollment.progress ?? 0;
                  const status = getProgressStatus(enrollment);
                  const skillStyle = SKILL_STYLE[course.skill] || { bg: '#f1f5f9', text: '#475569', ribbon: '#f1f5f9' };

                  return (
                    <div className="col-12 col-md-6 col-xl-4" key={enrollment.id}>
                      <div className="mcp-course-card" data-testid={`course-card-${course.id}`}>

                        {/* ── Thumbnail ── */}
                        <div className="mcp-course-thumb">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&w=600&q=80'; }}
                            />
                          ) : (
                            <div className="mcp-thumb-fallback">
                              <i className="bi bi-play-circle"></i>
                            </div>
                          )}

                          {/* Skill ribbon */}
                          {course.skill && (
                            <span className="mcp-skill-ribbon" style={{ background: skillStyle.ribbon, color: skillStyle.text }}>
                              {course.skill}
                            </span>
                          )}

                          {/* Status badge */}
                          <span className={`mcp-status-badge ${status}`}>
                            {status === 'completed'  && <><i className="bi bi-patch-check-fill me-1"></i>Hoàn Thành</>}
                            {status === 'inprogress' && <><i className="bi bi-play-fill me-1"></i>Đang Học</>}
                            {status === 'notstarted' && <>Chưa Bắt Đầu</>}
                          </span>
                        </div>

                        {/* ── Body ── */}
                        <div className="mcp-course-body">
                          <h5 className="mcp-course-title">{course.title}</h5>

                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                            {course.teacherName && (
                              <div className="mcp-teacher-row">
                                <div className="mcp-teacher-avatar">
                                  {course.teacherName.charAt(0).toUpperCase()}
                                </div>
                                <span className="mcp-teacher-name">{course.teacherName}</span>
                              </div>
                            )}
                            {course.durationWeeks && (
                              <span className="mcp-duration-chip">
                                <i className="bi bi-clock text-primary"></i>
                                {course.durationWeeks} tuần
                              </span>
                            )}
                          </div>

                          {/* Progress */}
                          <div className="mcp-progress-area">
                            <div className="mcp-progress-header">
                              <span className="mcp-progress-label">Tiến độ</span>
                              <span
                                className="mcp-progress-pct"
                                style={{ color: progress === 100 ? '#16a34a' : '#2563eb' }}
                              >
                                {progress}%
                              </span>
                            </div>
                            <div className="mcp-progress-track">
                              <div
                                className={`mcp-progress-fill ${progress === 100 ? 'done' : progress > 0 ? 'going' : 'zero'}`}
                                style={{ width: `${progress}%` }}
                                role="progressbar"
                                aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"
                                data-testid={`progress-bar-${course.id}`}
                              />
                            </div>
                          </div>

                          {/* CTA */}
                          <button
                            className={`mcp-cta-btn ${progress === 100 ? 'success' : 'primary'}`}
                            onClick={() => handleContinueLearning(course.id)}
                            data-testid={`btn-continue-${course.id}`}
                          >
                            {progress === 100 ? (
                              <><i className="bi bi-trophy-fill"></i>Ôn Lại Khóa Học</>
                            ) : progress > 0 ? (
                              <><i className="bi bi-play-fill"></i>Tiếp Tục Học</>
                            ) : (
                              <><i className="bi bi-rocket-takeoff-fill"></i>Bắt Đầu Học</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage;
