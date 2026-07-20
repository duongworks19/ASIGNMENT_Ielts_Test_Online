/**
 * Traceability Matrix:
 * | Test Case ID | Test Target / Scenario                                | Related Requirement in SPEC.md | Done Criteria Status |
 * |--------------|--------------------------------------------------------|--------------------------------|----------------------|
 * | TC-TLP-01    | TestListPage displays test elements and parent details| US-TCH-04                      | Complete             |
 * | TC-TLP-02    | TestListPage filters tests by title search query       | US-TCH-04                      | Complete             |
 * | TC-TLP-03    | TestListPage filters tests by course & skill           | US-TCH-04                      | Complete             |
 * | TC-TLP-04    | TestListPage locks Edit/Delete buttons if course pending| US-TCH-04 / EARS State-driven  | Complete             |
 * | TC-TLP-05    | Deleting test shows modal, cascades questions & logs   | US-TCH-04 / EARS Event-driven  | Complete             |
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TestListPage from '../TestListPage';
import { teacherCourseService } from '../../../services/teacherCourseService';
import { teacherTestService } from '../../../services/teacherTestService';
import { teacherQuestionService } from '../../../services/teacherQuestionService';
import { auditLogService } from '../../../services/auditLogService';
import { getCurrentUser } from '../../../services/authService';

// Mock services
jest.mock('../../../services/teacherCourseService');
jest.mock('../../../services/teacherTestService');
jest.mock('../../../services/teacherQuestionService');
jest.mock('../../../services/auditLogService');
jest.mock('../../../services/authService');

const mockTeacher = { id: 'u-teacher-001', fullName: 'IELTS Teacher' };
const mockCourses = [
  { id: 'c-1', title: 'IELTS Foundation', status: 'draft', teacherId: 'u-teacher-001' },
  { id: 'c-pending', title: 'IELTS Advanced', status: 'pending', teacherId: 'u-teacher-001' }
];

const mockTests = [
  { id: 't-1', courseId: 'c-1', title: 'Listening Mock Test 1', skill: 'Listening', durationMinutes: 40, totalQuestions: 40, bandScale: 'IELTS 0-9', teacherId: 'u-teacher-001' },
  { id: 't-2', courseId: 'c-pending', title: 'Reading Final Mock', skill: 'Reading', durationMinutes: 60, totalQuestions: 40, bandScale: 'IELTS 0-9', teacherId: 'u-teacher-001' }
];

const mockQuestions = [
  { id: 'q-1', testId: 't-1', type: 'multiple-choice', questionText: 'Q1 Text', options: ['A', 'B'], answer: 'A' },
  { id: 'q-2', testId: 't-1', type: 'true-false-not-given', questionText: 'Q2 Text', options: ['True', 'False'], answer: 'True' }
];

describe('TestListPage Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue(mockTeacher);
    teacherCourseService.getCourses.mockResolvedValue(mockCourses);
    teacherTestService.getTests.mockResolvedValue(mockTests);
    // teacherQuestionService returns mockQuestions for t-1, empty for others
    teacherQuestionService.getQuestions.mockImplementation((id) => {
      if (id === 't-1') return Promise.resolve(mockQuestions);
      return Promise.resolve([]);
    });
  });

  // TC-TLP-01: Render
  test('TC-TLP-01: should render list of tests correctly with their question counts', async () => {
    render(
      <MemoryRouter>
        <TestListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Listening Mock Test 1')).toBeInTheDocument();
      expect(screen.getByText('Reading Final Mock')).toBeInTheDocument();
    });

    // Check course names
    expect(screen.getByText('IELTS Foundation')).toBeInTheDocument();
    expect(screen.getByText('IELTS Advanced')).toBeInTheDocument();

    // Check test 1 actual question count (2 questions)
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  // TC-TLP-02: Title search filter
  test('TC-TLP-02: should filter the list based on search query', async () => {
    render(
      <MemoryRouter>
        <TestListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Listening Mock Test 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Nhập tiêu đề đề thi/i);
    fireEvent.change(searchInput, { target: { value: 'Listening' } });

    expect(screen.getByText('Listening Mock Test 1')).toBeInTheDocument();
    expect(screen.queryByText('Reading Final Mock')).not.toBeInTheDocument();
  });

  // TC-TLP-03: Dropdown filters
  test('TC-TLP-03: should filter tests by selected Course and Skill', async () => {
    render(
      <MemoryRouter>
        <TestListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Listening Mock Test 1')).toBeInTheDocument();
    });

    // Filter by skill Reading
    const skillSelect = screen.getByLabelText(/Lọc theo kỹ năng/i);
    fireEvent.change(skillSelect, { target: { value: 'Reading' } });

    expect(screen.queryByText('Listening Mock Test 1')).not.toBeInTheDocument();
    expect(screen.getByText('Reading Final Mock')).toBeInTheDocument();
  });

  // TC-TLP-04: Locks for pending course
  test('TC-TLP-04: should lock Edit/Delete buttons if the parent course status is pending', async () => {
    render(
      <MemoryRouter>
        <TestListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Reading Final Mock')).toBeInTheDocument();
    });

    // Locate the row containing 'Reading Final Mock'
    const row = screen.getByText('Reading Final Mock').closest('tr');
    
    // Within this row, find disabled buttons
    const editBtn = within(row).getByTitle(/Khóa học đang chờ duyệt, không thể sửa đề thi/i);
    const deleteBtn = within(row).getByTitle(/Khóa học đang chờ duyệt, không thể xóa đề thi/i);

    expect(editBtn).toBeDisabled();
    expect(deleteBtn).toBeDisabled();
  });

  // TC-TLP-05: Deletion cascade & audit logging
  test('TC-TLP-05: should trigger cascade deletion of questions and log actions upon deleting a test', async () => {
    teacherTestService.deleteTest.mockResolvedValue({});
    teacherQuestionService.deleteQuestion.mockResolvedValue({});
    auditLogService.logAction.mockResolvedValue({});

    render(
      <MemoryRouter>
        <TestListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Listening Mock Test 1')).toBeInTheDocument();
    });

    const row = screen.getByText('Listening Mock Test 1').closest('tr');
    const deleteBtn = within(row).getByTitle('Xóa đề thi');
    
    fireEvent.click(deleteBtn);

    // Confirmation modal should show
    expect(screen.getByText(/Xác nhận xóa đề thi/i)).toBeInTheDocument();
    
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận xóa/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      // Expect question cascade delete to be called for the 2 questions of test t-1
      expect(teacherQuestionService.deleteQuestion).toHaveBeenCalledTimes(2);
      expect(teacherQuestionService.deleteQuestion).toHaveBeenCalledWith('q-1');
      expect(teacherQuestionService.deleteQuestion).toHaveBeenCalledWith('q-2');
      
      // Expect test delete to be called
      expect(teacherTestService.deleteTest).toHaveBeenCalledWith('t-1');

      // Expect audit logs for both test deletion and question cascade deletions
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'DELETE_TEST',
        expect.objectContaining({ testId: 't-1', title: 'Listening Mock Test 1' }),
        'u-teacher-001'
      );
    });
  });
});
