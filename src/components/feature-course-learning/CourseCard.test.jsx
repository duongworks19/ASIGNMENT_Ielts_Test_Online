/**
 * TRACEABILITY MATRIX
 * -----------------------------------------------------------------------------------------
 * Test Case ID | Requirement / EARS Ref | Description
 * -----------------------------------------------------------------------------------------
 * TC_CC_01     | SPEC §3 CL-01, CL-03   | Render CourseCard with full happy path data.
 * TC_CC_02     | SPEC §9 Edge Cases     | Render correctly when price is 0 (Free).
 * TC_CC_03     | SPEC §9 Edge Cases     | Render correctly when thumbnail is missing (Fallback).
 * TC_CC_04     | EARS[Unwanted]         | Return null/prevent crash when course object is null.
 * TC_CC_05     | SPEC §3 CL-03          | Handle missing non-critical fields (teacherName, skill, level).
 * -----------------------------------------------------------------------------------------
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import CourseCard from './CourseCard';

const mockCourseHappyPath = {
  id: 'c-001',
  title: 'IELTS Writing Task 2 Masterclass',
  thumbnail: 'https://example.com/thumb.jpg',
  teacherName: 'John Doe',
  skill: 'Writing',
  level: 'Band 7.0+',
  price: 49.99,
  isPremium: true,
  enrolledCount: 1500,
  rating: 4.8
};

describe('CourseCard Component', () => {
  // TC_CC_01: Kiểm tra Happy Path với đầy đủ dữ liệu hợp lệ
  it('renders all course details correctly (Happy Path)', () => {
    render(<CourseCard course={mockCourseHappyPath} />);
    
    expect(screen.getByText('IELTS Writing Task 2 Masterclass')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Writing')).toBeInTheDocument();
    expect(screen.getByText('Band 7.0+')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText(/1500 enrolled/i)).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    expect(img).toHaveAttribute('alt', 'IELTS Writing Task 2 Masterclass');
  });

  // TC_CC_02: Edge case - Giá tiền là 0 (Khóa học miễn phí)
  it('displays "Free" badge when price is 0 and isPremium is false', () => {
    const freeCourse = { ...mockCourseHappyPath, price: 0, isPremium: false };
    render(<CourseCard course={freeCourse} />);
    
    const badge = screen.getByText('Free');
    expect(badge).toBeInTheDocument();
    // Bắt buộc phải có class bg-success cho khóa học Free
    expect(badge).toHaveClass('bg-success');
  });

  // TC_CC_03: Edge case - Khóa học không có hình ảnh thumbnail
  it('uses a fallback image when thumbnail is missing', () => {
    const noThumbCourse = { ...mockCourseHappyPath, thumbnail: undefined };
    render(<CourseCard course={noThumbCourse} />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://via.placeholder.com/300x200?text=No+Thumbnail');
  });

  // TC_CC_04: Unwanted pattern - Dữ liệu course bị null/undefined (ngăn crash UI)
  it('returns null and does not crash when course object is null', () => {
    const { container } = render(<CourseCard course={null} />);
    expect(container.firstChild).toBeNull();
  });

  // TC_CC_05: Missing Optional Fields - Các trường ko bắt buộc bị thiếu
  it('handles missing optional fields safely using fallbacks', () => {
    const minimalCourse = { id: 'c-002', title: 'Minimal Course' };
    render(<CourseCard course={minimalCourse} />);
    
    // Đảm bảo không crash và hiển thị fallback content
    expect(screen.getByText('Minimal Course')).toBeInTheDocument();
    expect(screen.getByText('Unknown Teacher')).toBeInTheDocument(); 
    expect(screen.getByText('General')).toBeInTheDocument(); 
    expect(screen.getByText('Beginner')).toBeInTheDocument(); 
    expect(screen.getByText('Free')).toBeInTheDocument(); 
  });
});
