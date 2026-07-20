/**
 * Traceability Matrix:
 * | Test Case ID | Test Target / Scenario                                | Related Requirement in SPEC.md | Done Criteria Status |
 * |--------------|--------------------------------------------------------|--------------------------------|----------------------|
 * | TC-CFP-01    | CourseCreatePage validation for empty/invalid values   | US-TCH-01 / SPEC §8            | Complete             |
 * | TC-CFP-02    | CourseCreatePage successfully creates a draft course    | US-TCH-01 / EARS Event-driven  | Complete             |
 * | TC-CFP-03    | CourseEditPage displays warning & locks pending course | US-TCH-02 / EARS State-driven  | Complete             |
 * | TC-CFP-04    | CourseEditPage automatically reverts approved to pending| US-TCH-02 / EARS Event-driven  | Complete             |
 * | TC-CFP-05    | CourseEditPage restricts editing course of other users | US-TCH-02 / EARS Unwanted      | Complete             |
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CourseCreatePage from '../CourseCreatePage';
import CourseEditPage from '../CourseEditPage';
import { teacherCourseService } from '../../../services/teacherCourseService';
import { auditLogService } from '../../../services/auditLogService';
import { getCurrentUser } from '../../../services/authService';

// Mock services
jest.mock('../../../services/teacherCourseService');
jest.mock('../../../services/auditLogService');
jest.mock('../../../services/authService');

const mockTeacher = { id: 'u-teacher-001', fullName: 'IELTS Teacher' };

describe('Course Form Pages (Create & Edit) Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue(mockTeacher);
  });

  // TC-CFP-01: Validation Checks
  test('TC-CFP-01: should display validation errors on CourseCreatePage for empty form submit', async () => {
    render(
      <MemoryRouter>
        <CourseCreatePage />
      </MemoryRouter>
    );

    const saveBtn = screen.getByRole('button', { name: /Lưu bản nháp/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText('Tiêu đề phải có ít nhất 5 ký tự')).toBeInTheDocument();
    expect(await screen.findByText('Mô tả phải có ít nhất 10 ký tự')).toBeInTheDocument();
  });

  // TC-CFP-02: Create Happy Path
  test('TC-CFP-02: should submit valid course data and create a draft course', async () => {
    const createdCourseMock = { id: 'c-new-123', title: 'New Reading Guide', teacherId: 'u-teacher-001' };
    teacherCourseService.createCourse.mockResolvedValue(createdCourseMock);
    auditLogService.logAction.mockResolvedValue({});

    render(
      <MemoryRouter>
        <CourseCreatePage />
      </MemoryRouter>
    );

    // Fill the inputs
    fireEvent.change(screen.getByLabelText(/Tiêu đề khóa học/i), { target: { value: 'New Reading Guide' } });
    fireEvent.change(screen.getByLabelText(/Mô tả khóa học/i), { target: { value: 'This is a long enough description of the course.' } });
    fireEvent.change(screen.getByLabelText(/Giá học phí/i), { target: { value: '150000' } });
    fireEvent.change(screen.getByLabelText(/Thời lượng/i), { target: { value: '8' } });

    const saveBtn = screen.getByRole('button', { name: /Lưu bản nháp/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(teacherCourseService.createCourse).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Reading Guide',
          description: 'This is a long enough description of the course.',
          price: 150000,
          durationWeeks: 8,
          status: 'draft',
          teacherId: 'u-teacher-001',
          isPremium: true
        })
      );
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'CREATE_COURSE',
        { courseId: 'c-new-123', title: 'New Reading Guide' },
        'u-teacher-001'
      );
    });
  });

  // TC-CFP-03: Edit Locks Pending Course
  test('TC-CFP-03: should lock all fields on CourseEditPage when course is in pending state', async () => {
    const pendingCourseMock = {
      id: 'c-pending-789',
      title: 'Pending Writing Course',
      description: 'Advanced writing tasks',
      skill: 'Writing',
      level: 'Advanced',
      price: 200000,
      durationWeeks: 6,
      status: 'pending',
      teacherId: 'u-teacher-001'
    };

    teacherCourseService.getCourseById.mockResolvedValue(pendingCourseMock);

    render(
      <MemoryRouter initialEntries={['/teacher/courses/c-pending-789/edit']}>
        <Routes>
          <Route path="/teacher/courses/:id/edit" element={<CourseEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Pending Writing Course')).toBeInTheDocument();
    });

    // Verify fields are disabled
    expect(screen.getByLabelText(/Tiêu đề khóa học/i)).toBeDisabled();
    expect(screen.getByLabelText(/Mô tả khóa học/i)).toBeDisabled();
    expect(screen.getByLabelText(/Kỹ năng chuyên môn/i)).toBeDisabled();
    expect(screen.getByLabelText(/Trình độ khóa học/i)).toBeDisabled();
    expect(screen.getByLabelText(/Thời lượng/i)).toBeDisabled();
    expect(screen.getByLabelText(/Giá học phí/i)).toBeDisabled();

    // Verify submit button is disabled
    const updateBtn = screen.getByRole('button', { name: /Cập nhật khóa học/i });
    expect(updateBtn).toBeDisabled();

    // Verify warning alert is visible
    expect(screen.getByText(/Khóa học đang chờ phê duyệt/i)).toBeInTheDocument();
  });

  // TC-CFP-04: Edit Approved Course Reverts Status to Pending
  test('TC-CFP-04: should revert course status to pending when updating an approved course', async () => {
    const approvedCourseMock = {
      id: 'c-approved-456',
      title: 'Approved Listening Course',
      description: 'Listening guide course description here',
      skill: 'Listening',
      level: 'Intermediate',
      price: 0,
      durationWeeks: 4,
      status: 'approved',
      teacherId: 'u-teacher-001'
    };

    teacherCourseService.getCourseById.mockResolvedValue(approvedCourseMock);
    teacherCourseService.updateCourse.mockResolvedValue({});
    auditLogService.logAction.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/teacher/courses/c-approved-456/edit']}>
        <Routes>
          <Route path="/teacher/courses/:id/edit" element={<CourseEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for course to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Approved Listening Course')).toBeInTheDocument();
    });

    // Make edits
    const titleInput = screen.getByLabelText(/Tiêu đề khóa học/i);
    fireEvent.change(titleInput, { target: { value: 'Approved Listening Course Edited' } });

    const updateBtn = screen.getByRole('button', { name: /Cập nhật khóa học/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(teacherCourseService.updateCourse).toHaveBeenCalledWith(
        'c-approved-456',
        expect.objectContaining({
          title: 'Approved Listening Course Edited',
          status: 'pending' // Reverted status
        })
      );
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'UPDATE_COURSE',
        expect.objectContaining({ courseId: 'c-approved-456' }),
        'u-teacher-001'
      );
    });
  });

  // TC-CFP-05: Restrict Editing Course of Other Teachers
  test('TC-CFP-05: should deny editing and show alert if course is owned by another teacher', async () => {
    const strangerCourseMock = {
      id: 'c-stranger-123',
      title: 'Stranger Course',
      description: 'This course belongs to another teacher.',
      skill: 'Speaking',
      level: 'Intermediate',
      price: 0,
      durationWeeks: 4,
      status: 'draft',
      teacherId: 'u-teacher-stranger'
    };

    teacherCourseService.getCourseById.mockResolvedValue(strangerCourseMock);

    render(
      <MemoryRouter initialEntries={['/teacher/courses/c-stranger-123/edit']}>
        <Routes>
          <Route path="/teacher/courses/:id/edit" element={<CourseEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify warning screen
    await waitFor(() => {
      expect(screen.getByText('Quyền truy cập bị từ chối')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Tiêu đề khóa học/i)).not.toBeInTheDocument();
    });
  });
});
