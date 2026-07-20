import React, { useState, useEffect } from 'react';
import { studentLibraryService } from '../../services/studentLibraryService';
import './ExamLibraryPage.css';

const CATEGORIES = [
  { id: 'Tất cả',            icon: 'bi-collection-fill',        color: '#2563eb' },
  { id: 'Academic',          icon: 'bi-mortarboard-fill',       color: '#7c3aed' },
  { id: 'General Training',  icon: 'bi-briefcase-fill',         color: '#047857' },
  { id: 'Cambridge',         icon: 'bi-journal-bookmark-fill',  color: '#c2410c' },
  { id: 'Recent Actual Tests', icon: 'bi-fire',                color: '#d97706' },
];

const FILE_ICONS = {
  pdf:      { icon: 'bi-file-earmark-pdf-fill',   color: '#ef4444', bg: '#fee2e2' },
  document: { icon: 'bi-file-earmark-word-fill',  color: '#2563eb', bg: '#dbeafe' },
  audio:    { icon: 'bi-file-earmark-music-fill', color: '#16a34a', bg: '#dcfce7' },
  video:    { icon: 'bi-file-earmark-play-fill',  color: '#d97706', bg: '#fef3c7' },
  default:  { icon: 'bi-file-earmark-text-fill',  color: '#64748b', bg: '#f1f5f9' },
};

export default function ExamLibraryPage() {
  const [resources,       setResources]       = useState([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [error,           setError]           = useState(null);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [activeCategory,  setActiveCategory]  = useState('Tất cả');

  useEffect(() => {
    studentLibraryService.getPublicResources()
      .then(d => setResources(d))
      .catch(e => setError(e.message || 'Lỗi khi tải thư viện tài liệu.'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredResources = resources.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
    const isGeneral   = r.title.toLowerCase().includes('general');
    const isCam       = r.title.toLowerCase().includes('cambridge');
    let matchCat = true;
    if (activeCategory === 'Academic')           matchCat = !isGeneral;
    if (activeCategory === 'General Training')   matchCat = isGeneral;
    if (activeCategory === 'Cambridge')          matchCat = isCam;
    if (activeCategory === 'Recent Actual Tests') matchCat = !isCam && !isGeneral;
    return matchSearch && (activeCategory === 'Tất cả' || matchCat);
  });

  const getFileIcon = (type) => FILE_ICONS[type] || FILE_ICONS.default;

  return (
    <div className="elp-page">

      {/* ── HERO ── */}
      <div className="elp-hero">
        <div className="elp-hero-orb o1"></div>
        <div className="elp-hero-orb o2"></div>
        <div className="container elp-hero-inner">
          <div className="elp-hero-badge">
            <i className="bi bi-book-half"></i>
            IELTS Master Library
          </div>
          <h1 className="elp-hero-title">Thư Viện Tài Liệu IELTS</h1>
          <p className="elp-hero-sub">
            Cambridge, IELTS Trainer, đề thi thật và file âm thanh — tất cả miễn phí, tải về ngay.
          </p>

          {/* Search */}
          <div className="elp-search-wrap">
            <form onSubmit={e => e.preventDefault()}>
              <div className="elp-search-group">
                <i className="bi bi-search elp-search-icon"></i>
                <input
                  type="text"
                  className="elp-search-input"
                  placeholder="Tìm kiếm sách, PDF (ví dụ: Cambridge 18...)"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      {isLoading ? (
        <div className="elp-loading">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted fw-semibold">Đang tải tài liệu...</p>
        </div>
      ) : error ? (
        <div className="container mt-5">
          <div className="alert alert-danger rounded-4 shadow-sm p-4 text-center">
            <h5 className="fw-bold mb-2">Lỗi tải dữ liệu</h5>
            <p className="mb-0">{error}</p>
          </div>
        </div>
      ) : (
        <div className="container elp-main">
          <div className="row g-4">

            {/* ── SIDEBAR ── */}
            <div className="col-lg-3">
              <div className="elp-sidebar sticky-top" style={{ top: '100px' }}>
                <div className="elp-sidebar-title">
                  <i className="bi bi-funnel-fill text-primary"></i>
                  Phân loại
                </div>
                <div className="d-flex flex-column gap-2">
                  {CATEGORIES.map(({ id, icon, color }) => (
                    <button
                      key={id}
                      className={`elp-cat-btn ${activeCategory === id ? 'active' : ''}`}
                      style={{ '--cat-color': color }}
                      onClick={() => setActiveCategory(id)}
                    >
                      <span className="elp-cat-icon">
                        <i className={`bi ${icon}`}></i>
                      </span>
                      <span className="elp-cat-label">{id}</span>
                      {activeCategory === id && <i className="bi bi-check-circle-fill elp-cat-check"></i>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RESOURCE LIST ── */}
            <div className="col-lg-9">
              <div className="elp-content-panel">
                <div className="elp-list-header">
                  <div>
                    <h2 className="elp-list-title">
                      {activeCategory === 'Tất cả' ? 'Tất cả tài liệu' : activeCategory}
                    </h2>
                    <p className="elp-list-sub">Chọn tài liệu phù hợp để tải về hoặc xem trực tuyến</p>
                  </div>
                  <span className="elp-result-badge">{filteredResources.length} tài liệu</span>
                </div>

              {filteredResources.length === 0 ? (
                <div className="elp-empty">
                  <div className="elp-empty-icon"><i className="bi bi-search"></i></div>
                  <h5 className="fw-bold mb-2">Không tìm thấy tài liệu</h5>
                  <p className="text-muted">Thử từ khóa khác hoặc chọn danh mục khác.</p>
                  <button className="btn btn-primary rounded-pill px-4" onClick={() => { setSearchTerm(''); setActiveCategory('Tất cả'); }}>
                    Xem tất cả
                  </button>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {filteredResources.map((resource) => {
                    const fi  = getFileIcon(resource.resourceType);
                    const url = resource.externalUrl || resource.fileUrl || resource.url || '#';
                    return (
                      <div className="elp-resource-card" key={resource.id}>
                        {/* File icon */}
                        <div className="elp-res-icon" style={{ background: fi.bg }}>
                          <i className={`bi ${fi.icon}`} style={{ color: fi.color, fontSize: '1.6rem' }}></i>
                        </div>

                        {/* Info */}
                        <div className="elp-res-info">
                          <div className="elp-res-badges">
                            <span className="elp-badge skill">{resource.skill}</span>
                            <span className="elp-badge level">{resource.level}</span>
                            <span className="elp-badge type">{resource.resourceType?.toUpperCase()}</span>
                          </div>
                          <h5 className="elp-res-title">{resource.title}</h5>
                          <p className="elp-res-desc">{resource.description || 'Không có mô tả.'}</p>
                        </div>

                        {/* Action */}
                        <div className="elp-res-action">
                          <a href={url} target="_blank" rel="noreferrer" className="elp-view-btn">
                            <i className="bi bi-eye-fill"></i>
                            Xem trực tuyến
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
