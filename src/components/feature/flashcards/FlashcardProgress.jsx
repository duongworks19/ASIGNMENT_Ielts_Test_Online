import React from 'react';

const clampNumber = (value, min, max) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return min;
  }

  return Math.min(Math.max(numericValue, min), max);
};

/**
 * FlashcardProgress Component
 * Displays Known, Review and Remaining counts with a Bootstrap stacked progress bar.
 * @param {number} total - Total number of flashcards in the current deck.
 * @param {number} knownCount - Number of flashcards marked as known.
 * @param {number} reviewCount - Number of flashcards marked for review.
 */
const FlashcardProgress = ({ total = 0, knownCount = 0, reviewCount = 0 }) => {
  // EARS[Ubiquitous]: THE system SHALL provide visual indication of learning status.
  const safeTotal = clampNumber(total, 0, Number.MAX_SAFE_INTEGER);

  // EARS[Unwanted]: WHERE flashcard data is incomplete, THE system SHALL display fallback values instead of undefined content.
  const safeKnownCount = clampNumber(knownCount, 0, safeTotal);

  // EARS[Unwanted]: WHERE duplicate or invalid status counts exceed the deck total, THE system SHALL avoid displaying impossible progress values.
  const safeReviewCount = clampNumber(reviewCount, 0, Math.max(safeTotal - safeKnownCount, 0));

  const remainingCount = Math.max(safeTotal - safeKnownCount - safeReviewCount, 0);
  const hasCards = safeTotal > 0;

  const knownPercent = hasCards ? (safeKnownCount / safeTotal) * 100 : 0;
  const reviewPercent = hasCards ? (safeReviewCount / safeTotal) * 100 : 0;
  const remainingPercent = hasCards ? (remainingCount / safeTotal) * 100 : 0;

  // EARS[State]: WHILE a flashcard is marked Known, THE system SHALL visually indicate mastered status.
  // EARS[State]: WHILE a flashcard is marked Review, THE system SHALL visually indicate review status.
  return (
    <section className="card border-0 shadow-sm mb-4" aria-labelledby="flashcard-progress-title">
      <div className="card-body">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
          <div>
            <h2 id="flashcard-progress-title" className="h5 mb-1">
              Learning Progress
            </h2>
            <p className="text-muted mb-0">
              {safeKnownCount} known, {safeReviewCount} review, {remainingCount} remaining
            </p>
          </div>
          <span className="badge rounded-pill text-bg-light align-self-start align-self-md-center">
            Total: {safeTotal}
          </span>
        </div>

        {/* EARS[Unwanted]: WHERE category filter returns no data, THE system SHALL show an empty progress state instead of broken percentages. */}
        {!hasCards ? (
          <div className="alert alert-light border mb-0" role="status">
            Chua co flashcard de hien thi tien do.
          </div>
        ) : (
          <>
            <div
              className="progress"
              role="progressbar"
              aria-label="Flashcard learning progress"
              aria-valuenow={safeKnownCount + safeReviewCount}
              aria-valuemin="0"
              aria-valuemax={safeTotal}
              style={{ height: '1rem' }}
            >
              <div
                className="progress-bar bg-success"
                style={{ width: `${knownPercent}%` }}
                title={`${safeKnownCount} known`}
              />
              <div
                className="progress-bar bg-warning text-dark"
                style={{ width: `${reviewPercent}%` }}
                title={`${safeReviewCount} review`}
              />
              <div
                className="progress-bar bg-secondary"
                style={{ width: `${remainingPercent}%` }}
                title={`${remainingCount} remaining`}
              />
            </div>

            <div className="d-flex flex-wrap gap-3 mt-3 small">
              <span className="d-inline-flex align-items-center gap-2">
                <span className="badge bg-success rounded-pill">&nbsp;</span>
                Known: {safeKnownCount}
              </span>
              <span className="d-inline-flex align-items-center gap-2">
                <span className="badge bg-warning rounded-pill">&nbsp;</span>
                Review: {safeReviewCount}
              </span>
              <span className="d-inline-flex align-items-center gap-2">
                <span className="badge bg-secondary rounded-pill">&nbsp;</span>
                Remaining: {remainingCount}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FlashcardProgress;
