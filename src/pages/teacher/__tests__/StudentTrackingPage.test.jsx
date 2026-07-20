/**
 * Traceability Matrix:
 * | Test Case ID | Test Target / Scenario                                | Related Requirement in SPEC.md | Done Criteria Status |
 * |--------------|--------------------------------------------------------|--------------------------------|----------------------|
 * | TC-STP-01    | StudentTrackingPage renders enrollment progress rows   | PLAN §2.2                      | Complete             |
 * | TC-STP-02    | StudentTrackingPage filters list by student search     | PLAN §2.2                      | Complete             |
 * | TC-STP-03    | StudentTrackingPage filters list by course dropdown    | PLAN §2.2                      | Complete             |
 * | TC-STP-04    | Detail Modal opens and renders lesson progress stats   | PLAN §2.2                      | Complete             |
 * | TC-STP-05    | Detail Modal displays test attempts scores and bands   | PLAN §2.2                      | Complete             |
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StudentTrackingPage from '../StudentTrackingPage';
import { teacherCourseService } from '../../../services/teacherCourseService';
import { teacherStudentService } from '../../../services/teacherStudentService';
import { teacherTestService } from '../../../services/teacherTestService';
import { getCurrentUser } from '../../../services/authService';

// Mock services
jest.mock('../../../services/teacherCourseService');
jest.mock('../../../services/teacherStudentService');
jest.mock('../../../services/teacherTestService');
jest.mock('../../../services/authService');

const mockTeacher = { id: 'u-teacher-001', fullName: 'IELTS Teacher' };
const mockCourses = [
  { id: 'c-1', title: 'Course IELTS Foundation', status: 'draft', teacherId: 'u-teacher-001' },
  { id: 'c-2', title: 'Course Writing Advanced', status: 'approved', teacherId: 'u-teacher-001' }
];

const mockEnrollments = [
  { id: 'e-1', userId: 's-101', courseId: 'c-1', status: 'active', progress: 65, enrolledAt: '2026-06-01' },
  { id: 'e-2', userId: 's-102', courseId: 'c-2', status: 'active', progress: 100, enrolledAt: '2026-06-02' }
];

const mockStudents = [
  { id: 's-101', fullName: 'Alice Johnson', email: 'alice@student.com', role: 'student' },
  { id: 's-102', fullName: 'Bob Smith', email: 'bob@student.com', role: 'student' }
];

const mockTests = [
  { id: 't-101', courseId: 'c-1', title: 'Reading Test 1', skill: 'Reading', durationMinutes: 40, totalQuestions: 40, bandScale: 'IELTS 0-9', teacherId: 'u-teacher-001' }
];

const mockAttempts = [
  { id: 'a-1', userId: 's-101', testId: 't-101', score: 30, totalQuestions: 40, bandScore: 7.0, createdAt: '2026-06-05T10:00:00Z' }
];

describe('StudentTrackingPage Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue(mockTeacher);
    teacherCourseService.getCourses.mockResolvedValue(mockCourses);
    teacherStudentService.getEnrollments.mockResolvedValue(mockEnrollments);
    teacherStudentService.getStudents.mockResolvedValue(mockStudents);
    teacherTestService.getTests.mockResolvedValue(mockTests);
    teacherStudentService.getTestAttempts.mockResolvedValue(mockAttempts);
  });

  // TC-STP-01: Renders student rows
  test('TC-STP-01: should render enrollment progress rows correctly', async () => {
    render(
      <MemoryRouter>
        <StudentTrackingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Alice Johnson')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Bob Smith')[0]).toBeInTheDocument();
    });

    expect(screen.getByText('alice@student.com')).toBeInTheDocument();
    expect(screen.getByText('bob@student.com')).toBeInTheDocument();
    expect(screen.getAllByText('Course IELTS Foundation')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Course Writing Advanced')[0]).toBeInTheDocument();

    // Check progress percentage text renders
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  // TC-STP-02: Filter search input
  test('TC-STP-02: should filter list based on student name or email search query', async () => {
    render(
      <MemoryRouter>
        <StudentTrackingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Alice Johnson')[0]).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm theo tên học viên hoặc email/i);
    fireEvent.change(searchInput, { target: { value: 'bob' } });

    expect(screen.queryByText('alice@student.com')).not.toBeInTheDocument();
    expect(screen.getAllByText('Bob Smith')[0]).toBeInTheDocument();
  });

  // TC-STP-03: Filter course dropdown
  test('TC-STP-03: should filter list by course selection dropdown', async () => {
    render(
      <MemoryRouter>
        <StudentTrackingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Alice Johnson')[0]).toBeInTheDocument();
    });

    const courseSelect = screen.getByLabelText(/Lọc theo khóa học/i);
    fireEvent.change(courseSelect, { target: { value: 'c-2' } });

    expect(screen.queryByText('alice@student.com')).not.toBeInTheDocument();
    expect(screen.getAllByText('Bob Smith')[0]).toBeInTheDocument();
  });

  // TC-STP-04: Detail Modal Renders Lesson Progress
  test('TC-STP-04: should open detail modal and render lesson progress statistics', async () => {
    render(
      <MemoryRouter>
        <StudentTrackingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Alice Johnson')[0]).toBeInTheDocument();
    });

    // Click on detail button for Alice Johnson
    const aliceRow = screen.getAllByText('Alice Johnson')[0].closest('tr');
    const detailBtn = aliceRow.querySelector('button');
    fireEvent.click(detailBtn);

    // Modal elements should be visible
    expect(screen.getByText('Chi tiết học tập học viên')).toBeInTheDocument();
    expect(screen.getAllByText('Alice Johnson').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Tiến độ bài học')[0]).toBeInTheDocument();
    expect(screen.getAllByText('65%')[0]).toBeInTheDocument();
    expect(screen.getByText('2026-06-01')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  // TC-STP-05: Detail Modal Renders Test Scores
  test('TC-STP-05: should display test attempt results and band score inside detail modal', async () => {
    render(
      <MemoryRouter>
        <StudentTrackingPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Alice Johnson')[0]).toBeInTheDocument();
    });

    // Open Alice Johnson modal
    const aliceRow = screen.getAllByText('Alice Johnson')[0].closest('tr');
    const detailBtn = aliceRow.querySelector('button');
    fireEvent.click(detailBtn);

    // Switch to test results tab
    const testTab = screen.getByText('Kết quả thi thử');
    fireEvent.click(testTab);

    // Verify test parameters appear
    expect(await screen.findByText('Reading Test 1')).toBeInTheDocument();
    expect(screen.getByText('30 / 40')).toBeInTheDocument();
    expect(screen.getByText('Band 7')).toBeInTheDocument();
  });
});
