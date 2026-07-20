/**
 * Traceability Matrix:
 * - Requirement: DASH-05 (View history list with details).
 * - Requirement: DASH_FILT_001 (Empty state when no data matches).
 * - Component: HistoryTable (feature-student-dashboard-history)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoryTable from '../HistoryTable';

// Mock hook useNavigate của react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('HistoryTable Component', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAttempts = [
    { id: '1', testTitle: 'IELTS Mock Test 1', skill: 'Listening', submittedAt: '2026-06-01T10:00:00Z', overallBandScore: 6.5, timeSpent: 1800 },
    { id: '2', testTitle: 'IELTS Mock Test 2', skill: 'Reading', submittedAt: '2026-06-02T10:00:00Z', overallBandScore: 7.0, timeSpent: 2400 },
    { id: '3', testTitle: 'IELTS Mock Test 3', skill: 'Writing', submittedAt: '2026-06-03T10:00:00Z', overallBandScore: 6.0, timeSpent: 3000 },
    { id: '4', testTitle: 'IELTS Mock Test 4', skill: 'Speaking', submittedAt: '2026-06-04T10:00:00Z', overallBandScore: 6.5, timeSpent: 600 },
    { id: '5', testTitle: 'IELTS Mock Test 5', skill: 'Listening', submittedAt: '2026-06-05T10:00:00Z', overallBandScore: 7.5, timeSpent: 1800 },
    { id: '6', testTitle: 'IELTS Mock Test 6', skill: 'Reading', submittedAt: '2026-06-06T10:00:00Z', overallBandScore: 8.0, timeSpent: 2400 },
  ];

  // ==========================================
  // HAPPY PATH TESTS
  // ==========================================

  it('renders table headers and first page of data (5 items max) (Happy Path)', () => {
    // EARS[Event]: WHEN the Student has test attempts, THE system SHALL display them in a paginated list.
    render(<HistoryTable attempts={mockAttempts} />);
    
    // Check table headers rendered
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Test Name')).toBeInTheDocument();
    expect(screen.getByText('Band Score')).toBeInTheDocument();
    
    // Check data rows (limit to 5 items)
    expect(screen.getByText('IELTS Mock Test 1')).toBeInTheDocument();
    expect(screen.getByText('IELTS Mock Test 5')).toBeInTheDocument();
    
    // Item 6 must NOT be on page 1
    expect(screen.queryByText('IELTS Mock Test 6')).not.toBeInTheDocument();
  });

  it('navigates to attempt detail page when View is clicked (Happy Path)', () => {
    render(<HistoryTable attempts={mockAttempts} />);
    
    const viewBtn = screen.getByTestId('btn-view-1');
    fireEvent.click(viewBtn);
    
    // Expect Router hook triggered with correct URL path
    expect(mockNavigate).toHaveBeenCalledWith('/learning/tests/review/1');
  });

  it('handles pagination correctly when clicking Next (Happy Path)', () => {
    render(<HistoryTable attempts={mockAttempts} />);
    
    // Item 6 not visible initially
    expect(screen.queryByText('IELTS Mock Test 6')).not.toBeInTheDocument();
    
    // Click Next button
    const nextBtn = screen.getByTestId('pagination-next');
    fireEvent.click(nextBtn);
    
    // Item 6 now visible on page 2, Item 1 hidden
    expect(screen.getByText('IELTS Mock Test 6')).toBeInTheDocument();
    expect(screen.queryByText('IELTS Mock Test 1')).not.toBeInTheDocument();
  });

  // ==========================================
  // ERROR CASES / BOUNDARY VALUES TESTS
  // ==========================================

  it('renders empty state when attempts array is empty (Error Case)', () => {
    // EARS[Unwanted]: If no results match, THE system SHALL display an empty state.
    render(<HistoryTable attempts={[]} />);
    
    expect(screen.getByTestId('table-empty-state')).toHaveTextContent('Không tìm thấy kết quả nào');
    expect(screen.queryByText('Test Name')).not.toBeInTheDocument(); // Header ngầm định biến mất
  });

  it('renders empty state when attempts is null (Error Case)', () => {
    render(<HistoryTable attempts={null} />);
    
    expect(screen.getByTestId('table-empty-state')).toHaveTextContent('Không tìm thấy kết quả nào');
  });

  it('renders empty state when attempts is undefined (Boundary Value)', () => {
    render(<HistoryTable attempts={undefined} />);
    
    expect(screen.getByTestId('table-empty-state')).toHaveTextContent('Không tìm thấy kết quả nào');
  });
});
