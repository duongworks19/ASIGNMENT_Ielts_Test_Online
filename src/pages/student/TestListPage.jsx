import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { testService } from '../../services/testService';
import api from '../../services/api';
import { getCurrentUser } from '../../services/authService';

const SKILL_CONFIG = {
  Reading:   {
    color: '#0369a1', bg: '#e0f2fe', icon: 'bi-book-fill',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
    light: '#f0f9ff', tag: 'READING'
  },
  Listening: {
    color: '#b45309', bg: '#fef3c7', icon: 'bi-headphones',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    light: '#fffbeb', tag: 'LISTENING'
  },
  Writing:   {
    color: '#6d28d9', bg: '#ede9fe', icon: 'bi-pencil-fill',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    light: '#faf5ff', tag: 'WRITING'
  },
  Speaking:  {
    color: '#047857', bg: '#d1fae5', icon: 'bi-mic-fill',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    light: '#ecfdf5', tag: 'SPEAKING'
  },
};
const getSkill = (skill) => SKILL_CONFIG[skill] || {
  color: '#4338ca', bg: '#eef2ff', icon: 'bi-file-text-fill',
  gradient: 'linear-gradient(135deg,#6366f1,#4338ca)', light: '#eef2ff', tag: 'TEST'
};

const FILTERS = [
  { key: 'Tất cả', label: 'All Skills', icon: 'bi-grid-fill' },
  { key: 'Reading', label: 'Reading', icon: 'bi-book-fill' },
  { key: 'Listening', label: 'Listening', icon: 'bi-headphones' },
  { key: 'Writing', label: 'Writing', icon: 'bi-pencil-fill' },
  { key: 'Speaking', label: 'Speaking', icon: 'bi-mic-fill' },
];

