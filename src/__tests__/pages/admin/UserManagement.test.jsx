/**
 * Traceability Matrix:
 * - ADM-USER-01: Render user list.
 * - ADM-USER-02: Filter and search users.
 * - ADM-USER-03: Change user role.
 * - ADM-USER-04: Change user status.
 * - ADM-USER-05: Delete user.
 * - Error Handling: Block modification of own account.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserManagement from '../../../pages/admin/UserManagement';
import { getUsers, updateUserRole, updateUserStatus, deleteUser } from '../../../services/adminService';

// Virtual mock since adminService might not be fully implemented
jest.mock('../../../services/adminService', () => ({
  getUsers: jest.fn(),
  updateUserRole: jest.fn(),
  updateUserStatus: jest.fn(),
  deleteUser: jest.fn(),
}), { virtual: true });

describe('UserManagement Page', () => {
  const mockUsers = [
    { id: 'u-admin-001', name: 'Admin 1', email: 'admin@test.com', role: 'admin', status: 'active', createdAt: '2026-06-01T00:00:00Z' },
    { id: 'u-student-001', name: 'Student 1', email: 'student@test.com', role: 'student', status: 'active', createdAt: '2026-06-02T00:00:00Z' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn(() => JSON.stringify({ id: 'u-admin-001' }));
    getUsers.mockResolvedValue({ data: mockUsers, headers: { 'x-total-count': '2' } });
  });

  it('should render user list (Happy Path ADM-USER-01)', async () => {
    render(<UserManagement />);
    
    // EARS[Event]: WHEN Admin fetches the user list...
    expect(getUsers).toHaveBeenCalledTimes(1);
    
    await waitFor(() => {
      expect(screen.getByText('Student 1')).toBeInTheDocument();
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    });
  });

  it('should filter users based on inputs (Happy Path ADM-USER-02)', async () => {
    render(<UserManagement />);
    await waitFor(() => screen.getByText('Student 1'));
    
    const searchInput = screen.getByPlaceholderText(/Search by name or email/i);
    fireEvent.change(searchInput, { target: { value: 'Student' } });
    
    const filterBtn = screen.getByRole('button', { name: /Filter/i });
    fireEvent.click(filterBtn);
    
    expect(getUsers).toHaveBeenCalledWith(expect.objectContaining({ q: 'Student' }));

    await waitFor(() => {
      expect(screen.getByText('Student 1')).toBeInTheDocument();
    });
  });

  it('should disable manage button for current admin (Error Case / Unwanted Pattern)', async () => {
    render(<UserManagement />);
    await waitFor(() => screen.getByText('Admin 1'));
    
    // EARS[Unwanted]: WHERE Admin attempts to change their own role or status...
    const rows = screen.getAllByRole('row');
    const adminRow = rows.find(r => within(r).queryByText('Admin 1'));
    const manageBtn = within(adminRow).getByRole('button', { name: /Manage/i });
    
    expect(manageBtn).toBeDisabled();
  });

  it('should open confirm modal and call update role (Happy Path ADM-USER-03)', async () => {
    updateUserRole.mockResolvedValue({});
    render(<UserManagement />);
    await waitFor(() => screen.getByText('Student 1'));
    
    const rows = screen.getAllByRole('row');
    const studentRow = rows.find(r => within(r).queryByText('Student 1'));
    const manageBtn = within(studentRow).getByRole('button', { name: /Manage/i });
    
    fireEvent.click(manageBtn);
    const makeTeacherBtn = screen.getByText('Make Teacher');
    fireEvent.click(makeTeacherBtn);
    
    const confirmBtn = await screen.findByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
      expect(updateUserRole).toHaveBeenCalledWith('u-student-001', 'teacher');
    });

    // Wait for the re-fetch to complete
    await waitFor(() => {
      expect(getUsers).toHaveBeenCalledTimes(2);
    });
  });

  it('should open confirm modal and call update status (Happy Path ADM-USER-04)', async () => {
    updateUserStatus.mockResolvedValue({});
    render(<UserManagement />);
    await waitFor(() => screen.getByText('Student 1'));
    
    const rows = screen.getAllByRole('row');
    const studentRow = rows.find(r => within(r).queryByText('Student 1'));
    const manageBtn = within(studentRow).getByRole('button', { name: /Manage/i });
    
    fireEvent.click(manageBtn);
    const lockBtn = screen.getByText('Lock Account');
    fireEvent.click(lockBtn);
    
    const confirmBtn = await screen.findByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
      expect(updateUserStatus).toHaveBeenCalledWith('u-student-001', 'locked', expect.any(String));
    });

    // Wait for the re-fetch to complete
    await waitFor(() => {
      expect(getUsers).toHaveBeenCalledTimes(2);
    });
  });

  it('should call delete API (Happy Path ADM-USER-05)', async () => {
    deleteUser.mockResolvedValue({});
    render(<UserManagement />);
    await waitFor(() => screen.getByText('Student 1'));
    
    const rows = screen.getAllByRole('row');
    const studentRow = rows.find(r => within(r).queryByText('Student 1'));
    const manageBtn = within(studentRow).getByRole('button', { name: /Manage/i });
    
    fireEvent.click(manageBtn);
    const deleteBtn = screen.getByText('Delete User');
    fireEvent.click(deleteBtn);
    
    const confirmBtn = await screen.findByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmBtn);
    
    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith('u-student-001');
    });

    // Wait for the re-fetch to complete
    await waitFor(() => {
      expect(getUsers).toHaveBeenCalledTimes(2);
    });
  });
});
