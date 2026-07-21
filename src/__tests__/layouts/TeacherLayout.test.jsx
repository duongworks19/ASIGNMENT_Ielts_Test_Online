import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { __mockNavigate, useNavigate } from 'react-router-dom';
import TeacherLayout from '../../layouts/TeacherLayout';

const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

describe('TeacherLayout with AuthContext', () => {
  const logout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(__mockNavigate);
    mockUseAuth.mockReturnValue({
      user: { id: 'u-teacher-001', fullName: 'IELTS Mentor', role: 'teacher', status: 'active' },
      logout,
    });
  });

  test('renders Teacher identity and links to shared profile', () => {
    render(<TeacherLayout />);
    expect(screen.getByText('IELTS Mentor')).toBeInTheDocument();
    expect(document.querySelector('a[href="/teacher/students"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/teacher/profile"]')).toBeInTheDocument();
    expect(screen.getByTestId('router-outlet')).toBeInTheDocument();
  });

  test('logs out through AuthContext', () => {
    render(<TeacherLayout />);
    fireEvent.click(screen.getByRole('button', { name: /Đăng xuất/i }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(__mockNavigate).toHaveBeenCalledWith('/login');
  });
});
