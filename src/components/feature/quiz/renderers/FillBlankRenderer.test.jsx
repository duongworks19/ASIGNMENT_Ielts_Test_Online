/**
 * Traceability Matrix:
 * - Feature: Practice Test & Quiz System
 * - Task: T016 - Renderer: Fill in the Blank
 * - SPEC Requirement: "Text input field(s). Bắt sự kiện onBlur để không update state liên tục quá nhanh."
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FillBlankRenderer from './FillBlankRenderer';

describe('FillBlankRenderer Component', () => {
  const mockQuestion = {
    id: 1,
    prompt: 'The capital of Japan is ______.',
  };

  it('renders prompt and text input correctly', () => {
    render(<FillBlankRenderer question={mockQuestion} />);
    expect(screen.getByText(/The capital of Japan is ______./i)).toBeInTheDocument();
    expect(screen.getByTestId('fillblank-input')).toBeInTheDocument();
  });

  // EARS[State-driven]: Sync currentAnswer
  it('syncs localValue with currentAnswer prop', () => {
    const { rerender } = render(<FillBlankRenderer question={mockQuestion} currentAnswer="Tokyo" />);
    const input = screen.getByTestId('fillblank-input');
    expect(input).toHaveValue('Tokyo');

    // Test external update
    rerender(<FillBlankRenderer question={mockQuestion} currentAnswer="Kyoto" />);
    expect(input).toHaveValue('Kyoto');
  });

  // EARS[Event]: onBlur logic
  it('updates local state on change but triggers onAnswer ONLY on blur', () => {
    const onAnswerMock = jest.fn();
    render(<FillBlankRenderer question={mockQuestion} currentAnswer="" onAnswer={onAnswerMock} />);
    
    const input = screen.getByTestId('fillblank-input');
    
    // User types "Osaka"
    fireEvent.change(input, { target: { value: 'Osaka' } });
    expect(input).toHaveValue('Osaka');
    expect(onAnswerMock).not.toHaveBeenCalled(); // Shouldn't call onAnswer yet
    
    // User clicks away (blur)
    fireEvent.blur(input);
    expect(onAnswerMock).toHaveBeenCalledTimes(1);
    expect(onAnswerMock).toHaveBeenCalledWith(1, 'Osaka');
  });

  it('calls e.target.blur() when Enter is pressed', () => {
    const onAnswerMock = jest.fn();
    render(<FillBlankRenderer question={mockQuestion} currentAnswer="" onAnswer={onAnswerMock} />);
    
    const input = screen.getByTestId('fillblank-input');
    input.blur = jest.fn(); // Mock the native DOM method
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(input.blur).toHaveBeenCalledTimes(1);
  });

  // EARS[State-driven]: isReviewMode
  it('disables input when isReviewMode is true', () => {
    render(<FillBlankRenderer question={mockQuestion} isReviewMode={true} />);
    expect(screen.getByTestId('fillblank-input')).toBeDisabled();
  });

  // EARS[Unwanted]: Error Case
  it('renders fallback for invalid question', () => {
    render(<FillBlankRenderer question={null} />);
    expect(screen.getByTestId('fillblank-fallback')).toHaveTextContent('Dữ liệu câu hỏi bị lỗi.');
  });
});
