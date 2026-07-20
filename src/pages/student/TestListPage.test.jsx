/**
 * Traceability Matrix:
 * - Feature: Practice Test & Quiz System
 * - Task: T017 - Page: Test List Page
 * - SPEC Requirement: "Fetch getTests(). Hiển thị danh sách test dạng thẻ (card) Bootstrap. Có nút 'Xem chi tiết'."
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import TestListPage from './TestListPage';

jest.mock('axios');

jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  BrowserRouter: ({ children }) => <div>{children}</div>
}), { virtual: true });

const renderWithRouter = (ui) => {
  return render(ui); // BrowserRouter is mocked, we don't even need to wrap it if we test in isolation, but we can wrap it just in case.
};

describe('TestListPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // EARS[State-driven]: Loading & Happy path
  it('displays loading spinner initially and then renders list of tests', async () => {
    const mockTests = [
      { id: 1, title: 'Test 1', skill: 'Reading', durationMinutes: 60, totalQuestions: 40 },
      { id: 2, title: 'Test 2', skill: 'Listening', durationMinutes: 30, totalQuestions: 40 },
    ];
    axios.get.mockResolvedValueOnce({ data: mockTests });

    renderWithRouter(<TestListPage />);
    
    // Expect loading state first
    expect(screen.getByTestId('testlist-loading')).toBeInTheDocument();

    // Wait for the mock tests to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('testlist-page')).toBeInTheDocument();
    });

    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Thi thử/i })).toHaveLength(2);
  });

  // EARS[Unwanted]: Error Case
  it('displays error message when API call fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    renderWithRouter(<TestListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('testlist-error')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  // EARS[Unwanted]: Empty Case
  it('displays empty state when no tests are found', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    renderWithRouter(<TestListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('testlist-empty')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Hiện không có bài thi nào trong hệ thống.')).toBeInTheDocument();
  });
});
