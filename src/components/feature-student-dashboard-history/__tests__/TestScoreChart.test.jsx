/**
 * Traceability Matrix:
 * - Requirement: DASH-03 (View a line chart of test scores over time).
 * - Requirement: DASH_EMPTY_001 (Fallback empty state when no test data exists).
 * - Component: TestScoreChart (feature-student-dashboard-history)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TestScoreChart from '../TestScoreChart';

// Mock ResponsiveContainer của Recharts.
// Vì JSDOM (môi trường test mặc định) không có real layout engine,
// kích thước khung trả về sẽ là 0x0 khiến ResponsiveContainer không render component con.
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="mock-responsive-container" style={{ width: '100%', height: '300px' }}>
        {children}
      </div>
    ),
  };
});

describe('TestScoreChart Component', () => {
  
  // ==========================================
  // HAPPY PATH TESTS
  // ==========================================

  it('renders title and the chart when data is provided (Happy Path)', () => {
    const mockData = [
      { date: '01/06', score: 5.5 },
      { date: '10/06', score: 6.5 }
    ];
    
    // EARS[Event]: WHEN the Student has at least one test attempt, THE system SHALL render a Line Chart.
    render(<TestScoreChart data={mockData} />);
    
    // Kiểm tra render text tiêu đề
    expect(screen.getByText('Test Score Trend')).toBeInTheDocument();
    
    // Kiểm tra component ResponsiveContainer chứa chart đã được render
    expect(screen.getByTestId('mock-responsive-container')).toBeInTheDocument();
    
    // Đảm bảo không render Empty State
    expect(screen.queryByTestId('chart-empty-state')).not.toBeInTheDocument();
  });

  // ==========================================
  // ERROR CASES / BOUNDARY VALUES TESTS
  // ==========================================

  it('renders "No test data yet" empty state when data is an empty array (Error Case)', () => {
    // EARS[Event]: WHEN the Student has no test attempts, THE system SHALL show an empty state.
    render(<TestScoreChart data={[]} />);
    
    expect(screen.getByText('Test Score Trend')).toBeInTheDocument();
    expect(screen.getByTestId('chart-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No test data yet')).toBeInTheDocument();
  });

  it('renders "No test data yet" empty state when data is null (Error Case)', () => {
    render(<TestScoreChart data={null} />);
    
    expect(screen.getByTestId('chart-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No test data yet')).toBeInTheDocument();
  });

  it('renders "No test data yet" empty state when data is undefined (Boundary Value)', () => {
    render(<TestScoreChart data={undefined} />);
    
    expect(screen.getByTestId('chart-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No test data yet')).toBeInTheDocument();
  });
});
