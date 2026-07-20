/**
 * TRACEABILITY MATRIX
 * -----------------------------------------------------------------------------------------
 * Test Case ID | Requirement / EARS Ref | Description
 * -----------------------------------------------------------------------------------------
 * TC_CLP_01    | SPEC §3 CL-01, CL-02   | Render list of courses and pagination (Happy path).
 * TC_CLP_02    | EARS[Event]            | Searching updates params and triggers fetch.
 * TC_CLP_03    | EARS[Event]            | Changing filters resets page to 1 and triggers fetch.
 * TC_CLP_04    | EARS[Unwanted]         | Show error message if API fails.
 * TC_CLP_05    | EARS[State-driven]     | Show empty state if no courses match criteria.
 * -----------------------------------------------------------------------------------------
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseListPage from './CourseListPage';
import { getCourses } from '../../services/courseLearning.service';

// Mock service
vi.mock('../../services/courseLearning.service', () => ({
  getCourses: vi.fn(),
}));

// Mock Component CourseCard để cô lập test
vi.mock('../../components/feature-course-learning/CourseCard', () => {
  return {
    default: ({ course }) => <div data-testid={`course-card-${course.id}`}>{course.title}</div>
  };
});

describe('CourseListPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC_CLP_01
  it('renders list of courses and pagination correctly', async () => {
    const mockData = {
      data: [
        { id: '1', title: 'Course 1' },
        { id: '2', title: 'Course 2' }
      ],
      totalCount: 10 // > 6 limit nên sẽ hiển thị pagination
    };
    getCourses.mockResolvedValueOnce(mockData);

    render(<CourseListPage />);

    // Check loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('course-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('course-card-2')).toBeInTheDocument();
    });

    // Pagination render nút Next
    expect(screen.getByTestId('next-page')).toBeInTheDocument();
    expect(getCourses).toHaveBeenCalledWith({ page: 1, limit: 6, search: '', skill: '', level: '' });
  });

  // TC_CLP_02
  it('triggers search with correct params when form is submitted', async () => {
    getCourses.mockResolvedValue({ data: [], totalCount: 0 });
    render(<CourseListPage />);

    const input = screen.getByTestId('search-input');
    const form = screen.getByTestId('search-form');

    fireEvent.change(input, { target: { value: 'IELTS' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(getCourses).toHaveBeenCalledWith(expect.objectContaining({ search: 'IELTS', page: 1 }));
    });
  });

  // TC_CLP_03
  it('triggers fetch and resets page when skill filter changes', async () => {
    getCourses.mockResolvedValue({ data: [], totalCount: 0 });
    render(<CourseListPage />);

    const skillSelect = screen.getByTestId('skill-filter');
    fireEvent.change(skillSelect, { target: { value: 'Writing' } });

    await waitFor(() => {
      expect(getCourses).toHaveBeenCalledWith(expect.objectContaining({ skill: 'Writing', page: 1 }));
    });
  });

  // TC_CLP_04
  it('shows error alert if API fails', async () => {
    getCourses.mockRejectedValueOnce(new Error('Network Error 500'));
    render(<CourseListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText(/Network Error 500/i)).toBeInTheDocument();
    });
  });

  // TC_CLP_05
  it('shows empty state when no courses are returned', async () => {
    getCourses.mockResolvedValueOnce({ data: [], totalCount: 0 });
    render(<CourseListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No courses found')).toBeInTheDocument();
    });
  });
});
