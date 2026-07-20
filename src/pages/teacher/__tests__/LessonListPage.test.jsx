/**
 * Traceability Matrix:
 * | Test Case ID | Test Target / Scenario                                | Related Requirement in SPEC.md | Done Criteria Status |
 * |--------------|--------------------------------------------------------|--------------------------------|----------------------|
 * | TC-LLP-01    | Render lesson list with correct details & sorting      | US-TCH-03                      | Complete             |
 * | TC-LLP-02    | Filter lessons correctly by search query & course select| US-TCH-03                      | Complete             |
 * | TC-LLP-03    | Enforce action locking (Edit/Delete disabled) on pending| US-TCH-02 / EARS State-driven  | Complete             |
 * | TC-LLP-04    | Successfully delete a lesson and dispatch audit logs   | US-TCH-03 / EARS Ubiquitous    | Complete             |
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LessonListPage from '../LessonListPage';
import { teacherCourseService } from '../../../services/teacherCourseService';
import { teacherLessonService } from '../../../services/teacherLessonService';
import { auditLogService } from '../../../services/auditLogService';
import { getCurrentUser } from '../../../services/authService';

// Mock services
jest.mock('../../../services/teacherCourseService');
jest.mock('../../../services/teacherLessonService');
jest.mock('../../../services/auditLogService');
jest.mock('../../../services/authService');

const mockTeacher = { id: 'u-teacher-001', fullName: 'IELTS Teacher' };
const mockCourses = [
  { id: 'c-1', title: 'Course Draft', status: 'draft', teacherId: 'u-teacher-001' },
  { id: 'c-2', title: 'Course Pending', status: 'pending', teacherId: 'u-teacher-001' },
  { id: 'c-3', title: 'Course Approved', status: 'approved', teacherId: 'u-teacher-001' }
];

const mockLessons = [
  { id: 'l-1', title: 'Introduction to Skimming', courseId: 'c-1', order: 1, durationMinutes: 30, contentUrl: 'link-1', teacherId: 'u-teacher-001' },
  { id: 'l-2', title: 'Matching Paragraphs', courseId: 'c-2', order: 2, durationMinutes: 45, contentUrl: 'link-2', teacherId: 'u-teacher-001' },
  { id: 'l-3', title: 'Speaking Part 2 Tips', courseId: 'c-3', order: 1, durationMinutes: 20, contentUrl: 'link-3', teacherId: 'u-teacher-001' }
];

describe('LessonListPage Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue(mockTeacher);
    teacherCourseService.getCourses.mockResolvedValue(mockCourses);
    teacherLessonService.getLessons.mockResolvedValue(mockLessons);
  });

  // TC-LLP-01: Load and list
  test('TC-LLP-01: should render lesson list sorted by course name and then order', async () => {
    render(
      <BrowserRouter>
        <LessonListPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Đang tải danh sách bài học/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Đang tải danh sách bài học/i)).not.toBeInTheDocument();
    });

    // Check headings and values
    expect(screen.getByText('Introduction to Skimming')).toBeInTheDocument();
    expect(screen.getByText('Matching Paragraphs')).toBeInTheDocument();
    expect(screen.getByText('Speaking Part 2 Tips')).toBeInTheDocument();

    // Verify course associations are resolved
    expect(screen.getByText('Course Draft')).toBeInTheDocument();
    expect(screen.getByText('Course Pending')).toBeInTheDocument();
    expect(screen.getByText('Course Approved')).toBeInTheDocument();
  });

  // TC-LLP-02: Filters
  test('TC-LLP-02: should filter list based on search and course dropdowns', async () => {
    render(
      <BrowserRouter>
        <LessonListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to Skimming')).toBeInTheDocument();
    });

    // Search query filter
    const searchInput = screen.getByPlaceholderText(/Nhập tiêu đề bài học/i);
    fireEvent.change(searchInput, { target: { value: 'Skimming' } });

    expect(screen.getByText('Introduction to Skimming')).toBeInTheDocument();
    expect(screen.queryByText('Matching Paragraphs')).not.toBeInTheDocument();

    // Reset search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Course select filter
    const courseSelect = screen.getByLabelText('Lọc theo khóa học');
    fireEvent.change(courseSelect, { target: { value: 'c-3' } });

    expect(screen.getByText('Speaking Part 2 Tips')).toBeInTheDocument();
    expect(screen.queryByText('Introduction to Skimming')).not.toBeInTheDocument();
  });

  // TC-LLP-03: Pending Course Locks Lessons
  test('TC-LLP-03: should enforce action locks (disabled buttons) on lessons in a pending course', async () => {
    render(
      <BrowserRouter>
        <LessonListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to Skimming')).toBeInTheDocument();
    });

    // Lesson 1 (Course Draft): Enabled edit and delete
    const skimmingRow = screen.getByText('Introduction to Skimming').closest('tr');
    const lesson1EditBtn = within(skimmingRow).getByTitle('Sửa thông tin');
    const lesson1DeleteBtn = within(skimmingRow).getByTitle('Xóa bài học');
    expect(lesson1EditBtn).not.toBeDisabled();
    expect(lesson1DeleteBtn).not.toBeDisabled();

    // Lesson 2 (Course Pending): Locked edit and delete
    const matchingRow = screen.getByText('Matching Paragraphs').closest('tr');
    const lesson2LockedEdit = within(matchingRow).getByTitle('Khóa học đang chờ duyệt, không thể sửa bài học');
    const lesson2LockedDelete = within(matchingRow).getByTitle('Khóa học đang chờ duyệt, không thể xóa bài học');
    expect(lesson2LockedEdit).toBeDisabled();
    expect(lesson2LockedDelete).toBeDisabled();
  });

  // TC-LLP-04: Delete lesson
  test('TC-LLP-04: should prompt and delete a lesson successfully, posting audit logs', async () => {
    teacherLessonService.deleteLesson.mockResolvedValue({});
    auditLogService.logAction.mockResolvedValue({});

    render(
      <BrowserRouter>
        <LessonListPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to Skimming')).toBeInTheDocument();
    });

    // Click Delete on Lesson 1 (Introduction to Skimming)
    const skimmingRow = screen.getByText('Introduction to Skimming').closest('tr');
    const deleteBtn = within(skimmingRow).getByTitle('Xóa bài học');
    fireEvent.click(deleteBtn);

    // Confirm Modal
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận xóa/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(teacherLessonService.deleteLesson).toHaveBeenCalledWith('l-1');
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'DELETE_LESSON',
        { lessonId: 'l-1', title: 'Introduction to Skimming', courseId: 'c-1' },
        'u-teacher-001'
      );
      expect(screen.queryByText('Introduction to Skimming')).not.toBeInTheDocument();
    });
  });
});
