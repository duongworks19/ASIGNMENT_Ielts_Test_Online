/**
 * Traceability Matrix:
 * - Requirement: DASH-02 (Stat cards for lessons, tests, band score, study hours).
 * - Requirement: DASH_EMPTY_001 (Fallback display when data is missing).
 * - Component: StatCard (feature-student-dashboard-history)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatCard from '../StatCard';

describe('StatCard Component', () => {

  // ==========================================
  // HAPPY PATH TESTS
  // ==========================================
  
  it('renders title and value correctly (Happy Path)', () => {
    // EARS[Event]: WHEN dashboard data is fetched successfully, THE system SHALL display valid metrics.
    render(<StatCard title="Completed Lessons" value={15} />);
    
    expect(screen.getByText('Completed Lessons')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders with an icon if provided', () => {
    const MockIcon = <span data-testid="mock-icon">Icon</span>;
    render(<StatCard title="Total Tests" value={5} icon={MockIcon} />);
    
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  // ==========================================
  // ERROR CASES / BOUNDARY VALUES TESTS
  // ==========================================

  it('renders "N/A" when value is null (Error Case)', () => {
    // EARS[State-driven]: WHILE the Student has no test attempts (value is null), THE stat SHALL show N/A.
    render(<StatCard title="Average Band" value={null} />);
    
    expect(screen.getByText('Average Band')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders "N/A" when value is undefined (Error Case)', () => {
    render(<StatCard title="Study Hours" value={undefined} />);
    
    expect(screen.getByText('Study Hours')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders "N/A" when value is an empty string (Boundary Value)', () => {
    render(<StatCard title="Missing Title" value={''} />);
    
    expect(screen.getByText('Missing Title')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders "0" correctly and does NOT fallback to "N/A" when value is 0 (Boundary Value)', () => {
    // Lưu ý: 0 là falsy value trong JS, dễ bị lỗi hiển thị N/A nếu code dùng (value || 'N/A').
    // EARS[State-driven]: WHILE the Student has no completed lessons, THE stat SHALL show 0.
    render(<StatCard title="Zero Tests" value={0} />);
    
    expect(screen.getByText('Zero Tests')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
