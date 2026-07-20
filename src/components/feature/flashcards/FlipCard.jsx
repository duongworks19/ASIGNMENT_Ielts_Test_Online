import React from 'react';
import './FlipCard.css';

/**
 * FlipCard Component
 * Dumb component that renders a 3D flipping card (Quizlet style).
 */
const FlipCard = ({ frontText, backText, isFlipped, onFlip }) => {
  const displayFront = frontText || "Front Content Missing";
  const displayBack = backText || "Back Content Missing";

  const handleSpeak = (e, text) => {
    e.stopPropagation(); // Ngăn không cho thẻ bị lật khi click vào icon loa
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Có thể chỉnh ngôn ngữ ở đây, ví dụ: utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.");
    }
  };

  const handleStar = (e) => {
    e.stopPropagation(); // Ngăn không cho thẻ bị lật khi click vào icon sao
    // TODO: Implement star logic
  };

  return (
    <div className="flip-card-container" onClick={onFlip} role="button" aria-pressed={isFlipped}>
      <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
        
        {/* Front Side */}
        <div className="flip-card-front">
          <div className="card-header-icons justify-content-end">
            <div className="action-icons">
              <button className="icon-btn volume-btn me-3" onClick={(e) => handleSpeak(e, displayFront)} title="Nghe từ vựng">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </button>
            </div>
          </div>
          <div className="card-content">
            <h3>{displayFront}</h3>
          </div>
          <div className="card-footer-text">
            {/* Click to flip - quizlet doesn't always show this, but we can keep it subtle */}
          </div>
        </div>

        {/* Back Side */}
        <div className="flip-card-back">
          <div className="card-header-icons justify-content-end">
            <div className="action-icons">
              <button className="icon-btn volume-btn me-3" onClick={(e) => handleSpeak(e, displayBack)} title="Nghe định nghĩa">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </button>
            </div>
          </div>
          <div className="card-content">
            <h3>{displayBack}</h3>
          </div>
          <div className="card-footer-text">
            {/* Can leave empty */}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FlipCard;
