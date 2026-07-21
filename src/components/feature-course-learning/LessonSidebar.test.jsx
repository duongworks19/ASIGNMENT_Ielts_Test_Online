/**
 * TRACEABILITY MATRIX
 * -----------------------------------------------------------------------------------------
 * Test Case ID | Requirement / EARS Ref | Description
 * -----------------------------------------------------------------------------------------
 * TC_LS_01     | SPEC §3 CL-06          | Render all lessons, highlight active lesson.
 * TC_LS_02     | SPEC §3 CL-06          | Render checkmark for completed lessons.
 * TC_LS_03     | SPEC §3 CL-06          | Call onSelectLesson when clicking a lesson (no blocking).
 * TC_LS_04     | EARS[Unwanted]         | Render safe empty state when lessons array is empty.
 * TC_LS_05     | EARS[Unwanted]         | Render safe empty state when lessons is null/undefined.
 * -----------------------------------------------------------------------------------------
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LessonSidebar from './LessonSidebar';

const mockLessons = [
  { id: 'l-001', title: 'Introduction to IELTS', duration: '10:00' },
  { id: 'l-002', title: 'Writing Task 1 Overview', duration: '15:30' },
  { id: 'l-003', title: 'Writing Task 2 Overview', duration: '20:00' },
];

describe('LessonSidebar Component', () => {

  // TC_LS_01 & TC_LS_02
  it('renders lessons correctly, highlights active lesson, and shows checkmarks', () => {
    const mockOnSelect = jest.fn();
    render(
      <LessonSidebar 
        lessons={mockLessons} 
        currentLessonId="l-002" 
        completedLessonIds={['l-001']} 
        onSelectLesson={mockOnSelect} 
      />
    );
    
    // Header tracking
    expect(screen.getByText('1 / 3 completed')).toBeInTheDocument();

    // Check rendering titles
    expect(screen.getByText('1. Introduction to IELTS')).toBeInTheDocument();
    expect(screen.getByText('2. Writing Task 1 Overview')).toBeInTheDocument();
    expect(screen.getByText('3. Writing Task 2 Overview')).toBeInTheDocument();

    // Check active class on current lesson
    const activeItem = screen.getByTestId('lesson-item-l-002');
    expect(activeItem).toHaveClass('active');
    
    // Check non-active class on others
    expect(screen.getByTestId('lesson-item-l-001')).not.toHaveClass('active');

    // Check completion mark (TC_LS_02)
    expect(screen.getByTestId('check-l-001')).toBeInTheDocument();
    expect(screen.queryByTestId('check-l-002')).not.toBeInTheDocument(); // not completed
  });

  // TC_LS_03
  it('calls onSelectLesson when a lesson is clicked', () => {
    const mockOnSelect = jest.fn();
    render(
      <LessonSidebar 
        lessons={mockLessons} 
        currentLessonId="l-001" 
        completedLessonIds={[]} 
        onSelectLesson={mockOnSelect} 
      />
    );
    
    const secondLesson = screen.getByTestId('lesson-item-l-002');
    fireEvent.click(secondLesson);
    
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith('l-002');
  });

  // TC_LS_04
  it('renders empty state when lessons array is empty', () => {
    render(<LessonSidebar lessons={[]} />);
    expect(screen.getByText('No lessons available for this course yet.')).toBeInTheDocument();
  });

  // TC_LS_05
  it('renders empty state without crashing when lessons is null', () => {
    render(<LessonSidebar lessons={null} />);
    expect(screen.getByText('No lessons available for this course yet.')).toBeInTheDocument();
  });
});
