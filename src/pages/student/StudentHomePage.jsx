import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCourses } from '../../services/courseLearning.service';
import { getCurrentUser } from '../../services/authService';
import CourseCard from '../../components/feature-course-learning/CourseCard';
import './StudentHomePage.css';

const SKILL_INFO = [
  { key: 'Reading',   icon: 'bi-book-fill',      circle: { bg: '#dbeafe', color: '#1d4ed8' }, bar: '#3b82f6', score: 7.0 },
  { key: 'Listening', icon: 'bi-headphones',      circle: { bg: '#ede9fe', color: '#7c3aed' }, bar: '#8b5cf6', score: 6.5 },
  { key: 'Writing',   icon: 'bi-pencil-fill',     circle: { bg: '#ffedd5', color: '#c2410c' }, bar: '#f97316', score: 6.0 },
  { key: 'Speaking',  icon: 'bi-mic-fill',        circle: { bg: '#d1fae5', color: '#047857' }, bar: '#10b981', score: 6.5 },
];

const QUICK_ACTIONS = [
  { to: '/learning/my-courses',  icon: 'bi-journal-bookmark-fill', iconBg: 'linear-gradient(135deg,#2563eb,#60a5fa)', iconColor: '#fff', label: 'Học tập',    title: 'Khóa học của tôi' },
  { to: '/learning/tests',       icon: 'bi-file-earmark-check-fill',iconBg: 'linear-gradient(135deg,#7c3aed,#a78bfa)', iconColor: '#fff', label: 'Luyện thi',   title: 'Làm bài kiểm tra' },
  { to: '/learning/flashcards',  icon: 'bi-lightning-fill',         iconBg: 'linear-gradient(135deg,#047857,#34d399)', iconColor: '#fff', label: 'Từ vựng',    title: 'Flashcard IELTS' },
  { to: '/learning/exam-library',icon: 'bi-archive-fill',           iconBg: 'linear-gradient(135deg,#d97706,#fbbf24)', iconColor: '#fff', label: 'Tài nguyên', title: 'Thư viện đề thi' },
];

