import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * WritingRenderer — Renders IELTS Writing Task 1 / Task 2
 * Stores the essay text via onAnswer on blur/change.
 */
const WritingRenderer = ({ question, currentAnswer, onAnswer, isReviewMode = false }) => {
  const [text, setText] = useState(currentAnswer || '');
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minWords = question.minWords || (question.taskNumber === 1 ? 150 : 250);
  const isEnough = wordCount >= minWords;

  useEffect(() => {
    setText(currentAnswer || '');
  }, [currentAnswer]);

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const handleBlur = () => {
    if (onAnswer && !isReviewMode && text !== currentAnswer) {
      onAnswer(question.id, text.trim());
    }
  };

  return (
    <div className="writing-renderer" data-testid={`writing-question-${question.id}`}>
      {/* Task label */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <span className="badge px-3 py-2 fw-bold"
          style={{ background: '#8b5cf6', color: '#fff', borderRadius: 20, fontSize: 13 }}>
          Writing Task {question.taskNumber || 1}
        </span>
        <span className="text-muted small">
          Thời gian đề nghị: {question.taskNumber === 1 ? '20' : '40'} phút
        </span>
      </div>

      {/* Instructions */}
      {question.instruction && (
        <div className="p-3 rounded-3 mb-3"
          style={{ background: '#faf5ff', border: '1px solid #e9d5ff', fontSize: 14, color: '#6d28d9' }}>
          <em>{question.instruction}</em>
        </div>
      )}

      {/* Task prompt */}
      <div className="p-4 rounded-3 mb-3"
        style={{ background: '#f8fafc', border: '2px solid #e2e8f0' }}>
        <p className="fw-semibold text-dark lh-lg mb-0" style={{ fontSize: 15 }}>
          {question.prompt || question.questionText}
        </p>
      </div>

      {/* Min words notice */}
      <p className="text-muted small mb-2">
        ✍️ Viết ít nhất <strong>{minWords} từ</strong>. Đừng viết địa chỉ. Bài thi sẽ không được tính nếu thiếu số từ yêu cầu.
      </p>

      {/* Textarea */}
      <div className="position-relative">
        <textarea
          className="form-control"
          rows={isReviewMode ? undefined : 12}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isReviewMode}
          placeholder="Bắt đầu viết bài của bạn tại đây..."
          data-testid="writing-textarea"
          style={{
            borderRadius: 12,
            border: isEnough ? '2px solid #10b981' : '2px solid #e2e8f0',
            fontSize: 15,
            lineHeight: 1.8,
            background: isReviewMode ? '#f8fafc' : '#fff',
            minHeight: isReviewMode ? 120 : 280,
            resize: 'vertical',
            transition: 'border-color 0.2s ease',
          }}
        />
        {/* Word count */}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: isEnough ? '#10b981' : wordCount > 0 ? '#f59e0b' : '#94a3b8',
          }}>
            {isEnough ? '✓ ' : ''}{wordCount} từ
            {!isEnough && wordCount > 0 && ` (cần thêm ${minWords - wordCount} từ)`}
          </span>
          {isEnough && <span style={{ fontSize: 12, color: '#10b981' }}>Đủ số từ yêu cầu</span>}
        </div>
      </div>
    </div>
  );
};

WritingRenderer.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    prompt: PropTypes.string,
    questionText: PropTypes.string,
    instruction: PropTypes.string,
    taskNumber: PropTypes.number,
    minWords: PropTypes.number,
  }).isRequired,
  currentAnswer: PropTypes.any,
  onAnswer: PropTypes.func,
  isReviewMode: PropTypes.bool,
};

export default WritingRenderer;
