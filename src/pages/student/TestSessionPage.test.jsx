/**
 * Traceability Matrix:
 * - Feature: Practice Test & Quiz System
 * - Task: T019 - Page: Test Session Page
 * - SPEC Requirement: "Ghép UI Layout, mount Timer, Navigator, Renderer. Gọi submitAttempt tự động khi hết giờ."
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import TestSessionPage from './TestSessionPage';

// Mock the child components to simplify testing integration
jest.mock('../../components/feature/quiz/CountdownTimer', () => ({ expireAt, onExpire }) => (
  <div data-testid="mock-timer" onClick={onExpire}>Mock Timer {expireAt}</div>
));
jest.mock('../../components/feature/quiz/QuestionNavigator', () => ({ totalQuestions, onNavigate }) => (
  <div data-testid="mock-navigator" onClick={() => onNavigate(1)}>Mock Navigator ({totalQuestions} qs)</div>
));
jest.mock('../../components/feature/quiz/QuestionRenderer', () => ({ question, onAnswer }) => (
  <div data-testid="mock-renderer">
    Mock Renderer Q{question.id}
    <button onClick={() => onAnswer(question.id, 'answer value')} data-testid="mock-answer-btn">Answer</button>
  </div>
));
jest.mock('../../components/feature/quiz/ProgressBar', () => ({ percent }) => (
  <div data-testid="mock-progress">Progress {percent}%</div>
));

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ attemptId: '100' }),
  useNavigate: () => mockNavigate,
}), { virtual: true });

jest.mock('axios');

describe('TestSessionPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAttempt = { id: 100, testId: 1, startTime: '2026-06-11T00:00:00Z', status: 'in-progress' };
  const mockTest = { id: 1, durationMinutes: 60 };
  const mockQuestions = [
    { id: 10, type: 'multiple-choice' },
    { id: 11, type: 'true-false-not-given' },
  ];

  const setupAxiosMocks = () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/attempts/')) return Promise.resolve({ data: mockAttempt });
      if (url.includes('/tests/')) return Promise.resolve({ data: mockTest });
      if (url.includes('/questions?')) return Promise.resolve({ data: mockQuestions });
      return Promise.reject(new Error('not found'));
    });
  };

  it('renders correctly after fetching data', async () => {
    setupAxiosMocks();
    render(<TestSessionPage />);

    expect(screen.getByTestId('session-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('session-page')).toBeInTheDocument();
    });

    expect(screen.getByTestId('mock-timer')).toBeInTheDocument();
    expect(screen.getByTestId('mock-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('mock-progress')).toBeInTheDocument();
    // Question number is shown as a badge "1"
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
  });

  it('handles navigation between questions', async () => {
    setupAxiosMocks();
    render(<TestSessionPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('session-page')).toBeInTheDocument();
    });

    // Initially on question 1, prev should be disabled
    expect(screen.getByTestId('prev-btn')).toBeDisabled();

    // Click Next — moves to Q2, prev becomes enabled
    fireEvent.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('prev-btn')).not.toBeDisabled();
    expect(screen.getByTestId('next-btn')).toBeDisabled();

    // Click Prev — back to Q1
    fireEvent.click(screen.getByTestId('prev-btn'));
    expect(screen.getByTestId('prev-btn')).toBeDisabled();
  });

  // EARS[Event]: Auto submit on timer expire
  it('automatically submits when timer expires', async () => {
    setupAxiosMocks();
    axios.patch.mockResolvedValueOnce({ data: { success: true } });
    
    render(<TestSessionPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-timer')).toBeInTheDocument();
    });

    // Simulate timer expiration by clicking the mock timer
    fireEvent.click(screen.getByTestId('mock-timer'));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith('http://localhost:9999/attempts/100', expect.objectContaining({
        status: 'completed'
      }));
      expect(mockNavigate).toHaveBeenCalledWith('/learning/tests/review/100');
    });
  });

  // EARS[Unwanted]: API error
  it('displays error when data fetching fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(<TestSessionPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('session-error')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Lỗi khi tải dữ liệu bài thi.')).toBeInTheDocument();
  });
});
