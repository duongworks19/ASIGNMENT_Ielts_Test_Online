/**
 * Traceability Matrix:
 * - Feature: Practice Test & Quiz System
 * - Task: T018 - Page: Test Detail Page
 * - SPEC Requirement: "Lấy chi tiết. Nút 'Start Test' -> Gọi createAttempt(), chuyển hướng sang màn Session kèm ID attempt."
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import TestDetailPage from './TestDetailPage';

// Virtual mock cho react-router-dom để tránh lỗi module resolution trong Jest
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}), { virtual: true });

jest.mock('axios');

describe('TestDetailPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTestDetail = {
    id: 1,
    title: 'Reading Foundation Mock Test',
    skill: 'Reading',
    durationMinutes: 60,
    totalQuestions: 40
  };

  it('displays loading initially then renders test detail', async () => {
    axios.get.mockResolvedValueOnce({ data: mockTestDetail });

    render(<TestDetailPage />);
    
    // Check loading
    expect(screen.getByTestId('detail-loading')).toBeInTheDocument();

    // Wait for content
    await waitFor(() => {
      expect(screen.getByTestId('detail-page')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Reading Foundation Mock Test').length).toBeGreaterThan(0);
    expect(screen.getByText('60 phút')).toBeInTheDocument();
  });

  // EARS[Event]: Start Test flow
  it('calls create attempt API and navigates to session on click', async () => {
    axios.get.mockResolvedValueOnce({ data: mockTestDetail });
    // Mock the attempt creation post
    axios.post.mockResolvedValueOnce({ data: { id: 999, testId: 1 } });

    render(<TestDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('start-test-btn')).toBeInTheDocument();
    });

    const startBtn = screen.getByTestId('start-test-btn');
    fireEvent.click(startBtn);

    // Wait for the async actions to complete
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:9999/attempts', expect.objectContaining({
        testId: 1,
        status: 'in-progress'
      }));
      expect(mockNavigate).toHaveBeenCalledWith('/learning/tests/attempt/999');
    });
  });

  // EARS[Unwanted]: Error Case
  it('displays error message when test not found (404)', async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 404 } });

    render(<TestDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('detail-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Không tìm thấy bài thi/i)).toBeInTheDocument();
  });
});
