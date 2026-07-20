import React from 'react';
import PropTypes from 'prop-types';
import MCQRenderer from './renderers/MCQRenderer';
import TFNotGivenRenderer from './renderers/TFNotGivenRenderer';
import FillBlankRenderer from './renderers/FillBlankRenderer';
import WritingRenderer from './renderers/WritingRenderer';
import SpeakingRenderer from './renderers/SpeakingRenderer';

/**
 * QuestionRenderer — Factory component that maps question.type → specific renderer.
 * Supports: multiple-choice, true-false-not-given, fill-in-the-blank, writing-task, speaking-part
 */
const QuestionRenderer = ({ question, currentAnswer, onAnswer, isReviewMode = false }) => {
  if (!question || typeof question !== 'object') {
    return <div className="alert alert-danger" data-testid="renderer-error">Dữ liệu câu hỏi không hợp lệ.</div>;
  }

  const sharedProps = { question, currentAnswer, onAnswer, isReviewMode };

  switch (question.type) {
    case 'multiple-choice':
      return <MCQRenderer {...sharedProps} />;
    case 'true-false-not-given':
      return <TFNotGivenRenderer {...sharedProps} />;
    case 'fill-in-the-blank':
      return <FillBlankRenderer {...sharedProps} />;
    case 'writing-task':
      return <WritingRenderer {...sharedProps} />;
    case 'speaking-part':
      return <SpeakingRenderer {...sharedProps} />;
    default:
      return (
        <div className="alert alert-warning" data-testid="renderer-unsupported">
          Dạng câu hỏi chưa được hỗ trợ: <strong>{question.type || 'Unknown'}</strong>
        </div>
      );
  }
};

QuestionRenderer.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string,
    prompt: PropTypes.string,
  }),
  currentAnswer: PropTypes.any,
  onAnswer: PropTypes.func,
  isReviewMode: PropTypes.bool,
};

export default QuestionRenderer;
