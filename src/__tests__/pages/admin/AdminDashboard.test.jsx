import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../../../pages/admin/AdminDashboard';
import { getDashboardSummary } from '../../../services/adminService';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-admin-001', fullName: 'System Admin', role: 'admin', status: 'active' } }),
}));
jest.mock('../../../services/adminService', () => ({ getDashboardSummary: jest.fn() }));

describe('AdminDashboard Auth/Admin regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDashboardSummary.mockResolvedValue({
      stats: { totalUsers: 12, totalCourses: 3, pendingContent: 2, totalLogs: 82 },
      recentLogs: [
        { id: 'log-1', actorId: 'u-admin-001', action: 'CREATE_USER', targetType: 'user', targetId: 'u-2', newValue: { role: 'student' }, createdAt: '2026-07-20T00:00:00.000Z' },
      ],
      generatedAt: '2026-07-20T00:00:01.000Z',
    });
  });

  test('uses the protected dashboard summary and displays real totals plus recent audit actor', async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(getDashboardSummary).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('u-admin-001')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  test('shows a bounded user-facing error when a protected request fails', async () => {
    getDashboardSummary.mockRejectedValue(new Error('Không thể tải dữ liệu tổng quan quản trị.'));
    render(<AdminDashboard />);
    expect(await screen.findByText('Không thể tải dữ liệu tổng quan quản trị.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử tải lại' })).toBeInTheDocument();
  });
});
