import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LessonPage from '../LessonPage';
import * as courseLearningService from '../../../services/courseLearning.service';
import { setCurrentUserSnapshot } from '../../../services/authService';

/**
 * TRACEABILITY MATRIX
 * ============================================================================
 * Feature: Lesson Page (Mark Logic) - Task T015
 * 
 * EARS Spec Refs:
 * - CL-08: The system shall allow a student to mark a lesson as completed.
 * - CL-09: Upon completion, the system shall calculate progress % and update enrollment.
 * 
 * Test Cases Map:
 * 1. Happy Path: 
 *    - EARS[Event]: WHEN user clicks Mark as Completed on an incomplete lesson...
 *    - Action: Mock successful API calls.
 *    - Expect: progress calculated, updateEnrollmentProgress called, navigate to next.
 * 
 * 2. Error Case (API Failure):
 *    - EARS[Unwanted]: IF marking fails, show inline error.
 *    - Action: Mock API failure.
 *    - Expect: Error alert is displayed.
 * 
 * 3. Boundary/Edge Case (Last Lesson):
 *    - EARS[Edge]: IF last lesson, show Finish Course instead of Next.
 *    - Action: Render the last lesson.
 *    - Expect: Finish Course button displayed.
 * 
 * 4. Boundary/Edge Case (Already Completed):
 *    - Action: Render an already completed lesson.
 *    - Expect: Completed badge shown instead of Mark Complete button.
 * ============================================================================
 */

import { useNavigate, useParams } from 'react-router-dom';

// Mock the API service
jest.mock('../../../services/courseLearning.service');

const mockNavigate = jest.fn();

describe('LessonPage - Mark Logic (T015)', () => {
  const mockLessons = [
    { id: 'lesson-001', title: 'Lesson 1', order: 1 },
    { id: 'lesson-002', title: 'Lesson 2', order: 2 }
  ];

  const mockEnrollment = {
    id: 'enr-001',
    userId: 'u-001',
    courseId: 'course-001',
    progress: 0,
    status: 'active'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setCurrentUserSnapshot({ id: 'u-001', role: 'student', status: 'active' });
    
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ courseId: 'course-001', lessonId: 'lesson-001' });
    
    // Default successful mocks
    courseLearningService.getLessons.mockResolvedValue(mockLessons);
    courseLearningService.getLessonProgress.mockResolvedValue([]);
    courseLearningService.getEnrollment.mockResolvedValue(mockEnrollment);
    
    courseLearningService.getLessonProgressByLesson.mockResolvedValue(null);
    courseLearningService.createLessonProgress.mockResolvedValue({ id: 'lp-new' });
    courseLearningService.updateEnrollmentProgress.mockResolvedValue({});
  });

  const renderComponent = () => {
    return render(<LessonPage />);
  };

  it('1. [Happy Path] Should mark lesson as completed, update progress, and auto-navigate next', async () => {
    renderComponent();

    // Wait for the mark button to appear (meaning loading is done)
    const markBtn = await screen.findByTestId('btn-mark-complete');
    expect(markBtn).toBeInTheDocument();

    // EARS[Event]: User clicks Mark as Completed
    fireEvent.click(markBtn);

    // Should create progress and update enrollment
    await waitFor(() => {
      expect(courseLearningService.createLessonProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: 'course-001',
          lessonId: 'lesson-001',
          completed: true
        })
      );
      
      // 1 out of 2 lessons completed -> 50%
      expect(courseLearningService.updateEnrollmentProgress).toHaveBeenCalledWith(
        'enr-001',
        50,
        'active'
      );

      // Auto-navigate to next lesson
      expect(mockNavigate).toHaveBeenCalledWith('/learning/courses/course-001/lessons/lesson-002');
    });
  });

  it('2. [Error Case] Should show inline error when API fails during mark as completed', async () => {
    // Force API to fail
    courseLearningService.createLessonProgress.mockRejectedValue(new Error('Network error'));
    
    renderComponent();

    const markBtn = await screen.findByTestId('btn-mark-complete');
    fireEvent.click(markBtn);

    // Check for inline error display
    const errorAlert = await screen.findByTestId('mark-error');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent(/Network error/i);

    // Button should be re-enabled
    expect(markBtn).not.toBeDisabled();
  });

  it('3. [Edge Case] Should show Finish Course button on the last lesson', async () => {
    // Simulate being on the last lesson
    useParams.mockReturnValue({ courseId: 'course-001', lessonId: 'lesson-002' });

    renderComponent();

    // Wait for finish button to appear
    const finishBtn = await screen.findByTestId('btn-finish-course');
    expect(finishBtn).toBeInTheDocument();

    // Next button should not exist
    expect(screen.queryByTestId('btn-next-lesson')).not.toBeInTheDocument();

    // Clicking Finish Course navigates to course list
    fireEvent.click(finishBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/learning/courses');
  });

  it('4. [Edge Case] Should show Completed badge instead of Mark button if already completed', async () => {
    // Mock that lesson-001 is already completed
    courseLearningService.getLessonProgress.mockResolvedValue([
      { id: 'lp-1', lessonId: 'lesson-001', completed: true }
    ]);

    renderComponent();

    // Wait for badge to appear
    const badge = await screen.findByTestId('badge-completed');
    expect(badge).toBeInTheDocument();

    // Mark as completed button should be hidden
    expect(screen.queryByTestId('btn-mark-complete')).not.toBeInTheDocument();
  });
});
