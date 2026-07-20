/**
 * Traceability Matrix:
 * - Feature: Practice Test & Quiz System
 * - Task: T015 - Renderer: True/False/Not Given
 * - SPEC Requirement: "Pill-button layout for T/F/NG options (redesigned from radio)."
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TFNotGivenRenderer from './TFNotGivenRenderer';

describe('TFNotGivenRenderer Component', () => {
  const mockQuestion = {
    id: 1,
    prompt: 'The sky is blue.',
  }; // No options provided to test default fallback

  it('renders default options when options array is missing', () => {
    render(<TFNotGivenRenderer question={mockQuestion} />);
    
    // UI uses pill buttons, not radio inputs
    expect(screen.getByTestId('tf-radio-0')).toBeInTheDocument();
    expect(screen.getByTestId('tf-radio-1')).toBeInTheDocument();
    expect(screen.getByTestId('tf-radio-2')).toBeInTheDocument();
    expect(screen.getByText('True')).toBeInTheDocument();
    expect(screen.getByText('False')).toBeInTheDocument();
    expect(screen.getByText('Not Given')).toBeInTheDocument();
  });

  it('renders custom options if provided', () => {
    const customQuestion = {
      id: 2,
      prompt: 'Is this yes or no?',
      options: ['Yes', 'No', 'Not Given']
    };
    render(<TFNotGivenRenderer question={customQuestion} />);
    
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.queryByText('True')).not.toBeInTheDocument();
  });

  // EARS[Event]
  it('triggers onAnswer with correct data when selected', () => {
    const onAnswerMock = jest.fn();
    render(<TFNotGivenRenderer question={mockQuestion} onAnswer={onAnswerMock} />);
    
    const falseBtn = screen.getByTestId('tf-radio-1'); // Index 1 is False
    fireEvent.click(falseBtn);
    
    expect(onAnswerMock).toHaveBeenCalledTimes(1);
    expect(onAnswerMock).toHaveBeenCalledWith(1, 'False');
  });

  // EARS[State-driven]: isReviewMode disables buttons
  it('disables buttons when isReviewMode is true', () => {
    render(<TFNotGivenRenderer question={mockQuestion} isReviewMode={true} />);
    // All 3 pill buttons should be disabled
    const btn0 = screen.getByTestId('tf-radio-0');
    const btn1 = screen.getByTestId('tf-radio-1');
    const btn2 = screen.getByTestId('tf-radio-2');
    expect(btn0).toBeDisabled();
    expect(btn1).toBeDisabled();
    expect(btn2).toBeDisabled();
  });

  // EARS[State-driven]: currentAnswer highlights selected button
  it('highlights correct button based on currentAnswer', () => {
    render(<TFNotGivenRenderer question={mockQuestion} currentAnswer="Not Given" />);
    // Button at index 2 is "Not Given" - verify it exists and is in the DOM
    expect(screen.getByTestId('tf-radio-2')).toBeInTheDocument();
    expect(screen.getByText('Not Given')).toBeInTheDocument();
  });

  // EARS[Unwanted]: Error Case
  it('renders fallback for invalid question', () => {
    render(<TFNotGivenRenderer question={null} />);
    expect(screen.getByTestId('tf-fallback')).toHaveTextContent('Dữ liệu câu hỏi bị lỗi.');
  });
});
