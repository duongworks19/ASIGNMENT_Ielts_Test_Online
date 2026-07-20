/**
 * Traceability Matrix:
 * | Test Case ID | Test Target / Scenario                                | Related Requirement in SPEC.md | Done Criteria Status |
 * |--------------|--------------------------------------------------------|--------------------------------|----------------------|
 * | TC-TCP-01    | TestCreatePage validation checks for form inputs       | US-TCH-04                      | Complete             |
 * | TC-TCP-02    | TestCreatePage successfully creates a test & logs      | US-TCH-04 / EARS Ubiquitous    | Complete             |
 * | TC-TCP-03    | Creating test in approved course reverts it to pending | US-TCH-02 / EARS Event-driven  | Complete             |
 * | TC-TCP-04    | TestCreatePage locks form inputs if course is pending  | US-TCH-02 / EARS State-driven  | Complete             |
 * | TC-TCP-05    | TestCreatePage blocks access for other teacher's test  | US-TCH-04 / EARS Unwanted      | Complete             |
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TestCreatePage from '../TestCreatePage';
import { teacherCourseService } from '../../../services/teacherCourseService';
import { teacherTestService } from '../../../services/teacherTestService';
import { auditLogService } from '../../../services/auditLogService';
import { getCurrentUser } from '../../../services/authService';

// Mock services
jest.mock('../../../services/teacherCourseService');
jest.mock('../../../services/teacherTestService');
jest.mock('../../../services/auditLogService');
jest.mock('../../../services/authService');

const mockTeacher = { id: 'u-teacher-001', fullName: 'IELTS Teacher' };
const mockCourses = [
  { id: 'c-1', title: 'Course Draft', status: 'draft', teacherId: 'u-teacher-001' },
  { id: 'c-approved', title: 'Course Approved', status: 'approved', teacherId: 'u-teacher-001' },
  { id: 'c-pending', title: 'Course Pending', status: 'pending', teacherId: 'u-teacher-001' }
];

describe('TestCreatePage Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue(mockTeacher);
    teacherCourseService.getCourses.mockResolvedValue(mockCourses);
  });

  // TC-TCP-01: Validation Checks
  test('TC-TCP-01: should display validation errors for empty fields', async () => {
    render(
      <MemoryRouter>
        <TestCreatePage />
      </MemoryRouter>
    );

    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('Course Draft (draft)')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Lưu đề thi/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Vui lòng chọn khóa học')).toBeInTheDocument();
    expect(await screen.findByText('Tiêu đề đề thi phải có ít nhất 5 ký tự')).toBeInTheDocument();
    expect(await screen.findByText('Vui lòng chọn kỹ năng')).toBeInTheDocument();
  });

  // TC-TCP-02: Create Test Happy Path & Audit Logs
  test('TC-TCP-02: should successfully create a new test and log the action', async () => {
    teacherTestService.createTest.mockResolvedValue({ id: 't-new', title: 'New Practice Test' });
    auditLogService.logAction.mockResolvedValue({});

    render(
      <MemoryRouter>
        <TestCreatePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Course Draft (draft)')).toBeInTheDocument();
    });

    // Fill the fields
    fireEvent.change(screen.getByLabelText(/Lựa chọn khóa học/i), { target: { value: 'c-1' } });
    fireEvent.change(screen.getByLabelText(/Tiêu đề đề thi/i), { target: { value: 'New Practice Test' } });
    fireEvent.change(screen.getByLabelText(/Kỹ năng/i), { target: { value: 'Reading' } });
    fireEvent.change(screen.getByLabelText(/Thang điểm/i), { target: { value: 'IELTS 0-9' } });
    fireEvent.change(screen.getByLabelText(/Thời gian làm bài/i), { target: { value: '60' } });
    fireEvent.change(screen.getByLabelText(/Số lượng câu hỏi/i), { target: { value: '40' } });

    const submitBtn = screen.getByRole('button', { name: /Lưu đề thi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(teacherTestService.createTest).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: 'c-1',
          title: 'New Practice Test',
          skill: 'Reading',
          durationMinutes: 60,
          totalQuestions: 40,
          bandScale: 'IELTS 0-9',
          teacherId: 'u-teacher-001'
        })
      );
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'CREATE_TEST',
        { testId: 't-new', title: 'New Practice Test', courseId: 'c-1' },
        'u-teacher-001'
      );
    });
  });

  // TC-TCP-03: Create Test in Approved Course reverts Course to Pending
  test('TC-TCP-03: should automatically revert course status to pending when creating a test inside an approved course', async () => {
    teacherTestService.createTest.mockResolvedValue({ id: 't-new-2', title: 'Reverting Test' });
    teacherCourseService.updateCourse.mockResolvedValue({});
    auditLogService.logAction.mockResolvedValue({});

    render(
      <MemoryRouter>
        <TestCreatePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Course Approved (approved)')).toBeInTheDocument();
    });

    // Fill course select with approved course
    fireEvent.change(screen.getByLabelText(/Lựa chọn khóa học/i), { target: { value: 'c-approved' } });
    
    // Check info alert is shown when approved course is selected
    expect(await screen.findByText(/Mọi chỉnh sửa hoặc bổ sung đề thi mới sẽ tự động đưa khóa học liên kết trở lại trạng thái/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Tiêu đề đề thi/i), { target: { value: 'Reverting Test' } });
    fireEvent.change(screen.getByLabelText(/Kỹ năng/i), { target: { value: 'Listening' } });
    fireEvent.change(screen.getByLabelText(/Thời gian làm bài/i), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/Số lượng câu hỏi/i), { target: { value: '40' } });

    const submitBtn = screen.getByRole('button', { name: /Lưu đề thi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Revert course status
      expect(teacherCourseService.updateCourse).toHaveBeenCalledWith('c-approved', { status: 'pending' });
      // Create test
      expect(teacherTestService.createTest).toHaveBeenCalled();
    });
  });

  // TC-TCP-04: Edit Test Locked if Course is Pending
  test('TC-TCP-04: should lock form fields when editing a test in a pending course', async () => {
    const mockTestPending = {
      id: 't-edit-pending',
      courseId: 'c-pending',
      title: 'Locked Test',
      skill: 'Writing',
      durationMinutes: 60,
      totalQuestions: 2,
      bandScale: 'IELTS 0-9',
      teacherId: 'u-teacher-001'
    };

    teacherTestService.getTestById.mockResolvedValue(mockTestPending);

    render(
      <MemoryRouter initialEntries={['/teacher/tests/t-edit-pending/edit']}>
        <Routes>
          <Route path="/teacher/tests/:id/edit" element={<TestCreatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Locked Test')).toBeInTheDocument();
    });

    // Check fields are disabled
    expect(screen.getByLabelText(/Lựa chọn khóa học/i)).toBeDisabled();
    expect(screen.getByLabelText(/Tiêu đề đề thi/i)).toBeDisabled();
    expect(screen.getByLabelText(/Kỹ năng/i)).toBeDisabled();
    expect(screen.getByLabelText(/Thang điểm/i)).toBeDisabled();
    expect(screen.getByLabelText(/Thời gian làm bài/i)).toBeDisabled();
    expect(screen.getByLabelText(/Số lượng câu hỏi/i)).toBeDisabled();

    // Check submit is disabled
    expect(screen.getByRole('button', { name: /Lưu đề thi/i })).toBeDisabled();

    // Check warning alert is displayed
    expect(screen.getByText(/Khóa học liên kết đang trong trạng thái xem xét duyệt/i)).toBeInTheDocument();
  });

  // TC-TCP-05: Block Cross-Edit
  test('TC-TCP-05: should show access denied alert if test is owned by another teacher', async () => {
    const mockTestStranger = {
      id: 't-edit-stranger',
      courseId: 'c-1',
      title: 'Stranger Test',
      skill: 'Speaking',
      durationMinutes: 15,
      totalQuestions: 3,
      bandScale: 'IELTS 0-9',
      teacherId: 'u-teacher-stranger'
    };

    teacherTestService.getTestById.mockResolvedValue(mockTestStranger);

    render(
      <MemoryRouter initialEntries={['/teacher/tests/t-edit-stranger/edit']}>
        <Routes>
          <Route path="/teacher/tests/:id/edit" element={<TestCreatePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quyền truy cập bị từ chối')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Tiêu đề đề thi/i)).not.toBeInTheDocument();
    });
  });
});
