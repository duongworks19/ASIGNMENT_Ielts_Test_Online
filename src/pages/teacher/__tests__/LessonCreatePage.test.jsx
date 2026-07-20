/**
 * Traceability Matrix:
 * | Test Case ID | Test Target / Scenario                                | Related Requirement in SPEC.md | Done Criteria Status |
 * |--------------|--------------------------------------------------------|--------------------------------|----------------------|
 * | TC-LCP-01    | LessonCreatePage validation checks for form inputs     | US-TCH-03                      | Complete             |
 * | TC-LCP-02    | LessonCreatePage successfully creates a lesson & logs  | US-TCH-03 / EARS Ubiquitous    | Complete             |
 * | TC-LCP-03    | Creating lesson in approved course reverts course to pending| US-TCH-02 / EARS Event-driven  | Complete             |
 * | TC-LCP-04    | LessonCreatePage locks form inputs if course is pending| US-TCH-02 / EARS State-driven  | Complete             |
 * | TC-LCP-05    | LessonCreatePage blocks access for other teacher's lesson| US-TCH-03 / EARS Unwanted      | Complete             |
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LessonCreatePage from '../LessonCreatePage';
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
  { id: 'c-approved', title: 'Course Approved', status: 'approved', teacherId: 'u-teacher-001' },
  { id: 'c-pending', title: 'Course Pending', status: 'pending', teacherId: 'u-teacher-001' }
];

describe('LessonCreatePage Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue(mockTeacher);
    teacherCourseService.getCourses.mockResolvedValue(mockCourses);
  });

  // TC-LCP-01: Validation Checks
  test('TC-LCP-01: should display validation errors for empty fields', async () => {
    render(
      <MemoryRouter>
        <LessonCreatePage />
      </MemoryRouter>
    );

    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('Course Draft (draft)')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Lưu bài học/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Vui lòng chọn khóa học')).toBeInTheDocument();
    expect(await screen.findByText('Tiêu đề bài học phải có ít nhất 5 ký tự')).toBeInTheDocument();
    expect(await screen.findByText('Vui lòng nhập link nội dung bài học hoặc mô tả')).toBeInTheDocument();
  });

  // TC-LCP-02: Create Lesson Happy Path & Audit Logs
  test('TC-LCP-02: should successfully create a new lesson and log the action', async () => {
    teacherLessonService.createLesson.mockResolvedValue({ id: 'l-new', title: 'New Listening Lesson' });
    auditLogService.logAction.mockResolvedValue({});

    render(
      <MemoryRouter>
        <LessonCreatePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Course Draft (draft)')).toBeInTheDocument();
    });

    // Fill the fields
    fireEvent.change(screen.getByLabelText(/Lựa chọn khóa học/i), { target: { value: 'c-1' } });
    fireEvent.change(screen.getByLabelText(/Tiêu đề bài giảng/i), { target: { value: 'New Listening Lesson' } });
    fireEvent.change(screen.getByLabelText(/Số thứ tự bài giảng/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Thời lượng học/i), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText(/Đường dẫn nội dung/i), { target: { value: 'http://example.com/content' } });
    fireEvent.change(screen.getByLabelText(/Đường dẫn tệp âm thanh/i), { target: { value: 'http://example.com/audio.mp3' } });

    const submitBtn = screen.getByRole('button', { name: /Lưu bài học/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(teacherLessonService.createLesson).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: 'c-1',
          title: 'New Listening Lesson',
          order: 3,
          durationMinutes: 45,
          contentUrl: 'http://example.com/content',
          audioUrl: 'http://example.com/audio.mp3',
          teacherId: 'u-teacher-001'
        })
      );
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'CREATE_LESSON',
        { lessonId: 'l-new', title: 'New Listening Lesson', courseId: 'c-1' },
        'u-teacher-001'
      );
    });
  });

  // TC-LCP-03: Create Lesson in Approved Course reverts Course to Pending
  test('TC-LCP-03: should automatically revert course status to pending when creating a lesson inside an approved course', async () => {
    teacherLessonService.createLesson.mockResolvedValue({ id: 'l-new-2', title: 'Reverting Lesson' });
    teacherCourseService.updateCourse.mockResolvedValue({});
    auditLogService.logAction.mockResolvedValue({});

    render(
      <MemoryRouter>
        <LessonCreatePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Course Approved (approved)')).toBeInTheDocument();
    });

    // Fill course select with approved course
    fireEvent.change(screen.getByLabelText(/Lựa chọn khóa học/i), { target: { value: 'c-approved' } });
    
    // Check info alert is shown when approved course is selected
    expect(await screen.findByText(/Mọi chỉnh sửa hoặc bổ sung bài học mới sẽ tự động đưa khóa học liên kết trở lại trạng thái/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Tiêu đề bài giảng/i), { target: { value: 'Reverting Lesson' } });
    fireEvent.change(screen.getByLabelText(/Số thứ tự bài giảng/i), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/Thời lượng học/i), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/Đường dẫn nội dung/i), { target: { value: 'http://example.com/lesson-approved' } });

    const submitBtn = screen.getByRole('button', { name: /Lưu bài học/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Revert course status
      expect(teacherCourseService.updateCourse).toHaveBeenCalledWith('c-approved', { status: 'pending' });
      // Create lesson
      expect(teacherLessonService.createLesson).toHaveBeenCalled();
    });
  });

  // TC-LCP-04: Edit Lesson Locked if Course is Pending
  test('TC-LCP-04: should lock form fields when editing a lesson in a pending course', async () => {
    const mockLessonPending = {
      id: 'l-edit-pending',
      courseId: 'c-pending',
      title: 'Locked Lesson',
      order: 1,
      durationMinutes: 40,
      contentUrl: 'http://example.com/locked',
      teacherId: 'u-teacher-001'
    };

    teacherLessonService.getLessonById.mockResolvedValue(mockLessonPending);

    render(
      <MemoryRouter initialEntries={['/teacher/lessons/l-edit-pending/edit']}>
        <Routes>
          <Route path="/teacher/lessons/:id/edit" element={<LessonCreatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Locked Lesson')).toBeInTheDocument();
    });

    // Check fields are disabled
    expect(screen.getByLabelText(/Lựa chọn khóa học/i)).toBeDisabled();
    expect(screen.getByLabelText(/Tiêu đề bài giảng/i)).toBeDisabled();
    expect(screen.getByLabelText(/Số thứ tự bài giảng/i)).toBeDisabled();
    expect(screen.getByLabelText(/Thời lượng học/i)).toBeDisabled();
    expect(screen.getByLabelText(/Đường dẫn nội dung/i)).toBeDisabled();
    expect(screen.getByLabelText(/Đường dẫn tệp âm thanh/i)).toBeDisabled();

    // Check submit is disabled
    expect(screen.getByRole('button', { name: /Lưu bài học/i })).toBeDisabled();

    // Check warning alert is displayed
    expect(screen.getByText(/Khóa học này đang chờ phê duyệt/i)).toBeInTheDocument();
  });

  // TC-LCP-05: Block Cross-Edit
  test('TC-LCP-05: should show access denied alert if lesson is owned by another teacher', async () => {
    const mockLessonStranger = {
      id: 'l-edit-stranger',
      courseId: 'c-1',
      title: 'Stranger Lesson',
      order: 1,
      durationMinutes: 40,
      contentUrl: 'http://example.com/stranger',
      teacherId: 'u-teacher-stranger'
    };

    teacherLessonService.getLessonById.mockResolvedValue(mockLessonStranger);

    render(
      <MemoryRouter initialEntries={['/teacher/lessons/l-edit-stranger/edit']}>
        <Routes>
          <Route path="/teacher/lessons/:id/edit" element={<LessonCreatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quyền truy cập bị từ chối')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Tiêu đề bài giảng/i)).not.toBeInTheDocument();
    });
  });
});
