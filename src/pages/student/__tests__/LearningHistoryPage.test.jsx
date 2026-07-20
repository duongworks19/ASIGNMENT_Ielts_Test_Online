/**
 * Traceability Matrix:
 * - Requirement: DASH-05 (View history list with details).
 * - Component: LearningHistoryPage (feature-student-dashboard-history)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import LearningHistoryPage from '../LearningHistoryPage';

// Mock các dependencies để cô lập test (chỉ test container)
jest.mock('axios');
jest.mock('../../../components/feature-student-dashboard-history/HistoryFilter', () => () => <div data-testid="mock-history-filter" />);
jest.mock('../../../components/feature-student-dashboard-history/HistoryTable', () => () => <div data-testid="mock-history-table" />);

describe('LearningHistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // STATE-DRIVEN TESTS
  // ==========================================

  it('renders loading spinner while fetching (State-driven)', async () => {
    // Không resolve ngay lập tức để màn hình kịp render UI loading
    axios.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100)));
    render(<LearningHistoryPage />);
    
    expect(screen.getByTestId('history-loading')).toBeInTheDocument();
  });

  // ==========================================
  // ERROR CASES / BOUNDARY VALUES TESTS
  // ==========================================

  it('renders error message on fetch failure (Error Case)', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));
    render(<LearningHistoryPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('history-error')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Failed to fetch learning history/i)).toBeInTheDocument();
  });

  // ==========================================
  // HAPPY PATH TESTS
  // ==========================================

  it('renders filter and table on successful fetch (Happy Path)', async () => {
    axios.get.mockResolvedValue({ data: [{ id: '1', submittedAt: '2026-06-01T10:00:00Z' }] });
    render(<LearningHistoryPage />);
    
    // Đợi kết thúc quá trình loading (DOM render chữ Learning History)
    await waitFor(() => {
      expect(screen.getByText('Learning History')).toBeInTheDocument();
    });
    
    // Đảm bảo 2 component con được gắn vào UI
    expect(screen.getByTestId('mock-history-filter')).toBeInTheDocument();
    expect(screen.getByTestId('mock-history-table')).toBeInTheDocument();
  });
});