export default function StudentHomePage() {
  const navigate  = useNavigate();
  const user      = getCurrentUser();
  const firstName = user?.name?.split(' ').slice(-1)[0] || 'bạn';

  const [topCourses,    setTopCourses]    = useState([]);
  const [latestCourses, setLatestCourses] = useState([]);
  const [allCourses,    setAllCourses]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    const fetchHomeCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response  = await getCourses({ page: 1, limit: 100 });
        const all       = response.data || [];

        const top = [...all]
          .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
          .slice(0, 3);

        const latest = [...all]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6);

        setAllCourses(all);
        setTopCourses(top);
        setLatestCourses(latest);
      } catch (err) {
        setError(err.message || 'Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };
    fetchHomeCourses();
  }, []);

  const skillCounts = SKILL_INFO.map(s => ({
    ...s,
    count: allCourses.filter(c => c.skill === s.key).length,
  }));

  return (
    <div className="shp-page">

      {/* ──────────────── HERO ──────────────── */}
      <div className="shp-hero">
        {/* Floating dots */}
        <div className="shp-hero-dots">
          {Array(15).fill(0).map((_, i) => <span key={i}></span>)}
        </div>

        <div className="container shp-hero-inner">
          <div className="row align-items-center gy-5">
            {/* Left */}
            <div className="col-lg-7">
              <div className="shp-hero-badge">
                <i className="bi bi-mortarboard-fill"></i>
                IELTS MASTER — Học Viên
              </div>
              <h1 className="shp-hero-greeting">
                Xin chào, <span>{firstName}</span>! 👋
              </h1>
              <p className="shp-hero-sub">
                Hành trình chinh phục IELTS của bạn bắt đầu từ đây. Chọn khóa học,
                luyện đề và theo dõi tiến độ một cách thông minh.
              </p>
              <div className="shp-hero-cta">
                <Link to="/learning/courses" className="shp-btn-primary">
                  <i className="bi bi-compass-fill"></i>
                  Khám Phá Khóa Học
                </Link>
                <Link to="/learning/dashboard" className="shp-btn-ghost">
                  <i className="bi bi-grid-3x3-gap"></i>
                  Dashboard Của Tôi
                </Link>
              </div>
            </div>

            {/* Right — Band Score Card */}
            <div className="col-lg-5 d-none d-lg-block">
              <div className="shp-hero-card">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    🎯
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Mục tiêu Band Score</div>
                    <div className="shp-band-score">7.0</div>
                  </div>
                </div>
                <div className="shp-skills-grid">
                  {SKILL_INFO.map(({ key, score, bar }) => (
                    <div className="shp-skill-item" key={key}>
                      <div className="shp-skill-name">{key}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div className="shp-skill-bar-track" style={{ flex: 1, marginRight: 8 }}>
                          <div className="shp-skill-bar-fill" style={{ width: `${(score / 9) * 100}%`, background: bar }}></div>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">

        {/* ──────────────── QUICK ACTIONS (floating) ──────────────── */}
        <div className="shp-quick-row">
          <div className="row g-3">
            {QUICK_ACTIONS.map(({ to, icon, iconBg, iconColor, label, title }) => (
              <div className="col-6 col-lg-3" key={to}>
                <Link to={to} className="shp-quick-card">
                  <div className="shp-quick-icon" style={{ background: iconBg, color: iconColor }}>
                    <i className={`bi ${icon}`}></i>
                  </div>
                  <div>
                    <div className="shp-quick-label">{label}</div>
                    <div className="shp-quick-title">{title}</div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ──────────────── SKILLS STRIP ──────────────── */}
        <div className="mb-4">
          <div className="shp-section-header">
            <div>
              <h2 className="shp-section-title">Luyện theo kỹ năng</h2>
              <p className="shp-section-sub">Chọn kỹ năng bạn muốn cải thiện ngay hôm nay</p>
            </div>
          </div>
          <div className="shp-skills-strip">
            {skillCounts.map(({ key, icon, circle, count }) => (
              <Link
                to={`/learning/courses?skill=${key}`}
                className="shp-skill-card"
                key={key}
                onClick={(e) => { e.preventDefault(); navigate(`/learning/courses`); }}
              >
                <div className="shp-skill-circle" style={{ background: circle.bg, color: circle.color }}>
                  <i className={`bi ${icon}`}></i>
                </div>
                <div>
                  <div className="shp-skill-card-name">{key}</div>
                  <div className="shp-skill-card-count">{count} khóa học</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ──────────────── ERRORS ──────────────── */}
        {error && (
          <div className="alert alert-danger rounded-4 shadow-sm" role="alert">{error}</div>
        )}

        {/* ──────────────── LOADING ──────────────── */}
        {loading ? (
          <div className="shp-loading">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted fw-semibold">Đang tải khóa học...</p>
          </div>
        ) : (
          <>
            {/* ──────────────── TOP COURSES ──────────────── */}
            <section className="mb-5 pb-2">
              <div className="shp-section-header">
                <div>
                  <h2 className="shp-section-title">Khóa học hàng đầu</h2>
                  <p className="shp-section-sub">Được nhiều học viên đăng ký nhất hiện nay</p>
                </div>
                <Link to="/learning/courses" className="shp-section-link">
                  Xem tất cả <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
              <div className="row g-4">
                {topCourses.map(course => (
                  <div className="col-12 col-md-6 col-lg-4" key={course.id}>
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
            </section>

            {/* ──────────────── LATEST COURSES ──────────────── */}
            <section className="pb-5">
              <div className="shp-section-header">
                <div>
                  <h2 className="shp-section-title">Khóa học mới nhất</h2>
                  <p className="shp-section-sub">Nội dung mới vừa được cập nhật</p>
                </div>
                <Link to="/learning/courses" className="shp-section-link">
                  Xem catalog <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
              <div className="row g-4">
                {latestCourses.map(course => (
                  <div className="col-12 col-md-6 col-lg-4" key={course.id}>
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

      </div>
    </div>
  );
}
