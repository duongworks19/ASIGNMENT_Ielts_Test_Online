/**
 * Traceability Matrix:
 * - ADM-USER-01, ADM-USER-02, ADM-CONTENT-01: Render StatusBadge for different statuses.
 * - Test cases map to handling boundary values and fallback for invalid status.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusBadge from '../../../components/common/StatusBadge';

describe('StatusBadge Component', () => {
  // Happy paths for valid statuses
  const testCases = [
    { status: 'active', expectedClass: 'bg-success' },
    { status: 'approved', expectedClass: 'bg-success' },
    { status: 'pending', expectedClass: 'bg-warning' }, // text-dark is also there but we can check matching substring or just the main class
    { status: 'locked', expectedClass: 'bg-warning' },
    { status: 'banned', expectedClass: 'bg-danger' },
    { status: 'rejected', expectedClass: 'bg-danger' },
  ];

  testCases.forEach(({ status, expectedClass }) => {
    it(`should render correctly for status "${status}" with class "${expectedClass}"`, () => {
      render(<StatusBadge status={status} />);
      const badge = screen.getByText(status);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'rounded-pill', expectedClass, 'text-capitalize');
    });
  });

  // Error case / boundary values
  it('should handle invalid/unknown status (Unwanted pattern)', () => {
    // EARS[Unwanted]: WHERE an invalid status is provided, fallback to a default neutral badge.
    render(<StatusBadge status="invalid_status" />);
    const badge = screen.getByText('invalid_status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge', 'rounded-pill', 'bg-secondary');
  });

  it('should handle null or undefined status', () => {
    render(<StatusBadge status={undefined} />);
    const badge = screen.getByText('unknown');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-secondary');
  });

  it('should append additional className if provided', () => {
    render(<StatusBadge status="active" className="me-2 custom-class" />);
    const badge = screen.getByText('active');
    expect(badge).toHaveClass('me-2', 'custom-class');
  });
});
