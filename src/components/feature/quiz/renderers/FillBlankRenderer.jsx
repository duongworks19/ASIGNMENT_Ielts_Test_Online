import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * FillBlankRenderer Component
 * Renders Fill in the Blank question types with a premium styled text input.
 */
const FillBlankRenderer = ({ question, currentAnswer, onAnswer, isReviewMode = false }) => {
  // EARS[State-driven]: THE local state SHALL sync with the external currentAnswer prop.
  const [localValue, setLocalValue] = useState(currentAnswer || '');

  useEffect(() => {
    setLocalValue(currentAnswer || '');
  }, [currentAnswer]);

  // EARS[Unwanted]: IF question data is invalid, THE system SHALL render an error message.
  if (!question || !question.id) {
    return (
      <div className="text-danger fst-italic" data-testid="fillblank-fallback">
        Dữ liệu câu hỏi bị lỗi.
      </div>
    );
  }

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    // EARS[Event]: WHEN user blurs the input field, THE system SHALL trigger onAnswer.
    if (onAnswer && !isReviewMode) {
      if (localValue !== currentAnswer) {
        onAnswer(question.id, localValue.trim());
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <div className="fillblank-renderer" data-testid={`fillblank-question-${question.id}`}>
      <div className="mb-3">
        <p className="fs-6 text-dark lh-base mb-0" style={{ fontFamily: 'Arial, sans-serif' }}>
          {question.prompt || question.questionText}
        </p>
      </div>
      <div className="question-input">
        <input
          type="text"
          className="form-control"
          id={`q${question.id}-input`}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isReviewMode}
          data-testid="fillblank-input"
          autoComplete="off"
          style={{
            maxWidth: 300,
            border: '1px solid #000',
            borderRadius: 0,
            background: isReviewMode ? '#e9ecef' : '#fff',
            boxShadow: 'none',
            fontSize: '15px'
          }}
        />
      </div>
    </div>
  );
};

FillBlankRenderer.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    prompt: PropTypes.string,
    questionText: PropTypes.string,
  }).isRequired,
  currentAnswer: PropTypes.any,
  onAnswer: PropTypes.func,
  isReviewMode: PropTypes.bool,
};

export default FillBlankRenderer;
