import React from 'react';
import PropTypes from 'prop-types';

/**
 * QuestionNavigator Component
 * Renders a grid of buttons representing quiz questions.
 * Allows quick navigation and displays status (answered, flagged, current).
 * 
 * @param {Object} props
 * @param {number} props.totalQuestions - Total number of questions in the quiz.
 * @param {number} props.currentQuestionIndex - The currently active question index (0-based).
 * @param {Object} props.answers - Object mapping question indices to answer values.
 * @param {Array|Set|Object} props.flagged - Collection of flagged question indices.
 * @param {Function} props.onNavigate - Callback function(index) triggered when a number is clicked.
 */
const QuestionNavigator = ({ 
  totalQuestions, 
  currentQuestionIndex, 
  answers = {}, 
  flagged = [], 
  onNavigate 
}) => {
  // EARS[Unwanted]: If totalQuestions is invalid, show a fallback message
  if (typeof totalQuestions !== 'number' || totalQuestions <= 0 || isNaN(totalQuestions)) {
    return <div className="text-muted" data-testid="navigator-fallback">No questions available</div>;
  }

  // Safe parsing for flagged elements (could be array, set, or object map)
  const isFlagged = (index) => {
    if (!flagged) return false;
    if (Array.isArray(flagged)) return flagged.includes(index);
    if (flagged instanceof Set) return flagged.has(index);
    return !!flagged[index];
  };

  // Safe parsing for answers
  const isAnswered = (index) => {
    if (!answers) return false;
    return answers[index] !== undefined && answers[index] !== null && answers[index] !== '';
  };

  const renderButtons = () => {
    const buttons = [];
    for (let i = 0; i < totalQuestions; i++) {
      // EARS[State-driven]: THE navigator SHALL display buttons colored based on answer and flag status.
      const answered = isAnswered(i);
      const flaggedStatus = isFlagged(i);
      const isCurrent = currentQuestionIndex === i;

      let btnClass = 'btn ';
      
      if (flaggedStatus) {
        btnClass += 'btn-warning text-dark ';
      } else if (answered) {
        btnClass += 'btn-primary text-white ';
      } else {
        btnClass += 'btn-outline-secondary ';
      }

      if (isCurrent) {
        // Highlight current question
        btnClass += 'border border-2 border-dark shadow-sm ';
      }

      buttons.push(
        <div className="col-auto p-1" key={i}>
          <button
            type="button"
            className={`${btnClass} d-flex align-items-center justify-content-center fw-bold`}
            style={{ width: '40px', height: '40px', padding: '0', borderRadius: '8px' }}
            onClick={() => {
              // EARS[Event]: WHEN user clicks a question number, THE system SHALL trigger onNavigate with the selected index.
              if (typeof onNavigate === 'function') {
                onNavigate(i);
              }
            }}
            data-testid={`nav-btn-${i}`}
            aria-label={`Go to question ${i + 1}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            {i + 1}
          </button>
        </div>
      );
    }
    return buttons;
  };

  return (
    <div className="question-navigator" data-testid="question-navigator">
      <div className="row g-0">
        {renderButtons()}
      </div>
    </div>
  );
};

QuestionNavigator.propTypes = {
  totalQuestions: PropTypes.number.isRequired,
  currentQuestionIndex: PropTypes.number,
  answers: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  flagged: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.instanceOf(Set)]),
  onNavigate: PropTypes.func.isRequired,
};

export default QuestionNavigator;
