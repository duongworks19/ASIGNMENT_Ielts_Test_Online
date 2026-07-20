/**
 * Traceability Matrix:
 * - Feature: Practice Test & Quiz System
 * - Task: T013 - QuestionRenderer Component Map
 * - SPEC Requirement: "Switch/case dựa trên question.type. Hiển thị thông báo 'Dạng câu hỏi chưa được hỗ trợ' nếu type lạ."
 * 
 * Test Cases:
 * 1. Happy Path: Renders multiple-choice placeholder when type is 'multiple-choice'.
 * 2. Happy Path: Renders T/F/NG placeholder when type is 'true-false-not-given'.
 * 3. Happy Path: Renders Fill Blank placeholder when type is 'fill-in-the-blank'.
 * 4. Error Case (Unwanted): Displays "Dạng câu hỏi chưa được hỗ trợ" for unknown types.
 * 5. Error Case (Unwanted): Displays "Dữ liệu câu hỏi không hợp lệ" when question is null or missing.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionRenderer from './QuestionRenderer';

describe('QuestionRenderer Component', () => {
  // EARS[State-driven]: Happy paths for supported types
  it('renders MCQ component for multiple-choice type', () => {
    // MCQRenderer needs options array to render properly without fallback
    const question = { id: 1, type: 'multiple-choice', options: ['A', 'B'] };
    render(<QuestionRenderer question={question} />);
    expect(screen.getByTestId('mcq-question-1')).toBeInTheDocument();
  });

  it('renders TF component for true-false-not-given type', () => {
    const question = { id: 2, type: 'true-false-not-given' };
    render(<QuestionRenderer question={question} />);
    expect(screen.getByTestId('tf-question-2')).toBeInTheDocument();
  });

  it('renders Fill Blank component for fill-in-the-blank type', () => {
    const question = { id: 3, type: 'fill-in-the-blank' };
    render(<QuestionRenderer question={question} />);
    expect(screen.getByTestId('fillblank-question-3')).toBeInTheDocument();
  });

  // EARS[Unwanted]: Unsupported type
  it('displays unsupported message for unknown question types', () => {
    const question = { id: 4, type: 'matching-heading' };
    render(<QuestionRenderer question={question} />);
    
    const alert = screen.getByTestId('renderer-unsupported');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Dạng câu hỏi chưa được hỗ trợ');
    expect(alert).toHaveClass('alert-warning');
  });

  // EARS[Unwanted]: Null/undefined question
  it('displays error message when question is null or undefined', () => {
    const { rerender } = render(<QuestionRenderer question={null} />);
    let errorAlert = screen.getByTestId('renderer-error');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent('Dữ liệu câu hỏi không hợp lệ');
    expect(errorAlert).toHaveClass('alert-danger');

    rerender(<QuestionRenderer question={undefined} />);
    errorAlert = screen.getByTestId('renderer-error');
    expect(errorAlert).toBeInTheDocument();
  });
});
