/**
 * TRACEABILITY MATRIX — LessonPage (T014 + T015)
 * ─────────────────────────────────────────────────────────────────────────────
 * Test Case ID | Requirement / EARS Ref          | Description
 * ─────────────────────────────────────────────────────────────────────────────
 * TC_LP_01     | SPEC §3 CL-06, CL-07            | Render layout: Sidebar + Player present
 * TC_LP_02     | EARS[State-driven] (no lessonId)| Auto-navigate to first lesson if lessonId missing
 * TC_LP_03     | EARS[Event] sidebar click        | Click lesson in sidebar → correct navigate
 * TC_LP_04     | EARS[Unwanted] API fail          | Show error-alert if initial fetch fails
 * TC_LP_05     | CL-08, EARS[Event] mark complete | Click Mark as Completed → creates lessonProgress (POST)
 * TC_LP_06     | CL-08, EARS[Event] auto-next     | After mark → auto-navigates to next lesson
 * TC_LP_07     | CL-09, EARS[Edge] last lesson    | Last lesson: Finish Course button shown, no auto-nav
 * TC_LP_08     | EARS[Unwanted] double-click guard| Already-completed lesson: button absent, badge shown
 * TC_LP_09     | EARS[Unwanted] mark API fail     | Mark API error → shows mark-error alert, no navigate
 * TC_LP_10     | CL-09, EARS[Event] prev/next nav | Prev/Next buttons navigate correctly; first disables prev
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonPage from './LessonPage';
import * as service from '../../services/courseLearning.service';
import * as progressUtil from '../../utils/progress.util';

// ── Mock react-router-dom ──────────────────────────────────────────────────
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();

vi.mock('react-router-dom', () => ({
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
}));

// ── Mock service layer ─────────────────────────────────────────────────────
vi.mock('../../services/courseLearning.service', () => ({
  getLessons: vi.fn(),
  getLessonProgress: vi.fn(),
  getEnrollment: vi.fn(),
  updateEnrollmentProgress: vi.fn(),
  getLessonProgressByLesson: vi.fn(),
  createLessonProgress: vi.fn(),
  updateLessonProgress: vi.fn(),
}));

// ── Mock progress util ─────────────────────────────────────────────────────
vi.mock('../../utils/progress.util', () => ({
  calculateProgress: vi.fn(() => 50),
  getNextLesson: vi.fn(),
  getPreviousLesson: vi.fn(),
}));

// ── Mock child components (dumb stubs) ────────────────────────────────────
vi.mock('../../components/feature-course-learning/LessonSidebar', () => ({
  default: ({ lessons, onSelectLesson }) => (
    <div data-testid="mock-sidebar">
      {lessons.map((l) => (
        <button
          key={l.id}
          data-testid={`sidebar-item-${l.id}`}
          onClick={() => onSelectLesson(l.id)}
        >
          {l.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../components/feature-course-learning/LessonContentPlayer', () => ({
  default: ({ lesson }) => (
    <div data-testid="mock-player">{lesson ? lesson.title : 'No Lesson'}</div>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────
const MOCK_LESSONS = [
  { id: 'l-001', title: 'Lesson 1', order: 1 },
  { id: 'l-002', title: 'Lesson 2', order: 2 },
  { id: 'l-003', title: 'Lesson 3', order: 3 },
];

const MOCK_ENROLLMENT = { id: 'enr-001', userId: 'u-001', courseId: 'c-001', progress: 0, status: 'active' };

function setupDefaultMocks(lessonId = 'l-002') {
  mockUseParams.mockReturnValue({ courseId: 'c-001', lessonId });
  service.getLessons.mockResolvedValue(MOCK_LESSONS);
  service.getLessonProgress.mockResolvedValue([]);
  service.getEnrollment.mockResolvedValue(MOCK_ENROLLMENT);
  service.getLessonProgressByLesson.mockResolvedValue(null);
  service.createLessonProgress.mockResolvedValue({ id: 'lp-new' });
  service.updateEnrollmentProgress.mockResolvedValue({ ...MOCK_ENROLLMENT, progress: 50 });
  progressUtil.getNextLesson.mockReturnValue(MOCK_LESSONS[2]); // l-003
  progressUtil.getPreviousLesson.mockReturnValue(MOCK_LESSONS[0]); // l-001
  progressUtil.calculateProgress.mockReturnValue(50);
}

describe('LessonPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC_LP_01 — Happy path: Layout renders
  it('TC_LP_01: renders Sidebar and Player after data loads', async () => {
    setupDefaultMocks();

    render(<LessonPage />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-player')).toBeInTheDocument();
      expect(screen.getByText('Lesson 2')).toBeInTheDocument();
    });
  });

  // TC_LP_02 — Auto-navigate to first lesson if no lessonId
  it('TC_LP_02: auto-navigates to first lesson when lessonId is absent', async () => {
    mockUseParams.mockReturnValue({ courseId: 'c-001', lessonId: undefined });
    service.getLessons.mockResolvedValue(MOCK_LESSONS);
    service.getLessonProgress.mockResolvedValue([]);
    service.getEnrollment.mockResolvedValue(MOCK_ENROLLMENT);

    render(<LessonPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/learning/courses/c-001/lessons/l-001',
        { replace: true }
      );
    });
  });

  // TC_LP_03 — Sidebar item click
  it('TC_LP_03: clicking a sidebar lesson calls navigate with correct URL', async () => {
    setupDefaultMocks();
    render(<LessonPage />);

    await waitFor(() => screen.getByTestId('sidebar-item-l-001'));
    fireEvent.click(screen.getByTestId('sidebar-item-l-001'));

    expect(mockNavigate).toHaveBeenCalledWith('/learning/courses/c-001/lessons/l-001');
  });

  // TC_LP_04 — API failure shows error alert
  it('TC_LP_04: shows error-alert when initial data fetch fails', async () => {
    mockUseParams.mockReturnValue({ courseId: 'c-001', lessonId: 'l-002' });
    service.getLessons.mockRejectedValue(new Error('Network Error'));
    service.getLessonProgress.mockResolvedValue([]);
    service.getEnrollment.mockResolvedValue(null);

    render(<LessonPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
    });
  });

  // TC_LP_05 — Mark as Completed → calls createLessonProgress (POST)
  it('TC_LP_05: clicking Mark as Completed posts a new lessonProgress record', async () => {
    setupDefaultMocks();
    render(<LessonPage />);

    await waitFor(() => screen.getByTestId('btn-mark-complete'));
    fireEvent.click(screen.getByTestId('btn-mark-complete'));

    await waitFor(() => {
      expect(service.getLessonProgressByLesson).toHaveBeenCalledWith('u-001', 'l-002');
      expect(service.createLessonProgress).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u-001', courseId: 'c-001', lessonId: 'l-002', completed: true })
      );
    });
  });

  // TC_LP_06 — After mark → auto-navigate to next lesson
  it('TC_LP_06: after marking complete, navigates to the next lesson', async () => {
    setupDefaultMocks();
    render(<LessonPage />);

    await waitFor(() => screen.getByTestId('btn-mark-complete'));
    fireEvent.click(screen.getByTestId('btn-mark-complete'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/learning/courses/c-001/lessons/l-003');
    });
  });

  // TC_LP_07 — Last lesson shows Finish Course button, no auto-nav
  it('TC_LP_07: shows Finish Course button for the last lesson and does not auto-navigate', async () => {
    mockUseParams.mockReturnValue({ courseId: 'c-001', lessonId: 'l-003' });
    service.getLessons.mockResolvedValue(MOCK_LESSONS);
    service.getLessonProgress.mockResolvedValue([]);
    service.getEnrollment.mockResolvedValue(MOCK_ENROLLMENT);
    service.getLessonProgressByLesson.mockResolvedValue(null);
    service.createLessonProgress.mockResolvedValue({ id: 'lp-new' });
    service.updateEnrollmentProgress.mockResolvedValue({ ...MOCK_ENROLLMENT, progress: 100, status: 'completed' });
    progressUtil.getNextLesson.mockReturnValue(null); // last lesson
    progressUtil.getPreviousLesson.mockReturnValue(MOCK_LESSONS[1]);
    progressUtil.calculateProgress.mockReturnValue(100);

    render(<LessonPage />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-finish-course')).toBeInTheDocument();
      expect(screen.queryByTestId('btn-next-lesson')).not.toBeInTheDocument();
    });

    // Mark and confirm no next-navigate
    fireEvent.click(screen.getByTestId('btn-mark-complete'));
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.stringContaining('/lessons/')
      );
    });
  });

  // TC_LP_08 — Already-completed lesson: shows badge, hides button
  it('TC_LP_08: shows Completed badge and hides Mark button for already-completed lesson', async () => {
    mockUseParams.mockReturnValue({ courseId: 'c-001', lessonId: 'l-001' });
    service.getLessons.mockResolvedValue(MOCK_LESSONS);
    // l-001 is already completed
    service.getLessonProgress.mockResolvedValue([
      { lessonId: 'l-001', completed: true, completedAt: '2026-06-10T00:00:00Z' },
    ]);
    service.getEnrollment.mockResolvedValue({ ...MOCK_ENROLLMENT, progress: 33 });
    progressUtil.getNextLesson.mockReturnValue(MOCK_LESSONS[1]);
    progressUtil.getPreviousLesson.mockReturnValue(null);

    render(<LessonPage />);

    await waitFor(() => {
      expect(screen.getByTestId('badge-completed')).toBeInTheDocument();
      expect(screen.queryByTestId('btn-mark-complete')).not.toBeInTheDocument();
    });
  });

  // TC_LP_09 — Mark API error shows inline error
  it('TC_LP_09: shows mark-error alert when the mark API call fails', async () => {
    setupDefaultMocks();
    service.createLessonProgress.mockRejectedValue(new Error('CL_PROGRESS_001'));

    render(<LessonPage />);

    await waitFor(() => screen.getByTestId('btn-mark-complete'));
    fireEvent.click(screen.getByTestId('btn-mark-complete'));

    await waitFor(() => {
      expect(screen.getByTestId('mark-error')).toBeInTheDocument();
      expect(screen.getByText(/CL_PROGRESS_001/i)).toBeInTheDocument();
    });
    // Navigate should NOT have been called
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/lessons/'));
  });

  // TC_LP_10 — Prev/Next buttons
  it('TC_LP_10: Prev button disabled on first lesson; Next navigates correctly', async () => {
    mockUseParams.mockReturnValue({ courseId: 'c-001', lessonId: 'l-001' });
    service.getLessons.mockResolvedValue(MOCK_LESSONS);
    service.getLessonProgress.mockResolvedValue([]);
    service.getEnrollment.mockResolvedValue(MOCK_ENROLLMENT);
    progressUtil.getPreviousLesson.mockReturnValue(null); // first lesson
    progressUtil.getNextLesson.mockReturnValue(MOCK_LESSONS[1]);

    render(<LessonPage />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-prev-lesson')).toBeDisabled();
      expect(screen.getByTestId('btn-next-lesson')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('btn-next-lesson'));
    expect(mockNavigate).toHaveBeenCalledWith('/learning/courses/c-001/lessons/l-002');
  });
});
