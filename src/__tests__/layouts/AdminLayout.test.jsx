import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { __mockNavigate, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';

const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => mockUseAuth() }));

describe('AdminLayout with AuthContext', () => {
  const logout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(__mockNavigate);
    mockUseAuth.mockReturnValue({
      user: { id: 'u-admin-001', fullName: 'System Admin', role: 'admin', status: 'active' },
      logout,
    });
  });

  test('renders Admin identity, management navigation, shared profile and outlet', () => {
    render(<AdminLayout />);
    expect(screen.getByText('System Admin')).toBeInTheDocument();
    expect(document.querySelector('a[href="/admin/dashboard"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/admin/users"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/admin/profile"]')).toBeInTheDocument();
    expect(screen.getByTestId('router-outlet')).toBeInTheDocument();
  });

  test('logout clears AuthContext session and navigates to login', () => {
    render(<AdminLayout />);
    fireEvent.click(screen.getByRole('button', { name: /Đăng xuất/i }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(__mockNavigate).toHaveBeenCalledWith('/login');
  });
});
