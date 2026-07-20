import React, { useState, useEffect } from 'react';
import { getCourses } from '../../services/courseLearning.service';
import CourseCard from '../../components/feature-course-learning/CourseCard';
import './CourseListPage.css';

const SKILL_PILLS = [
  { key: '',          label: 'All',       icon: 'bi-grid-3x3-gap', cls: 'all' },
  { key: 'Reading',   label: 'Reading',   icon: 'bi-book-fill',    cls: 'reading' },
  { key: 'Listening', label: 'Listening', icon: 'bi-headphones',   cls: 'listening' },
  { key: 'Writing',   label: 'Writing',   icon: 'bi-pencil-fill',  cls: 'writing' },
  { key: 'Speaking',  label: 'Speaking',  icon: 'bi-mic-fill',     cls: 'speaking' },
];

const LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced', 'Band 5.0+', 'Band 5.0 - 6.5', 'Band 6.0+', 'Band 7.0+'];

const PRICE_PILLS = [
  { key: '',     label: 'Tất cả', icon: 'bi-tag',        color: '#2563eb' },
  { key: 'free', label: 'Miễn phí', icon: 'bi-gift-fill', color: '#16a34a' },
  { key: 'paid', label: 'Có phí',   icon: 'bi-credit-card-fill', color: '#d97706' },
];

const CourseListPage = () => {
  const [courses, setCourses]           = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [skillFilter, setSkillFilter]   = useState('');
  const [levelFilter, setLevelFilter]   = useState('');
  const [priceFilter, setPriceFilter]   = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalItems, setTotalItems]     = useState(0);

  const limit      = 6;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  useEffect(() => {
    const fetchCoursesData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getCourses({ page: currentPage, limit, search: searchTerm, skill: skillFilter, level: levelFilter, priceType: priceFilter });
        setCourses(response.data);
        setTotalItems(response.totalCount);
      } catch (err) {
        setError(err.message || 'An error occurred while fetching courses.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoursesData();
  }, [currentPage, searchTerm, skillFilter, levelFilter, priceFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleSkillPill = (key) => {
    setSkillFilter(key);
    setCurrentPage(1);
  };

  const handleLevelChange = (e) => {
    setLevelFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const clearFilters = () => {
    setSearchInput(''); setSearchTerm('');
    setSkillFilter(''); setLevelFilter('');
    setPriceFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="clp-page">

      {/* ── HERO ── */}
      <div className="clp-hero">
        <div className="container clp-hero-inner">
          <div className="clp-hero-badge">
            <i className="bi bi-compass-fill"></i>
            TẤT CẢ KHÓA HỌC
          </div>
          <h1>Khám Phá Khóa Học</h1>
          <p>Tìm khóa học IELTS phù hợp nhất để đạt được band điểm mục tiêu của bạn.</p>

          {/* Search box */}
          <div className="clp-search-wrap">
            <form onSubmit={handleSearchSubmit} data-testid="search-form">
              <div className="clp-search-group">
                <i className="bi bi-search clp-search-icon"></i>
                <input
                  type="text"
                  className="clp-search-input"
                  placeholder="Tìm kiếm theo tên khóa học..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  data-testid="search-input"
                />
                <button className="clp-search-btn" type="submit">Tìm Kiếm</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="container">
        {/* ── FILTER BAR ── */}
        <div className="clp-filter-bar">
          <div className="clp-filter-card">
            <span className="clp-filter-label">
              <i className="bi bi-funnel-fill text-primary"></i>
              Bộ lọc
            </span>
            <div className="clp-filter-divider"></div>

            <select
              className="clp-select"
              value={levelFilter}
              onChange={handleLevelChange}
              data-testid="level-filter"
            >
              <option value="">Tất cả trình độ</option>
              {LEVELS.filter(Boolean).map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            {(skillFilter || levelFilter || searchTerm || priceFilter) && (
              <button
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                onClick={clearFilters}
                style={{ flexShrink: 0, fontSize: '0.8rem', fontWeight: 600 }}
              >
                <i className="bi bi-x-circle me-1"></i>Xóa bộ lọc
              </button>
            )}

            {!isLoading && (
              <span className="clp-result-count">
                <i className="bi bi-collection me-1 text-primary"></i>
                {totalItems} khóa học
              </span>
            )}
          </div>
        </div>

        {/* ── PREMIUM FILTER PANEL ── */}
        <div className="clp-filter-panel mb-4">
          {/* Skill group */}
          <div className="clp-filter-group">
            <div className="clp-filter-group-label">
              <i className="bi bi-mortarboard-fill"></i>
              Kỹ năng
            </div>
            <div className="clp-filter-chips">
              {SKILL_PILLS.map(({ key, label, icon, cls }) => (
                <button
                  key={key}
                  className={`clp-chip clp-chip--${cls} ${skillFilter === key ? 'active' : ''}`}
                  onClick={() => handleSkillPill(key)}
                  data-testid={`skill-filter-${cls}`}
                >
                  <i className={`bi ${icon}`}></i>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="clp-filter-sep"></div>

          {/* Price group */}
          <div className="clp-filter-group">
            <div className="clp-filter-group-label">
              <i className="bi bi-wallet2"></i>
              Học phí
            </div>
            <div className="clp-filter-chips">
              {PRICE_PILLS.map(({ key, label, icon, color }) => (
                <button
                  key={key}
                  className={`clp-price-chip ${priceFilter === key ? 'active' : ''}`}
                  style={{ '--chip-color': color }}
                  onClick={() => { setPriceFilter(key); setCurrentPage(1); }}
                >
                  <i className={`bi ${icon}`}></i>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Result count */}
          {!isLoading && (
            <div className="clp-panel-result ms-auto">
              <i className="bi bi-collection-fill me-2 text-primary"></i>
              <strong>{totalItems}</strong>&nbsp;khóa học
            </div>
          )}
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="alert alert-danger rounded-4 shadow-sm" role="alert" data-testid="error-alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          </div>
        )}

        {/* ── LOADING ── */}
        {isLoading ? (
          <div className="text-center py-5" data-testid="loading-spinner">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted fw-semibold">Đang tải khóa học...</p>
          </div>
        ) : courses.length === 0 && !error ? (
          /* ── EMPTY ── */
          <div className="clp-empty" data-testid="empty-state">
            <div className="clp-empty-icon">
              <i className="bi bi-search"></i>
            </div>
            <h4 className="fw-bold mb-2">Không tìm thấy khóa học nào</h4>
            <p className="text-muted mb-4">Hãy thử điều chỉnh từ khóa hoặc bộ lọc của bạn.</p>
            <button className="btn btn-primary rounded-pill px-5 py-2 fw-bold" onClick={clearFilters}>
              <i className="bi bi-arrow-counterclockwise me-2"></i>Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          <>
            {/* ── GRID ── */}
            <div className="row g-4 mb-2">
              {courses.map(course => (
                <div className="col-12 col-md-6 col-lg-4" key={course.id}>
                  <CourseCard course={course} />
                </div>
              ))}
            </div>

            {/* ── PAGINATION ── */}
            {totalItems > limit && (
              <div className="clp-pagination">
                <button
                  className="clp-page-btn nav"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  data-testid="prev-page"
                >
                  <i className="bi bi-chevron-left"></i> Trước
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`clp-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  className="clp-page-btn nav"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  data-testid="next-page"
                >
                  Sau <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CourseListPage;
