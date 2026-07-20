/**
 * Traceability Matrix:
 * | Test Case ID | Test Target / Scenario | Related Requirement in SPEC.md | Done Criteria Status |
 * |--------------|------------------------|--------------------------------|----------------------|
 * | TC-CRM-01    | Render course list with matching status badges | US-TCH-06 / PLAN §2.2          | Complete             |
 * | TC-CRM-02    | Filter courses correctly using search and dropdowns | Functional UI requirement      | Complete             |
 * | TC-CRM-03    | Disable edit button when course status is Pending | EARS Unwanted / Error matrix  | Complete             |
 * | TC-CRM-04    | Disable delete button when status is Approved/Pending | EARS Unwanted / Error matrix  | Complete             |
 * | TC-CRM-05    | Delete draft course successfully and update list | EARS State-driven / US-TCH-07  | Complete             |
 * | TC-CRM-06    | Display error alert when course fetching fails | EARS Unwanted / Error handling | Complete             |
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CourseManagement from '../CourseManagement';
import { teacherCourseService } from '../../../services/teacherCourseService';
import { getCurrentUser } from '../../../services/authService';

// Mock services
jest.mock('../../../services/teacherCourseService');
jest.mock('../../../services/authService');

const mockCurrentUser = { id: 'u-teacher-001', fullName: 'Mentor Test' };
const mockCourses = [
  { id: 'c-1', title: 'IELTS Reading Foundation', description: 'Beginner course', skill: 'Reading', level: 'Beginner', price: 0, durationWeeks: 6, enrolledCount: 12, status: 'draft', teacherId: 'u-teacher-001' },
  { id: 'c-2', title: 'IELTS Writing Intensive', description: 'Advanced writing', skill: 'Writing', level: 'Advanced', price: 500000, durationWeeks: 8, enrolledCount: 25, status: 'pending', teacherId: 'u-teacher-001' },
  { id: 'c-3', title: 'IELTS Listening Master', description: 'Advanced listening', skill: 'Listening', level: 'Advanced', price: 600000, durationWeeks: 10, enrolledCount: 40, status: 'approved', teacherId: 'u-teacher-001' }
];

describe('CourseManagement Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue(mockCurrentUser);
    teacherCourseService.getCourses.mockResolvedValue(mockCourses);
  });

  // TC-CRM-01: Happy Path - Load and List
  test('TC-CRM-01: should render the course grid list with appropriate details and status badges', async () => {
    render(
      <BrowserRouter>
        <CourseManagement />
      </BrowserRouter>
    );

    expect(screen.getByText(/Đang tải danh sách khóa học/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Đang tải danh sách khóa học/i)).not.toBeInTheDocument();
    });

    // Verify course titles
    expect(screen.getByText('IELTS Reading Foundation')).toBeInTheDocument();
    expect(screen.getByText('IELTS Writing Intensive')).toBeInTheDocument();
    expect(screen.getByText('IELTS Listening Master')).toBeInTheDocument();

    // Verify badges
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
    expect(screen.getByText('Miễn phí')).toBeInTheDocument();
  });

  // TC-CRM-02: Search & Filter Validation
  test('TC-CRM-02: should filter courses correctly based on search input and skill selection', async () => {
    render(
      <BrowserRouter>
        <CourseManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('IELTS Reading Foundation')).toBeInTheDocument();
    });

    // 1. Search filter
    const searchInput = screen.getByPlaceholderText(/Nhập tên khóa học/i);
    fireEvent.change(searchInput, { target: { value: 'Writing' } });

    expect(screen.getByText('IELTS Writing Intensive')).toBeInTheDocument();
    expect(screen.queryByText('IELTS Reading Foundation')).not.toBeInTheDocument();
    expect(screen.queryByText('IELTS Listening Master')).not.toBeInTheDocument();

    // Reset search
    fireEvent.change(searchInput, { target: { value: '' } });

    // 2. Skill select filter
    const skillSelect = screen.getByLabelText('Kỹ năng');
    fireEvent.change(skillSelect, { target: { value: 'Listening' } });

    expect(screen.getByText('IELTS Listening Master')).toBeInTheDocument();
    expect(screen.queryByText('IELTS Reading Foundation')).not.toBeInTheDocument();
    expect(screen.queryByText('IELTS Writing Intensive')).not.toBeInTheDocument();
  });

  // TC-CRM-03 & TC-CRM-04: Button locking based on status
  test('TC-CRM-03 & TC-CRM-04: should enforce edit and delete locking rules based on course status', async () => {
    render(
      <BrowserRouter>
        <CourseManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('IELTS Reading Foundation')).toBeInTheDocument();
    });

    // Course 1: status = 'draft' -> Edit enabled, Delete enabled
    const c1EditBtn = screen.getAllByTitle('Sửa thông tin')[0];
    const c1DeleteBtn = screen.getAllByTitle('Xóa khóa học')[0];
    expect(c1EditBtn).not.toHaveAttribute('disabled');
    expect(c1DeleteBtn).not.toBeDisabled();

    // Course 2: status = 'pending' -> Edit disabled, Delete disabled
    const c2EditBtn = screen.getAllByTitle('Khóa học đang chờ duyệt, không thể sửa')[0];
    const c2DeleteBtn = screen.getAllByTitle('Không thể xóa khóa học đã duyệt hoặc chờ duyệt')[0];
    expect(c2EditBtn).toHaveAttribute('disabled');
    expect(c2DeleteBtn).toBeDisabled();

    // Course 3: status = 'approved' -> Edit enabled, Delete disabled
    const c3EditBtn = screen.getAllByTitle('Sửa thông tin')[1]; // course 1 and 3 are enabled, so course 3 is at index 1
    const c3DeleteBtn = screen.getAllByTitle('Không thể xóa khóa học đã duyệt hoặc chờ duyệt')[1]; // course 2 and 3 are disabled, so course 3 is at index 1
    expect(c3EditBtn).not.toHaveAttribute('disabled');
    expect(c3DeleteBtn).toBeDisabled();
  });

  // TC-CRM-05: Delete draft course
  test('TC-CRM-05: should successfully delete a draft course and remove it from list', async () => {
    teacherCourseService.deleteCourse.mockResolvedValue({});

    render(
      <BrowserRouter>
        <CourseManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('IELTS Reading Foundation')).toBeInTheDocument();
    });

    // Click delete on draft course (Course 1)
    const deleteBtn = screen.getAllByTitle('Xóa khóa học')[0];
    fireEvent.click(deleteBtn);

    // Confirm deletion in modal
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận xóa/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(teacherCourseService.deleteCourse).toHaveBeenCalledWith('c-1');
      expect(screen.queryByText('IELTS Reading Foundation')).not.toBeInTheDocument();
    });
  });

  // TC-CRM-06: Error handling
  test('TC-CRM-06: should display error message when fetching courses fails', async () => {
    teacherCourseService.getCourses.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <CourseManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Không thể kết nối đến máy chủ/i)).toBeInTheDocument();
    });
  });
});
