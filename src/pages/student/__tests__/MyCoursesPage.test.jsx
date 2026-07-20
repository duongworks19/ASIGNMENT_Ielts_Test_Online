import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import MyCoursesPage from '../MyCoursesPage';
import * as courseLearningService from '../../../services/courseLearning.service';

/**
 * TRACEABILITY MATRIX
 * ============================================================================
 * Feature: MyCoursesPage - Task T016
 * 
 * EARS Spec Refs:
 * - CL-05: The system shall allow students to view all courses they are enrolled in.
 * 
 * Test Cases Map:
 * 1. Happy Path: 
 *    - EARS[Event]: WHEN Student opens /learning/courses (my courses view)
 *    - Action: Mock successful API fetch for enrollments and course details.
 *    - Expect: Renders Course Cards with correct progress, badges, and "Continue Learning" button.
 * 
 * 2. Empty State:
 *    - EARS[State-driven]: WHILE course list has no results, show empty state.
 *    - Action: Mock enrollments API returning an empty array [].
 *    - Expect: Renders "No courses yet" empty state message and "Browse Courses" button.
 * 
 * 3. Error Case (API Failure):
 *    - EARS[Unwanted]: IF fetching fails, show recoverable error state.
 *    - Action: Mock API failure.
 *    - Expect: Error alert is displayed.
 * 
 * 4. Navigation:
 *    - EARS[Event]: WHEN Student clicks Continue Learning...
 *    - Action: Click "Continue Learning" button on a course card.
 *    - Expect: Navigation to `/learning/courses/:courseId/lessons`.
 * ============================================================================
 */

// Mock the API service
jest.mock('../../../services/courseLearning.service');

const mockNavigate = jest.fn();

describe('MyCoursesPage (T016)', () => {
  const mockEnrollments = [
    { id: 'enr-1', courseId: 'course-1', progress: 50, status: 'active' },
    { id: 'enr-2', courseId: 'course-2', progress: 100, status: 'completed' },
    { id: 'enr-3', courseId: 'course-3', progress: 0, status: 'active' }
  ];

  const mockCourses = {
    'course-1': { id: 'course-1', title: 'IELTS Reading', skill: 'Reading', level: 'Beginner' },
    'course-2': { id: 'course-2', title: 'IELTS Listening', skill: 'Listening', level: 'Intermediate' },
    'course-3': { id: 'course-3', title: 'IELTS Speaking', skill: 'Speaking', level: 'Advanced' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  const setupSuccessfulMocks = () => {
    courseLearningService.getEnrollmentsByUser.mockResolvedValue(mockEnrollments);
    courseLearningService.getCourseById.mockImplementation((id) => Promise.resolve(mockCourses[id]));
  };

  it('1. [Happy Path] Should render list of enrolled courses with correct progress and badges', async () => {
    setupSuccessfulMocks();
    render(<MyCoursesPage />);

    // Check loading state appears first
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Wait for the course list to appear
    const courseList = await screen.findByTestId('course-list');
    expect(courseList).toBeInTheDocument();

    // Verify exactly 3 courses are rendered
    expect(screen.getByTestId('course-card-course-1')).toBeInTheDocument();
    expect(screen.getByTestId('course-card-course-2')).toBeInTheDocument();
    expect(screen.getByTestId('course-card-course-3')).toBeInTheDocument();

    // Verify Badges logic
    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1); // course-1 (50%)
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1); // course-2 (100%)
    expect(screen.getAllByText('Not Started').length).toBeGreaterThanOrEqual(1); // course-3 (0%)

    // Verify Progress values
    expect(screen.getByTestId('progress-bar-course-1')).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByTestId('progress-bar-course-2')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByTestId('progress-bar-course-3')).toHaveAttribute('aria-valuenow', '0');
  });

  it('2. [Empty State] Should show empty state when no enrollments exist', async () => {
    courseLearningService.getEnrollmentsByUser.mockResolvedValue([]);
    render(<MyCoursesPage />);

    const emptyState = await screen.findByTestId('empty-state');
    expect(emptyState).toBeInTheDocument();
    expect(screen.getByText(/No courses yet/i)).toBeInTheDocument();

    // Verify "Browse Courses" button works
    const browseBtn = screen.getByTestId('btn-browse-courses');
    fireEvent.click(browseBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/learning/courses');
  });

  it('3. [Error Case] Should show error alert when API fetch fails', async () => {
    courseLearningService.getEnrollmentsByUser.mockRejectedValue(new Error('Database unavailable'));
    render(<MyCoursesPage />);

    const errorAlert = await screen.findByTestId('error-alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent(/Database unavailable/i);
    expect(screen.queryByTestId('course-list')).not.toBeInTheDocument();
  });

  it('4. [Navigation] Should navigate to lessons when clicking Continue Learning', async () => {
    setupSuccessfulMocks();
    render(<MyCoursesPage />);

    // Wait for courses to load
    await screen.findByTestId('course-list');

    // Click Continue Learning on the first course
    const continueBtn = screen.getByTestId('btn-continue-course-1');
    fireEvent.click(continueBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/learning/courses/course-1/lessons');
  });
});
