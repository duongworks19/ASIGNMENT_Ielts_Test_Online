/**
 * Traceability Matrix:
 * | Test Case ID | Test Target / Scenario | Related Requirement in SPEC.md | Done Criteria Status |
 * |--------------|------------------------|--------------------------------|----------------------|
 * | TC-DSH-01    | Render dashboard statistics with correct content counts | US-TCH-06 / PLAN §2.2          | Complete             |
 * | TC-DSH-02    | Render zero counters for a newly created teacher | Edge cases / empty states     | Complete             |
 * | TC-DSH-03    | Show warning alert when server API calls fail | EARS Unwanted / Edge cases     | Complete             |
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeacherDashboard from '../TeacherDashboard';
import { teacherCourseService } from '../../../services/teacherCourseService';
import { teacherLessonService } from '../../../services/teacherLessonService';
import { teacherTestService } from '../../../services/teacherTestService';
import { teacherStudentService } from '../../../services/teacherStudentService';
import { teacherApprovalService } from '../../../services/teacherApprovalService';
import { getCurrentUser } from '../../../services/authService';

// Mock các service
jest.mock('../../../services/teacherCourseService');
jest.mock('../../../services/teacherLessonService');
jest.mock('../../../services/teacherTestService');
jest.mock('../../../services/teacherStudentService');
jest.mock('../../../services/teacherApprovalService');
jest.mock('../../../services/authService');

const mockCurrentUser = { id: 'u-teacher-001', fullName: 'Mentor Test' };
const mockCourses = [
  { id: 'course-1', title: 'IELTS Reading Advance', teacherId: 'u-teacher-001' },
  { id: 'course-2', title: 'IELTS Writing Basic', teacherId: 'u-teacher-001' }
];
const mockLessons = [
  { id: '1', title: 'Skimming', courseId: 'course-1', teacherId: 'u-teacher-001' },
  { id: '2', title: 'Scanning', courseId: 'course-1', teacherId: 'u-teacher-001' },
  { id: '3', title: 'Line Graph', courseId: 'course-2', teacherId: 'u-teacher-001' }
];
const mockTests = [
  { id: 't-1', title: 'Reading Test 1', courseId: 'course-1', teacherId: 'u-teacher-001' }
];
const mockEnrollments = [
  { id: 1, userId: 'u-student-001', courseId: 'course-1' },
  { id: 2, userId: 'u-student-002', courseId: 'course-1' },
  { id: 3, userId: 'u-student-001', courseId: 'course-2' }, // Trùng userId u-student-001, nên số học sinh duy nhất là 2
  { id: 4, userId: 'u-student-003', courseId: 'course-other' } // Không thuộc khóa học của giáo viên này
];
const mockApprovals = [
  { id: 'ap-1', contentType: 'course', contentId: 'course-1', teacherId: 'u-teacher-001', status: 'approved', reason: 'Good work', createdAt: '2026-06-10T08:00:00Z' },
  { id: 'ap-2', contentType: 'course', contentId: 'course-2', teacherId: 'u-teacher-001', status: 'pending', reason: '', createdAt: '2026-06-11T09:00:00Z' }
];

describe('TeacherDashboard Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue(mockCurrentUser);
    teacherCourseService.getCourses.mockResolvedValue(mockCourses);
    teacherLessonService.getLessons.mockResolvedValue(mockLessons);
    teacherTestService.getTests.mockResolvedValue(mockTests);
    teacherStudentService.getEnrollments.mockResolvedValue(mockEnrollments);
    teacherApprovalService.getApprovalRequests.mockResolvedValue(mockApprovals);
  });

  // TC-DSH-01: Happy Path - Load and render dashboard stats
  test('TC-DSH-01: should render all statistics and recent approval requests list correctly', async () => {
    render(
      <BrowserRouter>
        <TeacherDashboard />
      </BrowserRouter>
    );

    // Chờ loading biến mất
    await waitFor(() => {
      expect(screen.queryByText(/Đang tải dữ liệu Dashboard/i)).not.toBeInTheDocument();
    });

    // Kiểm tra đếm số lượng thông qua các thẻ heading H3
    const headings = screen.getAllByRole('heading', { level: 3 });
    const values = headings.map(h => h.textContent);
    expect(values).toContain('3'); // 3 Lessons
    expect(values).toContain('1'); // 1 Test
    expect(values.filter(v => v === '2').length).toBe(2); // 2 Courses và 2 Unique Students

    // Kiểm tra bảng yêu cầu duyệt gần nhất
    expect(screen.getAllByText('Khóa học').length).toBeGreaterThan(0);
    expect(screen.getByText('course-1')).toBeInTheDocument();
    expect(screen.getByText('course-2')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Good work')).toBeInTheDocument();
  });

  // TC-DSH-02: Boundary Case - Empty State
  test('TC-DSH-02: should display zero stats and empty alert when teacher has no contents', async () => {
    teacherCourseService.getCourses.mockResolvedValue([]);
    teacherLessonService.getLessons.mockResolvedValue([]);
    teacherTestService.getTests.mockResolvedValue([]);
    teacherStudentService.getEnrollments.mockResolvedValue([]);
    teacherApprovalService.getApprovalRequests.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <TeacherDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Đang tải dữ liệu Dashboard/i)).not.toBeInTheDocument();
    });

    // Các chỉ số phải hiển thị 0
    const counts = screen.getAllByRole('heading', { level: 3 });
    counts.forEach(count => {
      expect(count.textContent).toBe('0');
    });

    // Hiển thị thông báo bảng duyệt trống
    expect(screen.getByText(/Chưa có yêu cầu duyệt nội dung nào/i)).toBeInTheDocument();
  });

  // TC-DSH-03: Error Case - API Failure
  test('TC-DSH-03: should display error warning if any service fetching fails', async () => {
    teacherCourseService.getCourses.mockRejectedValue(new Error('Server Down'));

    render(
      <BrowserRouter>
        <TeacherDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Đang tải dữ liệu Dashboard/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Không thể tải dữ liệu thống kê Dashboard/i)).toBeInTheDocument();
  });
});
