/**
 * Traceability Matrix:
 * - Requirement: DASH-04 (View a radar chart of Listening, Reading, Writing, Speaking).
 * - Requirement: DASH_EMPTY_001 (Fallback empty state when no data exists).
 * - Component: SkillRadarChart (feature-student-dashboard-history)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillRadarChart from '../SkillRadarChart';

// Mock ResponsiveContainer của Recharts
// JSDOM không tính được layout size thật (mặc định width=0, height=0).
// Mock này giả lập khung để component RadarChart con có thể render được trên test enviroment.
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

describe('SkillRadarChart Component', () => {
  
  // ==========================================
  // HAPPY PATH TESTS
  // ==========================================

  it('renders title and the chart when data is provided (Happy Path)', () => {
    const mockData = [
      { skill: 'Listening', score: 6.5 },
      { skill: 'Reading', score: 7.0 },
      { skill: 'Writing', score: 6.0 },
      { skill: 'Speaking', score: 6.5 },
    ];
    
    // EARS[Event]: WHEN the Student has test attempts grouped by IELTS skill, THE system SHALL render a Radar Chart.
    render(<SkillRadarChart data={mockData} />);
    
    // Title card luôn xuất hiện
    expect(screen.getByText('Skill Balance')).toBeInTheDocument();
    
    // Container đồ thị hiển thị
    expect(screen.getByTestId('mock-responsive-container')).toBeInTheDocument();
    
    // Text Empty không hiển thị
    expect(screen.queryByTestId('chart-empty-state')).not.toBeInTheDocument();
  });

  // ==========================================
  // ERROR CASES / BOUNDARY VALUES TESTS
  // ==========================================

  it('renders "No skill data yet" empty state when data is an empty array (Error Case)', () => {
    // EARS[Event]: WHEN the Student has no test attempts, THE system SHALL show an empty state.
    render(<SkillRadarChart data={[]} />);
    
    expect(screen.getByText('Skill Balance')).toBeInTheDocument();
    expect(screen.getByTestId('chart-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No skill data yet')).toBeInTheDocument();
  });

  it('renders "No skill data yet" empty state when data is null (Error Case)', () => {
    render(<SkillRadarChart data={null} />);
    
    expect(screen.getByTestId('chart-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No skill data yet')).toBeInTheDocument();
  });

  it('renders "No skill data yet" empty state when data is undefined (Boundary Value)', () => {
    render(<SkillRadarChart data={undefined} />);
    
    expect(screen.getByTestId('chart-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No skill data yet')).toBeInTheDocument();
  });
});
