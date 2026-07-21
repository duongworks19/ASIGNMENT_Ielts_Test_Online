/**
 * TRACEABILITY MATRIX
 * -----------------------------------------------------------------------------------------
 * Test Case ID | Requirement / EARS Ref | Description
 * -----------------------------------------------------------------------------------------
 * TC_CDP_01    | SPEC §3 CL-03          | Render course details when not enrolled.
 * TC_CDP_02    | SPEC §3 CL-03          | Render course details when already enrolled.
 * TC_CDP_03    | EARS[Event]            | Click Join Course triggers createEnrollment.
 * TC_CDP_04    | EARS[Event]            | Click Continue Learning triggers navigation.
 * TC_CDP_05    | EARS[Unwanted]         | Show error alert if API fails.
 * TC_CDP_06    | EARS[State-driven]     | Show empty state if course is not found.
 * -----------------------------------------------------------------------------------------
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CourseDetailPage from './CourseDetailPage';
import { getCourseById, getEnrollment, createEnrollment } from '../../services/courseLearning.service';
import { setCurrentUserSnapshot } from '../../services/authService';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'c-001' }),
  useNavigate: () => mockNavigate
}));

// Mock services (Task T002 + T003)
jest.mock('../../services/courseLearning.service', () => ({
  getCourseById: jest.fn(),
  getEnrollment: jest.fn(),
  createEnrollment: jest.fn()
}));

// Mock EnrollmentCTA so we don't need its internal testing here
jest.mock('../../components/feature-course-learning/EnrollmentCTA', () => {
  return {
    default: ({ enrollment, onEnroll, onContinue }) => (
      <div>
        {enrollment ? (
          <button data-testid="mock-continue-btn" onClick={onContinue}>Continue Mock</button>
        ) : (
          <button data-testid="mock-join-btn" onClick={onEnroll}>Join Mock</button>
        )}
      </div>
    )
  };
});

describe('CourseDetailPage Component', () => {
  const mockCourse = { id: 'c-001', title: 'Master IELTS', price: 50 };

  beforeEach(() => {
    jest.clearAllMocks();
    setCurrentUserSnapshot({ id: 'u-001', role: 'student', status: 'active' });
  });

  // TC_CDP_01
  it('renders course details and Join Course CTA when not enrolled', async () => {
    getCourseById.mockResolvedValueOnce(mockCourse);
    getEnrollment.mockResolvedValueOnce(null);

    render(<CourseDetailPage />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Master IELTS')).toBeInTheDocument();
      expect(screen.getByText('$50')).toBeInTheDocument();
      expect(screen.getByTestId('mock-join-btn')).toBeInTheDocument();
    });
  });

  // TC_CDP_02
  it('renders course details and Continue Learning CTA when enrolled', async () => {
    getCourseById.mockResolvedValueOnce(mockCourse);
    getEnrollment.mockResolvedValueOnce({ id: 'e-1' });

    render(<CourseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Master IELTS')).toBeInTheDocument();
      expect(screen.getByTestId('mock-continue-btn')).toBeInTheDocument();
    });
  });

  // TC_CDP_03
  it('triggers createEnrollment when Join Course is clicked', async () => {
    getCourseById.mockResolvedValueOnce(mockCourse);
    getEnrollment.mockResolvedValueOnce(null);
    createEnrollment.mockResolvedValueOnce({ id: 'e-2' });

    render(<CourseDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-join-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mock-join-btn'));

    await waitFor(() => {
      expect(createEnrollment).toHaveBeenCalledWith('u-001', 'c-001');
      // UI updates to Continue after successful enrollment
      expect(screen.getByTestId('mock-continue-btn')).toBeInTheDocument();
    });
  });

  // TC_CDP_04
  it('navigates to lessons when Continue Learning is clicked', async () => {
    getCourseById.mockResolvedValueOnce(mockCourse);
    getEnrollment.mockResolvedValueOnce({ id: 'e-1' });

    render(<CourseDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-continue-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mock-continue-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('/learning/courses/c-001/lessons');
  });

  // TC_CDP_05
  it('shows error alert if API fetching fails', async () => {
    getCourseById.mockRejectedValueOnce(new Error('Course API down'));
    
    render(<CourseDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText(/Course API down/i)).toBeInTheDocument();
    });
  });

  // TC_CDP_06
  it('shows empty state if course is not found (null response)', async () => {
    getCourseById.mockResolvedValueOnce(null);
    
    render(<CourseDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Course Not Found')).toBeInTheDocument();
    });
  });
});