export default function TestListPage() {
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    const fetchTestsAndEnrollments = async () => {
      try {
        const user = getCurrentUser();
        const [testsData, enrollmentsRes] = await Promise.all([
          testService.getPublishedTests(),
          api.get(`/enrollments?userId=${user?.id}`)
        ]);
        setTests(testsData);
        setEnrollments(enrollmentsRes.data || []);
      } catch (err) {
        setError(err.message || 'Lỗi khi tải dữ liệu bài thi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTestsAndEnrollments();
  }, []);

  const filtered = activeFilter === 'Tất cả'
    ? tests
    : tests.filter(t => t.skill === activeFilter);

  const freeCount = tests.filter(t => t.testMode === 'free').length;
  const premiumCount = tests.filter(t => t.testMode !== 'free').length;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }} data-testid="testlist-page">

      {/* ===== HERO SECTION - IELTS Style ===== */}
      <div style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)',
        padding: '72px 0 0',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', pointerEvents: 'none'
        }}/>
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-40px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'rgba(99,102,241,0.15)', pointerEvents: 'none'
        }}/>

        <div className="container position-relative">
          <div className="text-center mb-5">
            {/* Tag */}
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-4"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <i className="bi bi-patch-check-fill" style={{ color: '#fbbf24' }}></i>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', color: '#fbbf24' }}>OFFICIAL IELTS PRACTICE</span>
            </div>

            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
              IELTS Mock Test Library
            </h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.8, maxWidth: 560, margin: '0 auto 40px' }}>
              Full-length mock tests matching real IELTS format. Track your band score and improve with every attempt.
            </p>

            {/* Stats bar */}
            <div className="d-flex justify-content-center gap-5 mb-0">
              {[
                { num: tests.length, label: 'Total Tests' },
                { num: freeCount, label: 'Free Tests' },
                { num: premiumCount, label: 'Premium Tests' },
                { num: '0–9', label: 'Band Scale' },
              ].map(({ num, label }) => (
                <div key={label} className="text-center">
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{num}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Bar - attached to hero bottom */}
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px 16px 0 0',
            padding: '20px 24px',
          }}>
            <div className="d-flex align-items-center gap-2 overflow-auto" style={{ scrollbarWidth: 'none' }}>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFilter(f.key)}
                  className="d-flex align-items-center gap-2 fw-semibold flex-shrink-0"
                  style={{
                    borderRadius: 50,
                    padding: '9px 20px',
                    fontSize: 14,
                    transition: 'all 0.2s ease',
                    border: 'none',
                    background: activeFilter === f.key ? '#ffffff' : 'rgba(255,255,255,0.12)',
                    color: activeFilter === f.key ? '#1e3a8a' : 'rgba(255,255,255,0.85)',
                    boxShadow: activeFilter === f.key ? '0 4px 14px rgba(0,0,0,0.2)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <i className={`bi ${f.icon}`} style={{ fontSize: 13 }}></i>
                  {f.label}
                </button>
              ))}
              <span className="ms-auto text-white-50 small flex-shrink-0 fw-semibold">
                {filtered.length} test{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      {isLoading ? (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
          <div className="spinner-border mb-3" style={{ width: '3rem', height: '3rem', color: '#1e3a8a' }} role="status" />
          <p className="text-muted fw-semibold">Loading tests...</p>
        </div>
      ) : error ? (
        <div className="container mt-5">
          <div className="alert alert-danger border-0 rounded-4 p-4 text-center shadow-sm">
            <i className="bi bi-exclamation-triangle-fill fs-3 d-block mb-2 text-danger"></i>
            <h5 className="fw-bold">{error}</h5>
          </div>
        </div>
      ) : (
        <div className="container py-5">
          {filtered.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-search" style={{ fontSize: 64, color: '#cbd5e1' }}></i>
              <h5 className="fw-bold text-dark mt-3 mb-2">No tests found for this skill.</h5>
              <p className="text-muted">Try selecting a different skill filter.</p>
            </div>
          ) : (
            <div className="row g-4">
              {filtered.map((test) => {
                const sk = getSkill(test.skill);
                const isLocked = test.testMode !== 'free' && !enrollments.some(e => e.courseId === test.courseId);

                return (
                  <div className="col-12 col-md-6 col-xl-4" key={test.id} data-testid={`test-card-${test.id}`}>
                    <div
                      style={{
                        background: '#fff',
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.3s ease',
                        display: 'flex', flexDirection: 'column',
                        height: '100%',
                        filter: isLocked ? 'grayscale(20%)' : 'none',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)';
                        e.currentTarget.style.borderColor = isLocked ? '#e2e8f0' : sk.color;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      {/* Skill color bar */}
                      <div style={{ height: 4, background: isLocked ? '#e2e8f0' : sk.gradient }} />

                      {/* Card header */}
                      <div style={{ background: isLocked ? '#f8fafc' : sk.light, padding: '16px 20px 12px' }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: isLocked ? '#e2e8f0' : sk.gradient,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: isLocked ? 'none' : `0 4px 10px ${sk.color}40`
                            }}>
                              <i className={`bi ${sk.icon}`} style={{ color: '#fff', fontSize: 14 }}></i>
                            </div>
                            <span style={{
                              fontWeight: 700, fontSize: 11, letterSpacing: '1.5px',
                              color: isLocked ? '#94a3b8' : sk.color,
                              textTransform: 'uppercase'
                            }}>{sk.tag}</span>
                          </div>
                          {isLocked ? (
                            <span style={{
                              background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
                              borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700
                            }}>
                              <i className="bi bi-lock-fill me-1"></i>PREMIUM
                            </span>
                          ) : (
                            <span style={{
                              background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0',
                              borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700
                            }}>
                              FREE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h5 style={{
                          fontWeight: 700, fontSize: 15, lineHeight: 1.4,
                          color: '#0f172a', marginBottom: 12
                        }}>
                          {test.title}
                        </h5>

                        {/* Metadata chips */}
                        <div className="d-flex gap-2 flex-wrap mb-4">
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#f1f5f9', borderRadius: 6, padding: '4px 10px',
                            fontSize: 12, color: '#475569', fontWeight: 600
                          }}>
                            <i className="bi bi-clock" style={{ fontSize: 11 }}></i>
                            {test.durationMinutes} mins
                          </span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#f1f5f9', borderRadius: 6, padding: '4px 10px',
                            fontSize: 12, color: '#475569', fontWeight: 600
                          }}>
                            <i className="bi bi-list-check" style={{ fontSize: 11 }}></i>
                            {test.totalQuestions} questions
                          </span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#f1f5f9', borderRadius: 6, padding: '4px 10px',
                            fontSize: 12, color: '#475569', fontWeight: 600
                          }}>
                            <i className="bi bi-trophy" style={{ fontSize: 11 }}></i>
                            Band 0–9
                          </span>
                        </div>

                        {/* Bottom action row */}
                        <div className="mt-auto">
                          {/* Score display */}
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>
                              <i className="bi bi-bar-chart-fill me-1"></i>
                              Best score: <span style={{ fontWeight: 700, color: '#cbd5e1' }}>—</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                              <span style={{
                                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                                background: '#10b981', marginRight: 5
                              }}></span>
                              Not attempted
                            </div>
                          </div>

                          {/* Divider */}
                          <div style={{ height: 1, background: '#f1f5f9', marginBottom: 16 }}></div>

                          {isLocked ? (
                            <Link
                              to={test.courseId ? `/courses/${test.courseId}` : '#'}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                width: '100%', padding: '11px 20px',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: '#fff', borderRadius: 10, fontWeight: 700,
                                fontSize: 14, textDecoration: 'none', border: 'none',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <i className="bi bi-lock-fill"></i>
                              Unlock — View Course
                            </Link>
                          ) : (
                            <Link
                              to={`/learning/tests/${test.id}`}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                width: '100%', padding: '11px 20px',
                                background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
                                color: '#fff', borderRadius: 10, fontWeight: 700,
                                fontSize: 14, textDecoration: 'none', border: 'none',
                                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8, #2563eb)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #1e3a8a, #1d4ed8)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <i className="bi bi-play-fill" style={{ fontSize: 15 }}></i>
                              Start Mock Test
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
