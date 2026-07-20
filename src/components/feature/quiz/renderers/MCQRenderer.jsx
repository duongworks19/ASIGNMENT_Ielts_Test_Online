import React from 'react';
import PropTypes from 'prop-types';

/**
 * MCQRenderer Component
 * Renders a Multiple Choice Question with premium bordered card-style radio options.
 */
const MCQRenderer = ({ question, currentAnswer, onAnswer, isReviewMode = false }) => {
  // EARS[Unwanted]: IF options array is empty or missing, THE system SHALL render a fallback message.
  if (!question || !Array.isArray(question.options) || question.options.length === 0) {
    return (
      <div className="text-muted fst-italic" data-testid="mcq-fallback">
        Không tìm thấy lựa chọn nào cho câu hỏi này.
      </div>
    );
  }

  const handleChange = (optionValue) => {
    // EARS[Event]: WHEN user selects an option, THE system SHALL trigger onAnswer.
    if (onAnswer && !isReviewMode) {
      onAnswer(question.id, optionValue);
    }
  };

  const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="mcq-renderer" data-testid={`mcq-question-${question.id}`}>
      <div className="mb-3">
        <p className="fs-6 text-dark lh-base mb-0" style={{ fontFamily: 'Arial, sans-serif' }}>
          {question.prompt || question.questionText}
        </p>
      </div>
      <div className="question-options d-flex flex-column gap-2 ps-2">
        {question.options.map((option, index) => {
          const optionValue = typeof option === 'object' ? option.value : option;
          const optionLabel = typeof option === 'object' ? option.label : option;
          const isChecked = currentAnswer === optionValue;
          const letter = OPTION_LETTERS[index] || String(index + 1);

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
                data-testid={`mcq-radio-${index}`}
              />
              <span className="text-dark" style={{ lineHeight: '1.5' }}>
                <strong className="me-2">{letter}.</strong>{optionLabel}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

MCQRenderer.propTypes = {
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

export default MCQRenderer;
