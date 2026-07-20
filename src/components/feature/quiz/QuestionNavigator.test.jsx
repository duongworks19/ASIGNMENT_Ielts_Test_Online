/**
 * Traceability Matrix:
 * - Feature: Practice Test & Quiz System
 * - Task: T012 - QuestionNavigator Component
 * - SPEC Requirement: "Question Navigator đổi màu theo trạng thái: Chưa làm, Đã làm, Đánh dấu"
 * 
 * Test Cases:
 * 1. Happy Path: Renders correct number of buttons based on totalQuestions.
 * 2. State-driven: Unanswered questions use btn-outline-secondary.
 * 3. State-driven: Answered questions use btn-primary.
 * 4. State-driven: Flagged questions use btn-warning (priority over answered).
 * 5. State-driven: Highlights the current question index.
 * 6. Event-driven: Clicking a button calls onNavigate with correct index.
 * 7. Error Case (Unwanted): Renders fallback when totalQuestions is <= 0 or invalid.
 * 8. Error Case (Unwanted): Handles null/undefined answers and flagged gracefully.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionNavigator from './QuestionNavigator';

describe('QuestionNavigator Component', () => {
  it('renders correct number of buttons', () => {
    render(<QuestionNavigator totalQuestions={10} onNavigate={jest.fn()} />);
    
    expect(screen.getByTestId('question-navigator')).toBeInTheDocument();
    
    for (let i = 0; i < 10; i++) {
      expect(screen.getByTestId(`nav-btn-${i}`)).toBeInTheDocument();
      expect(screen.getByTestId(`nav-btn-${i}`)).toHaveTextContent((i + 1).toString());
    }
  });

  // EARS[State-driven]: Color logic
  it('applies correct classes for unanswered, answered, flagged, and current states', () => {
    const answers = { 1: 'A', 2: 'B' }; // Index 1, 2 answered
    const flagged = [2, 3]; // Index 2 (answered), 3 flagged

    render(
      <QuestionNavigator 
        totalQuestions={5} 
        currentQuestionIndex={4} 
        answers={answers} 
        flagged={flagged} 
        onNavigate={jest.fn()} 
      />
    );

    const btn0 = screen.getByTestId('nav-btn-0'); // Unanswered, not flagged
    const btn1 = screen.getByTestId('nav-btn-1'); // Answered, not flagged
    const btn2 = screen.getByTestId('nav-btn-2'); // Answered, flagged
    const btn3 = screen.getByTestId('nav-btn-3'); // Unanswered, flagged
    const btn4 = screen.getByTestId('nav-btn-4'); // Current question

    expect(btn0).toHaveClass('btn-outline-secondary');
    expect(btn1).toHaveClass('btn-primary');
    
    // Flagged takes priority over answered
    expect(btn2).toHaveClass('btn-warning');
    expect(btn3).toHaveClass('btn-warning');

    // Current question should have border classes
    expect(btn4).toHaveClass('border-dark');
  });

  // EARS[Event]: onNavigate
  it('calls onNavigate with the correct index when clicked', () => {
    const onNavigateMock = jest.fn();
    render(<QuestionNavigator totalQuestions={5} onNavigate={onNavigateMock} />);

    const btn3 = screen.getByTestId('nav-btn-3');
    fireEvent.click(btn3);

    expect(onNavigateMock).toHaveBeenCalledTimes(1);
    expect(onNavigateMock).toHaveBeenCalledWith(3);
  });

  // EARS[Unwanted]: Error Handling
  it('renders fallback for invalid totalQuestions', () => {
    const { rerender } = render(<QuestionNavigator totalQuestions={0} onNavigate={jest.fn()} />);
    expect(screen.getByTestId('navigator-fallback')).toHaveTextContent('No questions available');

    rerender(<QuestionNavigator totalQuestions={-5} onNavigate={jest.fn()} />);
    expect(screen.getByTestId('navigator-fallback')).toHaveTextContent('No questions available');

    rerender(<QuestionNavigator totalQuestions="invalid" onNavigate={jest.fn()} />);
    expect(screen.getByTestId('navigator-fallback')).toHaveTextContent('No questions available');
  });

  it('handles missing answers and flagged props gracefully', () => {
    // Omitting answers and flagged
    render(<QuestionNavigator totalQuestions={3} onNavigate={jest.fn()} answers={null} flagged={null} />);
    
    // Should render normally without crashing
    for (let i = 0; i < 3; i++) {
      expect(screen.getByTestId(`nav-btn-${i}`)).toHaveClass('btn-outline-secondary');
    }
  });
});
