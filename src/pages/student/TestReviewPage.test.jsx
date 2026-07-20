import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TestReviewPage from './TestReviewPage';
import api from '../../services/api';
import { testService } from '../../services/testService';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('../../services/testService', () => ({
  testService: {
    getTestById: jest.fn(),
    getQuestionsForTest: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  useParams: () => ({ attemptId: '200' }),
  useLocation: () => ({ pathname: '/learning/tests/review/200' }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}), { virtual: true });

describe('TestReviewPage Component', () => {
  const mockAttempt = {
    id: '200',
    testId: 'test-001',
    status: 'completed',
    startTime: '2026-06-23T08:00:00Z',
    completedAt: '2026-06-23T08:10:00Z',
    answers: {
      'q-001': 'Correct Answer',
      'q-002': 'Wrong Answer',
    },
  };

  const mockTest = {
    id: 'test-001',
    title: 'Review Mock Test',
    skill: 'Reading',
    durationMinutes: 60,
    totalQuestions: 2,
    status: 'published',
  };

  const mockQuestions = [
    {
      id: 'q-001',
      testId: 'test-001',
      skill: 'Reading',
      type: 'multiple-choice',
      prompt: 'Choose the correct answer.',
      options: ['Correct Answer', 'Another Answer'],
      answer: 'Correct Answer',
    },
    {
      id: 'q-002',
      testId: 'test-001',
      skill: 'Reading',
      type: 'true-false-not-given',
      prompt: 'The statement is true.',
      options: ['True', 'False', 'Not Given'],
      answer: 'True',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: mockAttempt });
    testService.getTestById.mockResolvedValue(mockTest);
    testService.getQuestionsForTest.mockResolvedValue(mockQuestions);
  });

  it('renders score summary correctly and displays reviewed questions', async () => {
    render(<TestReviewPage />);

    expect(screen.getByTestId('review-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('review-page')).toBeInTheDocument();
    });

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByTestId('review-question-q-001')).toBeInTheDocument();
    expect(screen.getByTestId('review-question-q-002')).toBeInTheDocument();
    expect(screen.getAllByText('Correct').length).toBeGreaterThan(0);
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
  });

  it('displays error when data fetching fails', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));

    render(<TestReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId('review-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Không thể tải kết quả bài làm.')).toBeInTheDocument();
  });
});
