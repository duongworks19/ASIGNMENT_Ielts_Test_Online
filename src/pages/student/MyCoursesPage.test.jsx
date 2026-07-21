/**
 * TRACEABILITY MATRIX — MyCoursesPage (T016)
 * ─────────────────────────────────────────────────────────────────────────────────
 * Test Case ID | Requirement / EARS Ref                   | Description
 * ─────────────────────────────────────────────────────────────────────────────────
 * TC_MC_01     | SPEC §3 CL-05, EARS[Event]               | Happy path: renders enrolled course cards
 * TC_MC_02     | EARS[State-driven] empty enrollments     | Empty state shown when no enrollments
 * TC_MC_03     | EARS[Unwanted] API error                 | Error alert shown when fetch fails
 * TC_MC_04     | EARS[Event] Continue Learning click      | Navigate to correct lesson URL
 * TC_MC_05     | EARS[State-driven] progress display      | Progress bar reflects enrollment.progress %
 * TC_MC_06     | EARS[State-driven] completed course      | Status badge = Completed, button = Review Course
 * TC_MC_07     | EARS[Unwanted] partial course load fail  | Page shows rest of courses even if one fails
 * TC_MC_08     | Empty state button navigates to catalog  | Browse Courses button navigates correctly
 * ─────────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyCoursesPage from './MyCoursesPage';
import * as service from '../../services/courseLearning.service';
import { setCurrentUserSnapshot } from '../../services/authService';

// ── Mock react-router-dom ──────────────────────────────────────────────────
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// ── Mock service ───────────────────────────────────────────────────────────
jest.mock('../../services/courseLearning.service', () => ({
  getEnrollmentsByUser: jest.fn(),
  getCourseById: jest.fn(),
}));

// ── Test Data ──────────────────────────────────────────────────────────────
const MOCK_ENROLLMENTS = [
  { id: 'enr-001', userId: 'u-001', courseId: 'course-001', progress: 50, status: 'active' },
  { id: 'enr-002', userId: 'u-001', courseId: 'course-002', progress: 100, status: 'completed' },
];

const MOCK_COURSES = {
  'course-001': {
    id: 'course-001',
    title: 'IELTS Listening Mastery',
    skill: 'Listening',
    level: 'Intermediate',
    thumbnail: null,
    teacherName: 'John Smith',
  },
  'course-002': {
    id: 'course-002',
    title: 'Advanced Reading Techniques',
    skill: 'Reading',
    level: 'Advanced',
    thumbnail: null,
    teacherName: 'Jane Doe',
  },
};

describe('MyCoursesPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setCurrentUserSnapshot({ id: 'u-001', role: 'student', status: 'active' });
  });

  // TC_MC_01 — Happy path: render enrolled courses
  it('TC_MC_01: renders enrolled course cards after data loads', async () => {
    service.getEnrollmentsByUser.mockResolvedValue(MOCK_ENROLLMENTS);
    service.getCourseById
      .mockResolvedValueOnce(MOCK_COURSES['course-001'])
      .mockResolvedValueOnce(MOCK_COURSES['course-002']);

    render(<MyCoursesPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('course-list')).toBeInTheDocument();
      expect(screen.getByTestId('course-card-course-001')).toBeInTheDocument();
      expect(screen.getByTestId('course-card-course-002')).toBeInTheDocument();
      expect(screen.getByText('IELTS Listening Mastery')).toBeInTheDocument();
      expect(screen.getByText('Advanced Reading Techniques')).toBeInTheDocument();
    });
  });

  // TC_MC_02 — Empty state when no enrollments
  it('TC_MC_02: shows empty state when user has no enrollments', async () => {
    service.getEnrollmentsByUser.mockResolvedValue([]);

    render(<MyCoursesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText(/No courses yet/i)).toBeInTheDocument();
    });
  });

  // TC_MC_03 — Error state when API fails
  it('TC_MC_03: shows error alert when enrollment fetch fails', async () => {
    service.getEnrollmentsByUser.mockRejectedValue(new Error('Network Error'));

    render(<MyCoursesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
    });
  });

  // TC_MC_04 — Continue Learning navigate
  it('TC_MC_04: clicking Continue Learning navigates to correct lesson URL', async () => {
    service.getEnrollmentsByUser.mockResolvedValue([MOCK_ENROLLMENTS[0]]);
    service.getCourseById.mockResolvedValue(MOCK_COURSES['course-001']);

    render(<MyCoursesPage />);

    await waitFor(() => screen.getByTestId('btn-continue-course-001'));
    fireEvent.click(screen.getByTestId('btn-continue-course-001'));

    expect(mockNavigate).toHaveBeenCalledWith('/learning/courses/course-001/lessons');
  });

  // TC_MC_05 — Progress bar reflects enrollment.progress
  it('TC_MC_05: progress bar and percentage match enrollment.progress', async () => {
    service.getEnrollmentsByUser.mockResolvedValue([MOCK_ENROLLMENTS[0]]); // progress: 50
    service.getCourseById.mockResolvedValue(MOCK_COURSES['course-001']);

    render(<MyCoursesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('progress-course-001')).toHaveTextContent('50%');
      const bar = screen.getByTestId('progress-bar-course-001');
      expect(bar).toHaveStyle({ width: '50%' });
    });
  });

  // TC_MC_06 — Completed course: badge + Review button
  it('TC_MC_06: completed course shows Completed badge and Review Course button', async () => {
    service.getEnrollmentsByUser.mockResolvedValue([MOCK_ENROLLMENTS[1]]); // status: completed, progress: 100
    service.getCourseById.mockResolvedValue(MOCK_COURSES['course-002']);

    render(<MyCoursesPage />);

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByTestId('progress-course-002')).toHaveTextContent('100%');
      expect(screen.getByTestId('btn-continue-course-002')).toHaveTextContent(/Review Course/i);
    });
  });

  // TC_MC_07 — Partial load: one course fails, rest still shows
  it('TC_MC_07: renders remaining courses even if one getCourseById fails', async () => {
    service.getEnrollmentsByUser.mockResolvedValue(MOCK_ENROLLMENTS);
    service.getCourseById
      .mockResolvedValueOnce(MOCK_COURSES['course-001'])
      .mockRejectedValueOnce(new Error('Course not found'));

    render(<MyCoursesPage />);

    await waitFor(() => {
      // Only course-001 should appear; course-002 should be skipped gracefully
      expect(screen.getByTestId('course-card-course-001')).toBeInTheDocument();
      expect(screen.queryByTestId('course-card-course-002')).not.toBeInTheDocument();
      // Page should NOT show error alert — it's a partial failure
      expect(screen.queryByTestId('error-alert')).not.toBeInTheDocument();
    });
  });

  // TC_MC_08 — Browse Courses button from empty state
  it('TC_MC_08: Browse Courses button in empty state navigates to catalog', async () => {
    service.getEnrollmentsByUser.mockResolvedValue([]);

    render(<MyCoursesPage />);

    await waitFor(() => screen.getByTestId('btn-browse-courses'));
    fireEvent.click(screen.getByTestId('btn-browse-courses'));

    expect(mockNavigate).toHaveBeenCalledWith('/learning/courses');
  });
});
