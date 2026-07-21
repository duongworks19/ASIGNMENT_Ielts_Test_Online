import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { __mockNavigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ForgotPassword from '../../../pages/guest/ForgotPassword';
import Login from '../../../pages/guest/Login';
import Register from '../../../pages/guest/Register';
import ResetPassword from '../../../pages/guest/ResetPassword';
import { requestPasswordReset, resetPassword } from '../../../services/authService';

const mockUseAuth = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../services/authService', () => {
  const actual = jest.requireActual('../../../services/authService');
  return {
    ...actual,
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  };
});

const change = (selector, value) => fireEvent.change(document.querySelector(selector), { target: { value } });

describe('Auth pages', () => {
  const login = jest.fn();
  const register = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn();
    mockUseAuth.mockReturnValue({ login, register });
    useNavigate.mockReturnValue(__mockNavigate);
    useLocation.mockReturnValue({ pathname: '/login', state: null, search: '', key: 'test' });
    useSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
  });

  test('Login normalizes email and redirects Student to its own dashboard', async () => {
    login.mockResolvedValue({ id: 'u-1', role: 'student', status: 'active' });
    render(<Login />);
    change('input[name="email"]', ' Student@Example.COM ');
    change('input[name="password"]', 'StrongPass1');
    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => expect(login).toHaveBeenCalledWith('student@example.com', 'StrongPass1'));
    expect(__mockNavigate).toHaveBeenCalledWith('/learning', { replace: true });
    expect(document.querySelector('a[href="/forgot-password"]')).toBeInTheDocument();
  });

  test('Login never redirects a Student back to an Admin URL', async () => {
    login.mockResolvedValue({ id: 'u-1', role: 'student', status: 'active' });
    useLocation.mockReturnValue({ pathname: '/login', state: { from: { pathname: '/admin/users' } }, search: '', key: 'test' });
    render(<Login />);
    change('input[name="email"]', 'student@example.com');
    change('input[name="password"]', 'StrongPass1');
    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => expect(__mockNavigate).toHaveBeenCalledWith('/learning', { replace: true }));
  });

  test('Login always redirects an Admin to the Admin dashboard', async () => {
    login.mockResolvedValue({ id: 'u-admin-001', role: 'admin', status: 'active' });
    useLocation.mockReturnValue({ pathname: '/login', state: { from: { pathname: '/admin/users' } }, search: '', key: 'test' });
    render(<Login />);
    change('input[name="email"]', 'admin@ieltslearning.com');
    change('input[name="password"]', '12345678');
    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => expect(__mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true }));
  });

  test('Register rejects invalid email, weak/mismatched password and impossible date', async () => {
    render(<Register />);
    change('input[name="lastName"]', 'Nguyễn');
    change('input[name="firstName"]', 'An');
    change('input[name="email"]', 'not-an-email');
    change('input[name="password"]', 'weak');
    change('input[name="confirmPassword"]', 'different');
    change('select[name="day"]', '31');
    change('select[name="month"]', '2');
    change('select[name="year"]', '2000');
    fireEvent.submit(document.querySelector('form'));

    expect(register).not.toHaveBeenCalled();
    expect(document.querySelector('input[name="email"]')).toHaveClass('is-invalid');
    expect(document.querySelector('input[name="password"]')).toHaveClass('is-invalid');
    expect(document.querySelector('input[name="confirmPassword"]')).toHaveClass('is-invalid');
  });

  test('Register sends a trimmed, normalized Student registration payload', async () => {
    register.mockResolvedValue({ id: 'u-new', role: 'student' });
    render(<Register />);
    change('input[name="lastName"]', '  Nguyễn Văn ');
    change('input[name="firstName"]', ' An ');
    change('input[name="email"]', ' NEW@EXAMPLE.COM ');
    change('input[name="password"]', 'StrongPass1');
    change('input[name="confirmPassword"]', 'StrongPass1');
    change('select[name="day"]', '9');
    change('select[name="month"]', '2');
    change('select[name="year"]', '2000');
    fireEvent.click(document.querySelector('input[name="agreeTerms"]'));
    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => expect(register).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'StrongPass1',
      confirmPassword: 'StrongPass1',
      fullName: 'Nguyễn Văn An',
      dateOfBirth: '2000-02-09',
    }));
    expect(register.mock.calls[0][0]).not.toHaveProperty('role');
    expect(register.mock.calls[0][0]).not.toHaveProperty('status');
    expect(__mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: { registered: true } });
  });

  test('Forgot Password validates email and normalizes a valid request', async () => {
    requestPasswordReset.mockResolvedValue({ message: 'Nếu email tồn tại, hướng dẫn đã được tạo.' });
    const { rerender } = render(<ForgotPassword />);
    const email = document.querySelector('#forgotEmail');
    fireEvent.change(email, { target: { value: 'invalid' } });
    fireEvent.submit(email.closest('form'));
    expect(requestPasswordReset).not.toHaveBeenCalled();
    expect(email).toHaveClass('is-invalid');

    fireEvent.change(email, { target: { value: ' User@Example.COM ' } });
    fireEvent.submit(email.closest('form'));
    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith('user@example.com'));
    rerender(<ForgotPassword />);
    expect(screen.getByText(/Nếu email tồn tại/)).toBeInTheDocument();
  });

  test('Reset Password rejects missing token, weak password and mismatched confirmation', () => {
    const { rerender } = render(<ResetPassword />);
    expect(document.querySelector('form')).not.toBeInTheDocument();

    useSearchParams.mockReturnValue([new URLSearchParams('token=demo-token'), jest.fn()]);
    rerender(<ResetPassword />);
    change('#newPassword', 'weak');
    change('#confirmPassword', 'different');
    fireEvent.submit(document.querySelector('form'));
    expect(resetPassword).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('Reset Password submits the URL token and matching strong password', async () => {
    useSearchParams.mockReturnValue([new URLSearchParams('token=one-time-token'), jest.fn()]);
    resetPassword.mockResolvedValue({ message: 'Đặt lại mật khẩu thành công.' });
    render(<ResetPassword />);
    change('#newPassword', 'NewStrong1');
    change('#confirmPassword', 'NewStrong1');
    fireEvent.submit(document.querySelector('form'));

    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith({
      token: 'one-time-token',
      newPassword: 'NewStrong1',
      confirmPassword: 'NewStrong1',
    }));
    expect(await screen.findByText(/Đặt lại mật khẩu thành công/)).toBeInTheDocument();
  });
});
