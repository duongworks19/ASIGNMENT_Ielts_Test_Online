import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import FlipCard from '../../components/feature/FlipCard';
import { getFlashcardsByCourse } from '../../services/flashcardService';
import { getCourseById } from '../../services/courseLearning.service';
import './FlashcardDeck.css';

export default function FlashcardDeck() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learned, setLearned] = useState(() => new Set());

  useEffect(() => {
    window.scrollTo(0, 0);
    let ignore = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [cardData, courseData] = await Promise.all([
          getFlashcardsByCourse(courseId),
          getCourseById(courseId).catch(() => null),
        ]);
        if (!ignore) {
          setCards(cardData);
          setCourse(courseData);
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được flashcard.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [courseId]);

  const total = cards.length;
  const current = cards[index];
  const progressPercent = total > 0 ? Math.round((learned.size / total) * 100) : 0;

  const goTo = (nextIndex) => {
    setIsFlipped(false);
    // Đợi thẻ lật về mặt trước rồi mới đổi nội dung cho mượt
    setTimeout(() => setIndex(nextIndex), 150);
  };

  const handleNext = () => {
    if (total === 0) return;
    goTo((index + 1) % total);
  };

  const handlePrev = () => {
    if (total === 0) return;
    goTo((index - 1 + total) % total);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setCards((prev) => {
      const shuffled = [...prev].sort(() => Math.random() - 0.5);
      return shuffled;
    });
    setIndex(0);
  };

  const handleToggleLearned = () => {
    if (!current) return;
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(current.id)) {
        next.delete(current.id);
      } else {
        next.add(current.id);
      }
      return next;
    });
  };

  const handleReset = () => {
    setLearned(new Set());
    setIndex(0);
    setIsFlipped(false);
  };

  // Điều khiển bằng bàn phím: trái/phải để chuyển, space để lật
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, total]);

  const isCurrentLearned = current ? learned.has(current.id) : false;

  if (loading) {
    return (
      <div className="deck-page">
        <div className="deck-state">Đang tải flashcard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deck-page">
        <div className="deck-state deck-state-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="deck-page">
      <div className="deck-container">
        {/* Header */}
        <div className="deck-header">
          <button type="button" className="deck-back" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
          <div className="deck-heading">
            <span className="deck-eyebrow">Flashcard từ vựng</span>
            <h1>{course?.title || 'Khóa học IELTS'}</h1>
            <p>Học và ghi nhớ từ vựng trọng tâm của khóa học này.</p>
          </div>
        </div>

        {total === 0 ? (
          <div className="deck-empty">
            <p>Khóa học này chưa có flashcard nào.</p>
            <Link to="/learning/courses" target="_top" className="deck-btn deck-btn-primary">
              <i className="bi bi-book"></i> Về khóa học
            </Link>
          </div>
        ) : (
          <>
            {/* Thanh tiến độ */}
            <div className="deck-progress">
              <div className="deck-progress-info">
                <span>Đã thuộc: <strong>{learned.size}/{total}</strong></span>
                <span>{progressPercent}%</span>
              </div>
              <div className="deck-progress-bar">
                <div className="deck-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {/* Thẻ */}
            <FlipCard
              card={current}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped((f) => !f)}
            />

            {/* Bộ đếm thẻ */}
            <p className="deck-counter">
              Thẻ <strong>{index + 1}</strong> / {total}
            </p>

            {/* Điều khiển */}
            <div className="deck-controls">
              <button type="button" className="deck-btn deck-nav" onClick={handlePrev}>
                ← Trước
              </button>

              <button
                type="button"
                className={`deck-btn deck-learned ${isCurrentLearned ? 'active' : ''}`}
                onClick={handleToggleLearned}
              >
                {isCurrentLearned ? '✓ Đã thuộc' : 'Đánh dấu đã thuộc'}
              </button>

              <button type="button" className="deck-btn deck-nav" onClick={handleNext}>
                Tiếp →
              </button>
            </div>

            <div className="deck-actions">
              <button type="button" className="deck-link-btn" onClick={handleShuffle}>
                🔀 Trộn thẻ
              </button>
              <button type="button" className="deck-link-btn" onClick={handleReset}>
                ↺ Học lại từ đầu
              </button>
            </div>

            {progressPercent === 100 && (
              <div className="deck-complete">
                🎉 Tuyệt vời! Bạn đã thuộc toàn bộ {total} từ của khóa học này.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
