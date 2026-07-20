import React from 'react';
import PropTypes from 'prop-types';

/**
 * TFNotGivenRenderer Component
 * Renders True/False/Not Given (or Yes/No/Not Given) as premium pill-style buttons.
 */
const TFNotGivenRenderer = ({ question, currentAnswer, onAnswer, isReviewMode = false }) => {
  // EARS[Unwanted]: IF question data is invalid, THE system SHALL render a fallback message.
  if (!question || !question.id) {
    return (
      <div className="text-danger fst-italic" data-testid="tf-fallback">
        Dữ liệu câu hỏi bị lỗi.
      </div>
    );
  }

  // Fallback to default T/F/NG if options are not provided
  const options = Array.isArray(question.options) && question.options.length > 0
    ? question.options
    : ['True', 'False', 'Not Given'];

  const handleChange = (optionValue) => {
    // EARS[Event]: WHEN user selects T/F/NG option, THE system SHALL trigger onAnswer.
    if (onAnswer && !isReviewMode) {
      onAnswer(question.id, optionValue);
    }
  };

  const COLORS = {
    True: { active: '#198754', bg: '#d1e7dd', border: '#198754' },
    False: { active: '#dc3545', bg: '#f8d7da', border: '#dc3545' },
    'Not Given': { active: '#6c757d', bg: '#e2e3e5', border: '#6c757d' },
    Yes: { active: '#198754', bg: '#d1e7dd', border: '#198754' },
    No: { active: '#dc3545', bg: '#f8d7da', border: '#dc3545' },
  };

  return (
    <div className="tf-renderer" data-testid={`tf-question-${question.id}`}>
      <div className="mb-3">
        <p className="fs-6 text-dark lh-base mb-0" style={{ fontFamily: 'Arial, sans-serif' }}>
          {question.prompt || question.questionText}
        </p>
      </div>
      <div className="d-flex flex-column gap-2 ps-2">
        {options.map((option, index) => {
          const optionValue = typeof option === 'object' ? option.value : option;
          const optionLabel = typeof option === 'object' ? option.label : option;
          const isChecked = currentAnswer === optionValue;

          return (
            <label
              key={`${question.id}-opt-${index}`}
              className="d-flex align-items-start gap-2 mb-2"
              style={{
                cursor: isReviewMode ? 'not-allowed' : 'pointer',
                fontFamily: 'Arial, sans-serif',
                fontSize: '15px'
              }}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={optionValue}
                checked={isChecked}
                onChange={() => handleChange(optionValue)}
                disabled={isReviewMode}
                className="mt-1"
                style={{ transform: 'scale(1.2)', cursor: isReviewMode ? 'not-allowed' : 'pointer' }}
                data-testid={`tf-radio-${index}`}
              />
              <span className="text-dark" style={{ lineHeight: '1.5' }}>
                {optionLabel}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

TFNotGivenRenderer.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    prompt: PropTypes.string,
    questionText: PropTypes.string,
    options: PropTypes.array,
  }).isRequired,
  currentAnswer: PropTypes.any,
  onAnswer: PropTypes.func,
  isReviewMode: PropTypes.bool,
};

export default TFNotGivenRenderer;
