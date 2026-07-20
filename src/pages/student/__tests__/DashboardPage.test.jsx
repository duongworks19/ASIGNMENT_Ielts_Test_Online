/**
 * Traceability Matrix:
 * - Requirement: DASH-01 (View dashboard overview).
 * - Component: DashboardPage (feature-student-dashboard-history)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '../DashboardPage';
import { useDashboardData } from '../../../hooks/useDashboardData';

// Mock hook và các child component để cô lập test
jest.mock('../../../hooks/useDashboardData');
jest.mock('../../../components/feature-student-dashboard-history/StatCard', () => () => <div data-testid="mock-stat-card" />);
jest.mock('../../../components/feature-student-dashboard-history/TestScoreChart', () => () => <div data-testid="mock-line-chart" />);
jest.mock('../../../components/feature-student-dashboard-history/SkillRadarChart', () => () => <div data-testid="mock-radar-chart" />);

describe('DashboardPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // STATE-DRIVEN TESTS
  // ==========================================

  it('renders loading spinner while fetching data (State-driven)', () => {
    // EARS[State-driven]: WHILE the dashboard data is loading, THE system SHALL display a loading spinner.
    useDashboardData.mockReturnValue({ loading: true, error: null, data: null });
    render(<DashboardPage />);
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
  });

  // ==========================================
  // ERROR CASES / BOUNDARY VALUES TESTS
  // ==========================================

  it('renders error message on fetch failure (Error Case)', () => {
    // EARS[Unwanted]: If the data fetch fails, THE system SHALL display an error message.
    useDashboardData.mockReturnValue({ loading: false, error: 'Failed to fetch', data: null });
    render(<DashboardPage />);
    expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  // ==========================================
  // HAPPY PATH TESTS
  // ==========================================

  it('renders dashboard with 4 stats and 2 charts on success (Happy Path)', () => {
    // EARS[Event]: WHEN the Student navigates to the dashboard, THE system SHALL display metrics.
    const mockData = {
      stats: { completedLessons: 10, completedTests: 5, averageBandScore: 6.5, studyHours: 20 },
      lineChartData: [],
      radarChartData: []
    };
    useDashboardData.mockReturnValue({ loading: false, error: null, data: mockData });
    
    render(<DashboardPage />);
    
    expect(screen.getByText('My Dashboard')).toBeInTheDocument();
    
    // Đảm bảo 4 thẻ StatCard được gọi
    const statCards = screen.getAllByTestId('mock-stat-card');
    expect(statCards).toHaveLength(4);
    
    // Đảm bảo 2 Chart được gọi
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('mock-radar-chart')).toBeInTheDocument();
  });
});
