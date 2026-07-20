/**
 * Traceability Matrix:
 * | Test Case ID | Test Target / Scenario                                | Related Requirement in SPEC.md | Done Criteria Status |
 * |--------------|--------------------------------------------------------|--------------------------------|----------------------|
 * | TC-QBP-01    | QuestionBankPage renders test details and questions    | US-TCH-04                      | Complete             |
 * | TC-QBP-02    | QuestionBankPage validation checks for MCQ/TFN/Blank   | US-TCH-04                      | Complete             |
 * | TC-QBP-03    | QuestionBankPage successfully creates question & logs  | US-TCH-04 / EARS Ubiquitous    | Complete             |
 * | TC-QBP-04    | QuestionBankPage actions disabled if course is pending  | US-TCH-02 / EARS State-driven  | Complete             |
 * | TC-QBP-05    | Question edit/delete reverts approved course to pending| US-TCH-02 / EARS Event-driven  | Complete             |
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import QuestionBankPage from '../QuestionBankPage';
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
  { id: 'c-1', title: 'Course Draft', status: 'draft', teacherId: 'u-teacher-001' },
  { id: 'c-approved', title: 'Course Approved', status: 'approved', teacherId: 'u-teacher-001' },
  { id: 'c-pending', title: 'Course Pending', status: 'pending', teacherId: 'u-teacher-001' }
];

const mockTestDraft = { id: 't-1', courseId: 'c-1', title: 'Mock Test Draft', skill: 'Reading', teacherId: 'u-teacher-001' };
const mockTestApproved = { id: 't-approved', courseId: 'c-approved', title: 'Mock Test Approved', skill: 'Listening', teacherId: 'u-teacher-001' };
const mockTestPending = { id: 't-pending', courseId: 'c-pending', title: 'Mock Test Pending', skill: 'Writing', teacherId: 'u-teacher-001' };

const mockQuestions = [
  { id: 'q-1', testId: 't-1', type: 'multiple-choice', questionText: 'What is A?', options: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'], answer: 'Choice 1', explanation: 'Exp 1', score: 1 }
];

describe('QuestionBankPage Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue(mockTeacher);
    teacherCourseService.getCourses.mockResolvedValue(mockCourses);
    teacherQuestionService.getQuestions.mockResolvedValue(mockQuestions);
  });

  // TC-QBP-01: Render
  test('TC-QBP-01: should render test details and list of questions correctly', async () => {
    teacherTestService.getTestById.mockResolvedValue(mockTestDraft);

    render(
      <MemoryRouter initialEntries={['/teacher/tests/t-1/questions']}>
        <Routes>
          <Route path="/teacher/tests/:id/questions" element={<QuestionBankPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mock Test Draft')).toBeInTheDocument();
      expect(screen.getByText('What is A?')).toBeInTheDocument();
      expect(screen.getByText('Choice 1')).toBeInTheDocument();
    });
  });

  // TC-QBP-02: Validation checks
  test('TC-QBP-02: should display custom validation errors based on question type', async () => {
    teacherTestService.getTestById.mockResolvedValue(mockTestDraft);

    render(
      <MemoryRouter initialEntries={['/teacher/tests/t-1/questions']}>
        <Routes>
          <Route path="/teacher/tests/:id/questions" element={<QuestionBankPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mock Test Draft')).toBeInTheDocument();
    });

    // Submit with empty fields (Default type MCQ)
    const submitBtn = screen.getByRole('button', { name: /Lưu câu hỏi/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Nội dung câu hỏi phải có ít nhất 5 ký tự')).toBeInTheDocument();
    expect(await screen.findByText('Phương án A không được để trống')).toBeInTheDocument();
    expect(await screen.findByText('Phương án B không được để trống')).toBeInTheDocument();
    expect(await screen.findByText('Phương án C không được để trống')).toBeInTheDocument();
    expect(await screen.findByText('Phương án D không được để trống')).toBeInTheDocument();

    // Switch to True/False/Not Given
    fireEvent.change(screen.getByLabelText(/Loại câu hỏi/i), { target: { value: 'true-false-not-given' } });
    
    // TFN has fixed options, correct answer pre-set. Fill only questionText
    fireEvent.change(screen.getByLabelText(/Nội dung câu hỏi/i), { target: { value: 'Valid TFN text' } });
    fireEvent.click(submitBtn);

    // MCQ errors should clear, and form should not fail on TFN options
    await waitFor(() => {
      expect(screen.queryByText('Phương án A không được để trống')).not.toBeInTheDocument();
    });
  });

  // TC-QBP-03: Create Question & Audit Logs
  test('TC-QBP-03: should successfully create a question and log action', async () => {
    teacherTestService.getTestById.mockResolvedValue(mockTestDraft);
    teacherQuestionService.createQuestion.mockResolvedValue({ id: 'q-new', testId: 't-1', type: 'fill-in-the-blank', questionText: 'Blank QuestionText', answer: 'BlankAnswer', explanation: 'BlankExp', score: 1 });
    auditLogService.logAction.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/teacher/tests/t-1/questions']}>
        <Routes>
          <Route path="/teacher/tests/:id/questions" element={<QuestionBankPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mock Test Draft')).toBeInTheDocument();
    });

    // Fill Fill-in-the-blank question
    fireEvent.change(screen.getByLabelText(/Loại câu hỏi/i), { target: { value: 'fill-in-the-blank' } });
    fireEvent.change(screen.getByLabelText(/Nội dung câu hỏi/i), { target: { value: 'Blank QuestionText' } });
    fireEvent.change(screen.getByLabelText(/Đáp án đúng/i), { target: { value: 'BlankAnswer' } });
    fireEvent.change(screen.getByLabelText(/Giải thích chi tiết/i), { target: { value: 'BlankExp' } });

    const submitBtn = screen.getByRole('button', { name: /Lưu câu hỏi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(teacherQuestionService.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          testId: 't-1',
          type: 'fill-in-the-blank',
          questionText: 'Blank QuestionText',
          answer: 'BlankAnswer',
          explanation: 'BlankExp',
          score: 1
        })
      );
      expect(auditLogService.logAction).toHaveBeenCalledWith(
        'CREATE_QUESTION',
        { questionId: 'q-new', testId: 't-1' },
        'u-teacher-001'
      );
    });
  });

  // TC-QBP-04: Lock actions if course is pending
  test('TC-QBP-04: should disable form inputs and question CRUD triggers if parent course is pending approval', async () => {
    teacherTestService.getTestById.mockResolvedValue(mockTestPending);

    render(
      <MemoryRouter initialEntries={['/teacher/tests/t-pending/questions']}>
        <Routes>
          <Route path="/teacher/tests/:id/questions" element={<QuestionBankPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mock Test Pending')).toBeInTheDocument();
    });

    // Verify form fields are disabled
    expect(screen.getByLabelText(/Loại câu hỏi/i)).toBeDisabled();
    expect(screen.getByLabelText(/Nội dung câu hỏi/i)).toBeDisabled();
    expect(screen.getByLabelText(/Điểm số câu hỏi/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /Lưu câu hỏi/i })).toBeDisabled();

    // Verify list buttons are disabled
    const editButtons = screen.getAllByRole('button').filter(btn => btn.className.includes('btn-light'));
    editButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });

    // Warning alert
    expect(screen.getByText(/Khóa học liên kết đang trong trạng thái xem xét duyệt/i)).toBeInTheDocument();
  });

  // TC-QBP-05: Revert approved course status
  test('TC-QBP-05: should revert approved parent course status to pending when updating a question', async () => {
    teacherTestService.getTestById.mockResolvedValue(mockTestApproved);
    teacherQuestionService.updateQuestion.mockResolvedValue({});
    teacherCourseService.updateCourse.mockResolvedValue({});
    auditLogService.logAction.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/teacher/tests/t-approved/questions']}>
        <Routes>
          <Route path="/teacher/tests/:id/questions" element={<QuestionBankPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mock Test Approved')).toBeInTheDocument();
    });

    // Click edit on the question to load it to form
    const editBtn = screen.getAllByRole('button').filter(btn => btn.className.includes('btn-light'))[0];
    fireEvent.click(editBtn);

    // Verify questionText is loaded
    expect(screen.getByDisplayValue('What is A?')).toBeInTheDocument();

    // Submit edits
    const submitBtn = screen.getByRole('button', { name: /Cập nhật/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Revert parent course
      expect(teacherCourseService.updateCourse).toHaveBeenCalledWith('c-approved', { status: 'pending' });
      // Update question
      expect(teacherQuestionService.updateQuestion).toHaveBeenCalled();
    });
  });
});
