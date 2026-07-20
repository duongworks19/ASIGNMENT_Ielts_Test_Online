import React from 'react';
import './FlipCard.css';

/**
 * FlipCard - Thẻ từ vựng lật 3D.
 * Mặt trước: từ vựng + phiên âm. Mặt sau: nghĩa + ví dụ.
 * @param {object}   card      Dữ liệu thẻ (term, phonetic, meaning, example...)
 * @param {boolean}  isFlipped Trạng thái đã lật hay chưa (điều khiển từ parent)
 * @param {function} onFlip    Hàm gọi khi click vào thẻ
 */
export default function FlipCard({ card, isFlipped, onFlip }) {
  if (!card) return null;

  return (
    <div
      className={`flip-card ${isFlipped ? 'is-flipped' : ''}`}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      aria-label={`Thẻ từ vựng ${card.term}. Nhấn để lật.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <div className="flip-card-inner">
        {/* MẶT TRƯỚC - Từ vựng */}
        <div className="flip-card-face flip-card-front">
          <span className="flip-card-topic">{card.topic}</span>
          <h2 className="flip-card-term">{card.term}</h2>
          {card.phonetic && <p className="flip-card-phonetic">{card.phonetic}</p>}
          {card.partOfSpeech && (
            <span className="flip-card-pos">{card.partOfSpeech}</span>
          )}
          <span className="flip-card-hint">Nhấn để xem nghĩa</span>
        </div>

        {/* MẶT SAU - Nghĩa + ví dụ */}
        <div className="flip-card-face flip-card-back">
          <span className="flip-card-back-label">Nghĩa</span>
          <p className="flip-card-meaning">{card.meaning}</p>
          {card.example && (
            <div className="flip-card-example">
              <span className="flip-card-example-label">Ví dụ</span>
              <p>"{card.example}"</p>
            </div>
          )}
          <span className="flip-card-hint flip-card-hint-back">Nhấn để lật lại</span>
        </div>
      </div>
    </div>
  );
}
