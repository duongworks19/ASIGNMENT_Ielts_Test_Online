/**
 * TRACEABILITY MATRIX
 * -----------------------------------------------------------------------------------------
 * Test Case ID | Requirement / EARS Ref | Description
 * -----------------------------------------------------------------------------------------
 * TC_ECTA_01   | SPEC §3 CL-04          | Render "Join Course" when not enrolled & trigger onEnroll.
 * TC_ECTA_02   | SPEC §3 CL-04          | Render "Continue Learning" when enrolled & trigger onContinue.
 * TC_ECTA_03   | EARS[Unwanted]         | Disable button & show spinner when isLoading is true.
 * TC_ECTA_04   | EARS[Unwanted]         | Ignore clicks while isLoading is true (prevent double submit).
 * TC_ECTA_05   | EARS[Unwanted]         | Render "Course Unavailable" disabled button if courseId is missing.
 * -----------------------------------------------------------------------------------------
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EnrollmentCTA from './EnrollmentCTA';

describe('EnrollmentCTA Component', () => {
  const mockCourseId = 'c-001';

  // TC_ECTA_01
  it('renders "Join Course" when not enrolled and calls onEnroll on click', () => {
    const mockOnEnroll = jest.fn();
    render(
      <EnrollmentCTA 
        courseId={mockCourseId} 
        enrollment={null} 
        onEnroll={mockOnEnroll} 
        isLoading={false} 
      />
    );
    
    const joinBtn = screen.getByTestId('btn-join-course');
    expect(joinBtn).toBeInTheDocument();
    expect(joinBtn).toHaveTextContent(/Join Course/i);
    expect(joinBtn).not.toBeDisabled();

    fireEvent.click(joinBtn);
    expect(mockOnEnroll).toHaveBeenCalledTimes(1);
    expect(mockOnEnroll).toHaveBeenCalledWith(mockCourseId);
  });

  // TC_ECTA_02
  it('renders "Continue Learning" when enrolled and calls onContinue on click', () => {
    const mockOnContinue = jest.fn();
    const mockEnrollment = { id: 'e-001', userId: 'u-001', courseId: mockCourseId };
    
    render(
      <EnrollmentCTA 
        courseId={mockCourseId} 
        enrollment={mockEnrollment} 
        onContinue={mockOnContinue} 
        isLoading={false} 
      />
    );
    
    const continueBtn = screen.getByTestId('btn-continue-learning');
    expect(continueBtn).toBeInTheDocument();
    expect(continueBtn).toHaveTextContent(/Continue Learning/i);
    expect(continueBtn).toHaveClass('btn-success');
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);
    expect(mockOnContinue).toHaveBeenCalledTimes(1);
    expect(mockOnContinue).toHaveBeenCalledWith(mockCourseId);
  });

  // TC_ECTA_03 & TC_ECTA_04
  it('shows spinner, disables button, and ignores clicks when isLoading is true', () => {
    const mockOnEnroll = jest.fn();
    render(
      <EnrollmentCTA 
        courseId={mockCourseId} 
        enrollment={null} 
        onEnroll={mockOnEnroll} 
        isLoading={true} 
      />
    );
    
    const loadingBtn = screen.getByTestId('btn-join-course');
    expect(loadingBtn).toBeInTheDocument();
    expect(loadingBtn).toHaveTextContent(/Processing.../i);
    expect(loadingBtn).toBeDisabled();
    
    // Check for spinner element
    const spinner = loadingBtn.querySelector('.spinner-border');
    expect(spinner).toBeInTheDocument();

    fireEvent.click(loadingBtn);
    expect(mockOnEnroll).not.toHaveBeenCalled();
  });

  // TC_ECTA_05
  it('renders disabled "Course Unavailable" if courseId is missing', () => {
    render(<EnrollmentCTA courseId={null} enrollment={null} />);
    
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('Course Unavailable');
    expect(btn).toBeDisabled();
  });
});
