/**
 * Traceability Matrix:
 * - Feature: Practice Test & Quiz System
 * - Task: T014 - Renderer: Multiple Choice
 * - SPEC Requirement: "Render card-style clickable options. Trigger onAnswer(questionId, answer) on click."
 * 
 * Test Cases:
 * 1. Happy Path: Renders prompt and option cards correctly.
 * 2. Event-driven: Triggers onAnswer with correct data when an option is clicked.
 * 3. State-driven: Disables all options when isReviewMode is true.
 * 4. State-driven: Marks the correct option as checked based on currentAnswer.
 * 5. Error Case (Unwanted): Renders fallback text when options array is empty or missing.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MCQRenderer from './MCQRenderer';

describe('MCQRenderer Component', () => {
  const mockQuestion = {
    id: 1,
    prompt: 'What is the capital of France?',
    options: ['London', 'Paris', 'Berlin', 'Madrid'],
  };

  it('renders prompt and option cards correctly', () => {
    render(<MCQRenderer question={mockQuestion} />);
    expect(screen.getByText(/What is the capital of France\?/i)).toBeInTheDocument();
    
    // Verify all 4 option cards rendered via data-testid
    expect(screen.getByTestId('mcq-radio-0')).toBeInTheDocument();
    expect(screen.getByTestId('mcq-radio-1')).toBeInTheDocument();
    expect(screen.getByTestId('mcq-radio-2')).toBeInTheDocument();
    expect(screen.getByTestId('mcq-radio-3')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
  });

  // EARS[Event]
  it('triggers onAnswer with correct data when an option is selected', () => {
    const onAnswerMock = jest.fn();
    render(<MCQRenderer question={mockQuestion} onAnswer={onAnswerMock} />);
    
    const parisCard = screen.getByTestId('mcq-radio-1'); // Index 1 is Paris
    fireEvent.click(parisCard);
    
    expect(onAnswerMock).toHaveBeenCalledTimes(1);
    expect(onAnswerMock).toHaveBeenCalledWith(1, 'Paris');
  });

  // EARS[State-driven]: isReviewMode — hidden radios should be disabled
  it('disables all inputs when isReviewMode is true', () => {
    render(<MCQRenderer question={mockQuestion} isReviewMode={true} />);
    // The hidden radio inputs carry the disabled state
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      expect(radio).toBeDisabled();
    });
  });

  // EARS[State-driven]: currentAnswer — hidden radio is checked
  it('marks the correct hidden radio based on currentAnswer', () => {
    render(<MCQRenderer question={mockQuestion} currentAnswer="Berlin" />);
    
    // The hidden radio inputs carry the checked state (index 2 = Berlin)
    const radios = document.querySelectorAll('input[type="radio"]');
    expect(radios[2]).toBeChecked(); // Berlin is at index 2
    expect(radios[0]).not.toBeChecked(); // London
  });

  // EARS[Unwanted]: Error Case
  it('renders fallback text when options array is empty or missing', () => {
    const { rerender } = render(<MCQRenderer question={{ id: 2, prompt: 'No options' }} />);
    expect(screen.getByTestId('mcq-fallback')).toHaveTextContent('Không tìm thấy lựa chọn nào cho câu hỏi này.');

    rerender(<MCQRenderer question={{ id: 3, prompt: 'Empty', options: [] }} />);
    expect(screen.getByTestId('mcq-fallback')).toBeInTheDocument();
  });
});
