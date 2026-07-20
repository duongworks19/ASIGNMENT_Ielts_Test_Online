/**
 * CourseManagement.test.jsx — T015: UI/UX Verification cho CourseManagement Page
 *
 * Traceability Matrix:
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ Test ID    │ EARS Ref      │ Scenario                                        │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ T015-C01   │ NFR-UI        │ Render loading spinner khi đang fetch data      │
 * │ T015-C02   │ NFR-UI        │ Empty state hiển thị khi không có khóa học      │
 * │ T015-C03   │ ADM-CONTENT   │ Hiển thị bảng courses khi có dữ liệu            │
 * │ T015-C04   │ ADM-CONTENT   │ Filter bar render đủ: search, skill, status     │
 * │ T015-C05   │ ADM-CONTENT   │ Badge count hiển thị số lượng courses           │
 * │ T015-C06   │ ADM-CONTENT   │ Status badge: approved/pending/rejected         │
 * │ T015-C07   │ Event-driven  │ Dropdown Manage button tồn tại cho mỗi course   │
 * │ T015-C08   │ Error path    │ Alert hiển thị khi API thất bại                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseManagement from '../../../pages/admin/CourseManagement';
import { getCourses, updateCourse, deleteCourse } from '../../../services/adminService';

jest.mock('../../../services/adminService', () => ({
  getCourses: jest.fn(),
  updateCourse: jest.fn(),
  deleteCourse: jest.fn(),
}), { virtual: true });

// Mock ConfirmModal để tránh render tree sâu
jest.mock('../../../components/common/ConfirmModal', () => {
  return function MockConfirmModal({ isOpen, title, onConfirm, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-confirm-modal">
        <span>{title}</span>
        <button onClick={onConfirm} data-testid="confirm-btn">Confirm</button>
        <button onClick={onClose} data-testid="cancel-btn">Cancel</button>
      </div>
    );
  };
});

const mockCourses = [
  {
    id: 'course-001',
    title: 'IELTS Reading Foundation',
    skill: 'Reading',
    level: 'Beginner',
    price: 0,
    status: 'approved',
    enrolledCount: 120,
    createdAt: '2026-06-01T08:00:00Z',
  },
  {
    id: 'course-002',
    title: 'IELTS Listening Advanced',
    skill: 'Listening',
    level: 'Intermediate',
    price: 299000,
    status: 'pending',
    enrolledCount: 85,
    createdAt: '2026-06-03T08:00:00Z',
  },
];

describe('T015 — CourseManagement UI/UX Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // T015-C01: Spinner khi loading
  it('T015-C01: Hiển thị loading spinner khi đang fetch dữ liệu', async () => {
    // Delay để giữ loading state
    getCourses.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<CourseManagement />);
    expect(container.querySelector('.spinner-border')).toBeInTheDocument();
  });


  // T015-C02: Empty state khi không có dữ liệu
  it('T015-C02: Hiển thị empty state khi danh sách khóa học rỗng', async () => {
    getCourses.mockResolvedValue([]);
    render(<CourseManagement />);
    await waitFor(() => {
      expect(screen.getByText(/Không có khóa học nào phù hợp với bộ lọc/i)).toBeInTheDocument();
    });
  });

  // T015-C03: Hiển thị bảng khi có data
  it('T015-C03: Hiển thị danh sách courses trong bảng khi có dữ liệu', async () => {
    getCourses.mockResolvedValue(mockCourses);
    render(<CourseManagement />);
    await waitFor(() => {
      expect(screen.getByText('IELTS Reading Foundation')).toBeInTheDocument();
      expect(screen.getByText('IELTS Listening Advanced')).toBeInTheDocument();
    });
  });

  // T015-C04: Filter bar đủ các control
  it('T015-C04: Filter bar render đủ input search, select skill, select status', async () => {
    getCourses.mockResolvedValue([]);
    render(<CourseManagement />);
    expect(screen.getByPlaceholderText(/Tìm kiếm theo tên khóa học/i)).toBeInTheDocument();
    expect(screen.getByText('Tất cả kỹ năng')).toBeInTheDocument();
    expect(screen.getByText('Tất cả trạng thái')).toBeInTheDocument();
  });

  // T015-C05: Badge count
  it('T015-C05: Badge hiển thị tổng số khóa học', async () => {
    getCourses.mockResolvedValue(mockCourses);
    render(<CourseManagement />);
    await waitFor(() => {
      expect(screen.getByText('2 Khóa học')).toBeInTheDocument();
    });
  });

  // T015-C06: Status badges
  it('T015-C06: Hiển thị đúng badge trạng thái cho approved và pending', async () => {
    getCourses.mockResolvedValue(mockCourses);
    render(<CourseManagement />);
    await waitFor(() => {
      const approvedBadges = screen.getAllByText('approved');
      const pendingBadges = screen.getAllByText('pending');
      expect(approvedBadges.length).toBeGreaterThan(0);
      expect(pendingBadges.length).toBeGreaterThan(0);
    });
  });

  // T015-C07: Dropdown Manage tồn tại
  it('T015-C07: Mỗi course có dropdown Manage button', async () => {
    getCourses.mockResolvedValue(mockCourses);
    render(<CourseManagement />);
    await waitFor(() => {
      const manageBtns = screen.getAllByText('Quản lý');
      expect(manageBtns).toHaveLength(2);
    });
  });

  // T015-C08: Error state
  it('T015-C08: Hiển thị Alert khi API thất bại', async () => {
    getCourses.mockRejectedValue(new Error('Network Error'));
    render(<CourseManagement />);
    await waitFor(() => {
      expect(screen.getByText(/Không thể tải danh sách khóa học/i)).toBeInTheDocument();
    });
  });
});
