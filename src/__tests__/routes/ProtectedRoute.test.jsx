import React from 'react';
import { render, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import ProtectedRoute from '../../routes/ProtectedRoute';

const mockUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const activeUser = (role) => ({ id: `u-${role}`, role, status: 'active' });

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useLocation.mockReturnValue({ pathname: '/admin/users', search: '', state: null, key: 'test' });
  });

  test('shows session bootstrap loading state', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, isInitializing: true, logout: jest.fn() });
    render(<ProtectedRoute allowedRoles={['admin']} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('redirects anonymous visitor to login and keeps intended location', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, isInitializing: false, logout: jest.fn() });
    render(<ProtectedRoute allowedRoles={['admin']} />);
    expect(screen.getByTestId('router-navigate')).toHaveAttribute('data-to', '/login');
    expect(screen.getByTestId('router-navigate').getAttribute('data-state')).toContain('/admin/users');
  });

  test.each(['student', 'teacher'])('%s cannot enter an Admin route', (role) => {
    mockUseAuth.mockReturnValue({ user: activeUser(role), isAuthenticated: true, isInitializing: false, logout: jest.fn() });
    render(<ProtectedRoute allowedRoles={['admin']} />);
    expect(screen.getByTestId('router-navigate')).toHaveAttribute('data-to', '/403');
  });

  test('Admin can enter an Admin route', () => {
    mockUseAuth.mockReturnValue({ user: activeUser('admin'), isAuthenticated: true, isInitializing: false, logout: jest.fn() });
    render(<ProtectedRoute allowedRoles={['admin']} />);
    expect(screen.getByTestId('router-outlet')).toBeInTheDocument();
  });

  test('Admin cannot enter a Teacher-only route', () => {
    mockUseAuth.mockReturnValue({ user: activeUser('admin'), isAuthenticated: true, isInitializing: false, logout: jest.fn() });
    render(<ProtectedRoute allowedRoles={['teacher']} />);
    expect(screen.getByTestId('router-navigate')).toHaveAttribute('data-to', '/403');
  });

  test('forged legacy localStorage user cannot bypass missing token-backed context', () => {
    localStorage.setItem('ielts_auth_user', JSON.stringify({ id: 'fake', role: 'admin', status: 'active' }));
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, isInitializing: false, logout: jest.fn() });
    render(<ProtectedRoute allowedRoles={['admin']} />);
    expect(screen.getByTestId('router-navigate')).toHaveAttribute('data-to', '/login');
  });

  test.each(['locked', 'banned'])('logs out and blocks a %s account', (status) => {
    const logout = jest.fn();
    mockUseAuth.mockReturnValue({
      user: { id: 'u-1', role: 'student', status },
      isAuthenticated: true,
      isInitializing: false,
      logout,
    });
    render(<ProtectedRoute allowedRoles={['student']} />);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('router-navigate')).toHaveAttribute('data-to', '/login');
  });
});
