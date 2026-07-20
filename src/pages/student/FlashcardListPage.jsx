import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getCurrentUser } from '../../services/authService';
import StudentPageBanner from '../../components/common/StudentPageBanner';

const ALL_CATEGORIES = 'all';

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const getCategoryName = (category) => (
  category?.name || category?.title || category?.topic || 'Untitled deck'
);

const getCategoryDescription = (category) => (
  category?.description || 'Practice IELTS vocabulary with this topic.'
);

const buildDecks = (categories, flashcards) => {
  const safeCategories = normalizeArray(categories);
  const safeFlashcards = normalizeArray(flashcards);

  return safeCategories.map((category) => {
    const categoryId = category?.id || '';
    const cards = safeFlashcards.filter((card) => card?.deckId === categoryId);

    return {
      id: categoryId,
      name: getCategoryName(category),
      description: getCategoryDescription(category),
      totalCards: cards.length,
      deckMode: category?.deckMode || 'free',
      courseId: category?.courseId || null,
    };
  });
};

// Map deck topic → icon + color
const getDeckStyle = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('reading') || n.includes('academic')) return { icon: 'bi-book-fill', color: '#0369a1', bg: '#e0f2fe', gradient: 'linear-gradient(135deg,#0ea5e9,#0369a1)' };
  if (n.includes('listening')) return { icon: 'bi-headphones', color: '#b45309', bg: '#fef3c7', gradient: 'linear-gradient(135deg,#f59e0b,#b45309)' };
  if (n.includes('writing') || n.includes('idiom') || n.includes('phrasal')) return { icon: 'bi-pencil-fill', color: '#6d28d9', bg: '#ede9fe', gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' };
  if (n.includes('speaking') || n.includes('vocabular')) return { icon: 'bi-chat-quote-fill', color: '#047857', bg: '#d1fae5', gradient: 'linear-gradient(135deg,#10b981,#047857)' };
  if (n.includes('environ') || n.includes('nature')) return { icon: 'bi-tree-fill', color: '#166534', bg: '#dcfce7', gradient: 'linear-gradient(135deg,#22c55e,#166534)' };
  if (n.includes('tech') || n.includes('innovation')) return { icon: 'bi-cpu-fill', color: '#1e40af', bg: '#dbeafe', gradient: 'linear-gradient(135deg,#3b82f6,#1e40af)' };
  if (n.includes('health') || n.includes('medicine')) return { icon: 'bi-heart-pulse-fill', color: '#be123c', bg: '#ffe4e6', gradient: 'linear-gradient(135deg,#f43f5e,#be123c)' };
  if (n.includes('education') || n.includes('learning')) return { icon: 'bi-mortarboard-fill', color: '#7c2d12', bg: '#ffedd5', gradient: 'linear-gradient(135deg,#f97316,#7c2d12)' };
  if (n.includes('travel') || n.includes('tourism')) return { icon: 'bi-airplane-fill', color: '#0e7490', bg: '#cffafe', gradient: 'linear-gradient(135deg,#06b6d4,#0e7490)' };
  if (n.includes('pet') || n.includes('b1') || n.includes('preliminary')) return { icon: 'bi-award-fill', color: '#7e22ce', bg: '#f3e8ff', gradient: 'linear-gradient(135deg,#a855f7,#7e22ce)' };
  return { icon: 'bi-layers-fill', color: '#475569', bg: '#f1f5f9', gradient: 'linear-gradient(135deg,#64748b,#475569)' };
};

const FlashcardListPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORIES);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadFlashcardDecks = async () => {
      setLoading(true);
      setError('');
      try {
        const user = getCurrentUser();
        const [categoryResponse, flashcardResponse, enrollmentsRes] = await Promise.all([
          api.get('/flashcardDecks?status=published'),
          api.get('/flashcards'),
          api.get(`/enrollments?userId=${user?.id}`)
        ]);
        if (!isMounted) return;
        setCategories(normalizeArray(categoryResponse.data));
        setFlashcards(normalizeArray(flashcardResponse.data));
        setEnrollments(normalizeArray(enrollmentsRes.data));
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError?.response?.status === 404
          ? 'Không tìm thấy bộ flashcard yêu cầu.'
          : 'Không thể tải danh sách flashcard. Vui lòng thử lại sau.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadFlashcardDecks();
    return () => { isMounted = false; };
  }, []);

  const decks = useMemo(() => buildDecks(categories, flashcards), [categories, flashcards]);

  const filteredDecks = useMemo(() => {
    let result = selectedCategoryId === ALL_CATEGORIES ? decks : decks.filter(d => d.id === selectedCategoryId);
    if (searchQuery.trim()) {
      result = result.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [decks, selectedCategoryId, searchQuery]);

  const freeCount = decks.filter(d => d.deckMode === 'free' || d.deckMode === 'public').length;
  const premiumCount = decks.filter(d => d.deckMode !== 'free' && d.deckMode !== 'public').length;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ===== HERO ===== */}
      <div style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)',
        padding: '72px 0 0',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', pointerEvents: 'none' }}/>

        <div className="container position-relative">
          <div className="text-center mb-5">
            {/* Tag */}
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-4"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <i className="bi bi-layers-fill" style={{ color: '#60a5fa' }}></i>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', color: '#60a5fa' }}>IELTS VOCABULARY BUILDER</span>
            </div>

            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
              Flashcard Decks
            </h1>
            <p style={{ fontSize: '1.05rem', opacity: 0.8, maxWidth: 520, margin: '0 auto 36px' }}>
              Memorize key IELTS vocabulary by topic. Study smart with spaced repetition flashcards.
            </p>

            {/* Search bar */}
            <div style={{ maxWidth: 440, margin: '0 auto 40px', position: 'relative' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 16 }}></i>
              <input
                type="text"
                placeholder="Search topics, e.g. Academic, Speaking..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '13px 16px 13px 44px',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 50, color: '#fff', fontSize: 14,
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                }}
                onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.18)'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              />
            </div>

            {/* Stats */}
            <div className="d-flex justify-content-center gap-5 mb-0">
              {[
                { num: decks.length, label: 'Total Decks' },
                { num: freeCount, label: 'Free Decks' },
                { num: premiumCount, label: 'Premium Decks' },
                { num: decks.reduce((s, d) => s + d.totalCards, 0), label: 'Total Cards' },
              ].map(({ num, label }) => (
                <div key={label} className="text-center">
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{num}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Pills Bar */}
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px 16px 0 0',
            padding: '20px 24px',
          }}>
            <div className="d-flex align-items-center gap-2 overflow-auto" style={{ scrollbarWidth: 'none' }}>
              <button
                type="button"
                onClick={() => setSelectedCategoryId(ALL_CATEGORIES)}
                className="d-flex align-items-center gap-2 fw-semibold flex-shrink-0"
                style={{
                  borderRadius: 50, padding: '9px 20px', fontSize: 14, border: 'none', cursor: 'pointer',
                  background: selectedCategoryId === ALL_CATEGORIES ? '#fff' : 'rgba(255,255,255,0.12)',
                  color: selectedCategoryId === ALL_CATEGORIES ? '#1e3a8a' : 'rgba(255,255,255,0.85)',
                  boxShadow: selectedCategoryId === ALL_CATEGORIES ? '0 4px 14px rgba(0,0,0,0.2)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="bi bi-grid-fill" style={{ fontSize: 13 }}></i>
                All Topics
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="d-flex align-items-center gap-2 fw-semibold flex-shrink-0"
                  style={{
                    borderRadius: 50, padding: '9px 20px', fontSize: 13, border: 'none', cursor: 'pointer',
                    background: selectedCategoryId === cat.id ? '#fff' : 'rgba(255,255,255,0.12)',
                    color: selectedCategoryId === cat.id ? '#1e3a8a' : 'rgba(255,255,255,0.85)',
                    boxShadow: selectedCategoryId === cat.id ? '0 4px 14px rgba(0,0,0,0.2)' : 'none',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getCategoryName(cat)}
                </button>
              ))}
              <span className="ms-auto text-white-50 small flex-shrink-0 fw-semibold">
                {filteredDecks.length} deck{filteredDecks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      {loading && (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '40vh' }}>
          <div className="spinner-border mb-3" style={{ width: '3rem', height: '3rem', color: '#1e3a8a' }} role="status" />
          <p className="text-muted fw-semibold">Loading flashcard decks...</p>
        </div>
      )}

      {!loading && error && (
        <div className="container mt-5">
          <div className="alert alert-danger border-0 rounded-4 p-4 text-center shadow-sm">
            <i className="bi bi-exclamation-triangle-fill fs-3 d-block mb-2 text-danger"></i>
            <h5 className="fw-bold">{error}</h5>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="container py-5">
          {filteredDecks.length === 0 ? (
            <div className="text-center py-5" data-testid="flashcard-empty">
              <i className="bi bi-search" style={{ fontSize: 64, color: '#cbd5e1' }}></i>
              <h5 className="fw-bold text-dark mt-3 mb-2">No decks found.</h5>
              <p className="text-muted">Try a different topic or clear the search.</p>
            </div>
          ) : (
            <div className="row g-4" data-testid="flashcard-deck-list">
              {filteredDecks.map((deck) => {
                const isLocked = deck.deckMode !== 'free' && deck.deckMode !== 'public' && !enrollments.some(e => e.courseId === deck.courseId);
                const style = getDeckStyle(deck.name);

                return (
                  <div className="col-12 col-md-6 col-xl-4" key={deck.id || deck.name}>
                    <div
                      style={{
                        background: '#fff',
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.3s ease',
                        display: 'flex', flexDirection: 'column', height: '100%',
                        filter: isLocked ? 'grayscale(20%)' : 'none',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)';
                        e.currentTarget.style.borderColor = isLocked ? '#e2e8f0' : style.color;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      {/* Top accent */}
                      <div style={{ height: 4, background: isLocked ? '#e2e8f0' : style.gradient }} />

                      {/* Card header */}
                      <div style={{ background: isLocked ? '#f8fafc' : style.bg, padding: '18px 20px 14px' }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: isLocked ? '#e2e8f0' : style.gradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isLocked ? 'none' : `0 4px 12px ${style.color}40`
                          }}>
                            <i className={`bi ${style.icon}`} style={{ color: '#fff', fontSize: 18 }}></i>
                          </div>
                          <div className="d-flex flex-column align-items-end gap-1">
                            {isLocked ? (
                              <span style={{
                                background: '#fef3c7', color: '#92400e',
                                border: '1px solid #fde68a',
                                borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700
                              }}>
                                <i className="bi bi-lock-fill me-1"></i>PREMIUM
                              </span>
                            ) : (
                              <span style={{
                                background: '#dcfce7', color: '#166534',
                                border: '1px solid #bbf7d0',
                                borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700
                              }}>
                                FREE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h5 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>
                          {deck.name}
                        </h5>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>
                          {deck.description}
                        </p>

                        {/* Meta chips */}
                        <div className="d-flex gap-2 mb-4">
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#f1f5f9', borderRadius: 6, padding: '4px 10px',
                            fontSize: 12, color: '#475569', fontWeight: 600
                          }}>
                            <i className="bi bi-card-text" style={{ fontSize: 11 }}></i>
                            {deck.totalCards} cards
                          </span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: '#f1f5f9', borderRadius: 6, padding: '4px 10px',
                            fontSize: 12, color: '#475569', fontWeight: 600
                          }}>
                            <i className="bi bi-lightning-fill" style={{ fontSize: 11 }}></i>
                            Spaced Repetition
                          </span>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 16 }}></div>

                        {isLocked ? (
                          <button
                            type="button"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              width: '100%', padding: '11px 20px',
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              color: '#fff', borderRadius: 10, fontWeight: 700,
                              fontSize: 14, border: 'none', cursor: 'pointer',
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
                            onClick={() => { if (deck.courseId) navigate(`/courses/${deck.courseId}`); }}
                            aria-label={`Unlock ${deck.name}`}
                          >
                            <i className="bi bi-lock-fill"></i>
                            Unlock — View Course
                          </button>
                        ) : (
                          <button
                            type="button"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              width: '100%', padding: '11px 20px',
                              background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
                              color: '#fff', borderRadius: 10, fontWeight: 700,
                              fontSize: 14, border: 'none', cursor: deck.id ? 'pointer' : 'not-allowed',
                              boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
                              transition: 'all 0.2s ease',
                              opacity: deck.id ? 1 : 0.6,
                            }}
                            onMouseEnter={e => {
                              if (deck.id) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8, #2563eb)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }
                            }}
                            onMouseLeave={e => {
                              if (deck.id) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #1e3a8a, #1d4ed8)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }
                            }}
                            onClick={() => { if (deck.id) navigate(`/learning/flashcards/${deck.id}`); }}
                            disabled={!deck.id}
                            aria-label={`Study ${deck.name}`}
                          >
                            <i className="bi bi-play-fill" style={{ fontSize: 15 }}></i>
                            Start Studying
                          </button>
                        )}
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
};

export default FlashcardListPage;
