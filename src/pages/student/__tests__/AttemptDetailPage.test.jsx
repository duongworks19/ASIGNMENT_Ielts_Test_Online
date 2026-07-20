/**
 * Traceability Matrix:
 * - Requirement: DASH-07 (Review past test results and view details).
 * - Component: AttemptDetailPage (feature-student-dashboard-history)
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AttemptDetailPage from '../AttemptDetailPage';

// Mock Dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ attemptId: '123' }), // Mock ID truyền từ Route vào
  useNavigate: () => mockNavigate,
}));

jest.mock('axios');

describe('AttemptDetailPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // STATE-DRIVEN TESTS
  // ==========================================

  it('renders loading spinner initially (State-driven)', async () => {
    // EARS[State-driven]: WHILE data is loading, THE system SHALL display a spinner.
    axios.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100)));
    render(<AttemptDetailPage />);
    
    expect(screen.getByTestId('attempt-loading')).toBeInTheDocument();
  });

  // ==========================================
  // ERROR CASES / BOUNDARY VALUES TESTS
  // ==========================================

  it('renders error state and back button when fetch fails (Error Case)', async () => {
    // EARS[Unwanted]: If the attempt does not exist or fetch fails, THE system SHALL display a Not Found error.
    axios.get.mockRejectedValue(new Error('Not Found'));
    render(<AttemptDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('attempt-error')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Attempt not found/i)).toBeInTheDocument();
    
    // Test logic nút quay lại trong màn hình lỗi
    const errBackBtn = screen.getByTestId('btn-error-back');
    fireEvent.click(errBackBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/learning/history');
  });

  // ==========================================
  // HAPPY PATH TESTS
  // ==========================================

  it('renders attempt details on successful fetch (Happy Path)', async () => {
    // EARS[Event]: WHEN the Student selects a past test attempt, THE system SHALL display its detailed results.
    const mockAttempt = {
      id: '123',
      testId: 'test-99',
      testTitle: 'IELTS Mastery Mock Test',
      skill: 'Reading',
      submittedAt: '2026-06-11T10:00:00Z',
      overallBandScore: 8.5,
      timeSpent: 3600 // 60 phút
    };
    
    axios.get.mockResolvedValue({ data: mockAttempt });
    render(<AttemptDetailPage />);
    
    // Đợi UI render xong data thực
    await waitFor(() => {
      expect(screen.getByText('IELTS Mastery Mock Test')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
  });

  it('navigates to history when normal Back button is clicked (Happy Path)', async () => {
    axios.get.mockResolvedValue({ data: { id: '123', testTitle: 'Test' } });
    render(<AttemptDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('btn-back')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTestId('btn-back'));
    expect(mockNavigate).toHaveBeenCalledWith('/learning/history');
  });

  it('navigates to review mode when Enter Review Mode is clicked (Happy Path)', async () => {
    axios.get.mockResolvedValue({ data: { id: '123', testId: 'test-99', testTitle: 'Test' } });
    render(<AttemptDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('btn-review')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTestId('btn-review'));
    // Redirect qua router review lesson kèm đúng testId
    expect(mockNavigate).toHaveBeenCalledWith('/learning/lessons/test-99');
  });
});
