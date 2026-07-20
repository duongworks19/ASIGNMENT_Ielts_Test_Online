import React, { useState } from 'react';

const toSafeIndex = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(Math.floor(numericValue), 0);
};

const toSafeTotal = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(Math.floor(numericValue), 0);
};

const callIfFunction = (callback) => {
  if (typeof callback === 'function') {
    callback();
  }
};

/**
 * FlashcardControls Component
 * Renders Quizlet-style controls: Progress toggle, Prev, X/Y, Next, Play, Shuffle, Settings, Fullscreen
 */
const FlashcardControls = ({
  currentIndex = 0,
  total = 0,
  onPrevious,
  onShuffle,
  onNext,
  disabled = false
}) => {
  const safeTotal = toSafeTotal(total);
  const safeCurrentIndex = safeTotal > 0 ? Math.min(toSafeIndex(currentIndex), safeTotal - 1) : 0;
  const hasCards = safeTotal > 0;
  const isSingleCardDeck = safeTotal === 1;
  const controlsDisabled = disabled || !hasCards;
  const positionLabel = hasCards ? `${safeCurrentIndex + 1} / ${safeTotal}` : '0 / 0';

  return (
    <nav className="flashcard-controls mt-4 d-flex justify-content-between align-items-center px-2">
      <style>
        {`
          .flashcard-controls .icon-btn {
            background: none;
            border: none;
            color: #586380;
            cursor: pointer;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: inline-flex;
            justify-content: center;
            align-items: center;
            transition: all 0.2s;
            font-size: 1.25rem;
          }
          .flashcard-controls .icon-btn:hover:not(:disabled) {
            background-color: #f6f7fb;
            color: #1a1d28;
          }
          .flashcard-controls .icon-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .nav-arrow-btn {
            width: 48px !important;
            height: 48px !important;
            border: 1px solid #d9dde8 !important;
            color: #1a1d28 !important;
          }
          .nav-arrow-btn:hover:not(:disabled) {
            box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075);
          }
        `}
      </style>

      {/* Left Spacer to balance the layout since progress toggle was removed */}
      <div className="d-flex align-items-center gap-2" style={{ width: '100px' }}>
      </div>

      {/* Middle: Prev, 1/30, Next */}
      <div className="d-flex align-items-center gap-3">
        <button
          className="icon-btn nav-arrow-btn"
          onClick={() => callIfFunction(onPrevious)}
          disabled={controlsDisabled}
          title="Thẻ trước"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        
        <span className="fw-semibold text-body-strong" style={{ minWidth: '4rem', textAlign: 'center' }}>
          {positionLabel}
        </span>

        <button
          className="icon-btn nav-arrow-btn"
          onClick={() => callIfFunction(onNext)}
          disabled={controlsDisabled}
          title="Thẻ tiếp theo"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="d-flex align-items-center gap-1" style={{ width: '100px', justifyContent: 'flex-end' }}>
        <button 
          className="icon-btn" 
          onClick={() => callIfFunction(onShuffle)}
          disabled={controlsDisabled || isSingleCardDeck}
          title="Xáo trộn"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
        </button>
      </div>
    </nav>
  );
};

export default FlashcardControls;
