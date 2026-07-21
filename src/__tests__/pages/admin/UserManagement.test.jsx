import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import UserManagement from '../../../pages/admin/UserManagement';
import { createUser, deleteUser, getUsers, updateUser, updateUserStatus } from '../../../services/adminService';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-admin-001', role: 'admin', email: 'admin@test.com' } }),
}));
jest.mock('../../../services/adminService', () => ({
  createUser: jest.fn(), deleteUser: jest.fn(), getUsers: jest.fn(), updateUser: jest.fn(), updateUserStatus: jest.fn(),
}));
jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));

const users = [
  { id: 'u-admin-001', fullName: 'Admin One', email: 'admin@test.com', role: 'admin', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'u-student-001', fullName: 'Student One', email: 'student@test.com', role: 'student', status: 'active', createdAt: '2026-02-01T00:00:00Z' },
];

describe('UserManagement behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUsers.mockResolvedValue({ data: users, total: 12, page: 1, pageSize: 10, totalPages: 2 });
    createUser.mockResolvedValue({ id: 'u-student-010' });
    updateUser.mockResolvedValue({});
    updateUserStatus.mockResolvedValue({});
    deleteUser.mockResolvedValue({ message: 'ok' });
  });

  test('renders sanitized list, total and real pagination', async () => {
    render(<UserManagement />);
    expect(await screen.findByText('Student One')).toBeInTheDocument();
    expect(screen.getByText('Tổng số: 12')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeEnabled();
  });

  test('search and role/status filters are sent to the service', async () => {
    render(<UserManagement />);
    await screen.findByText('Student One');
    fireEvent.change(screen.getByLabelText('Tìm theo tên hoặc email'), { target: { name: 'q', value: 'student' } });
    fireEvent.change(screen.getByLabelText('Lọc theo role'), { target: { name: 'role', value: 'student' } });
    fireEvent.change(screen.getByLabelText('Lọc theo status'), { target: { name: 'status', value: 'active' } });
    await waitFor(() => expect(getUsers).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'student', role: 'student', status: 'active', page: 1 })));
  });

  test('adds a Student with validated fields and no Admin create option', async () => {
    render(<UserManagement />);
    await screen.findByText('Student One');
    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
    expect(within(screen.getByLabelText('Role')).queryByRole('option', { name: 'Admin' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'New Student' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' NEW@EXAMPLE.COM ' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu ban đầu'), { target: { value: 'StrongPass1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'New Student', email: 'new@example.com', role: 'student', password: 'StrongPass1' })));
  });

  test('shows field validation instead of submitting weak password', async () => {
    render(<UserManagement />);
    await screen.findByText('Student One');
    fireEvent.click(screen.getByRole('button', { name: /Add User/i }));
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'New Student' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu ban đầu'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(await screen.findByText(/Mật khẩu cần ít nhất 8 ký tự/i)).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });

  test('edits user information and role', async () => {
    render(<UserManagement />);
    const student = await screen.findByText('Student One');
    const row = student.closest('tr');
    fireEvent.click(within(row).getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Teacher One' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'teacher' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith('u-student-001', expect.objectContaining({ fullName: 'Teacher One', role: 'teacher' })));
  });

  test('current admin cannot open destructive status menu or change own role', async () => {
    render(<UserManagement />);
    const adminCell = await screen.findByText('Admin One');
    const row = adminCell.closest('tr');
    expect(within(row).getByRole('button', { name: 'Status' })).toBeDisabled();
    fireEvent.click(within(row).getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Role')).toBeDisabled();
    expect(screen.getByLabelText('Status')).toBeDisabled();
  });

  test('locks another user after confirmation', async () => {
    render(<UserManagement />);
    const row = (await screen.findByText('Student One')).closest('tr');
    fireEvent.click(within(row).getByRole('button', { name: 'Status' }));
    fireEvent.click(await screen.findByText('Lock 24 hours'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(updateUserStatus).toHaveBeenCalledWith('u-student-001', 'locked', expect.any(String)));
  });

  test('surfaces API errors and always ends loading', async () => {
    getUsers.mockRejectedValue(new Error('Server unavailable'));
    render(<UserManagement />);
    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Đang tải người dùng...')).not.toBeInTheDocument();
  });
});
