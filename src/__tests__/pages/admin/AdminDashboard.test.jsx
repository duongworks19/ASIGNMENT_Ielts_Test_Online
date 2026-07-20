/**
 * Traceability Matrix:
 * - ADM-CONTENT (T012): Render Overview tab with 4 stat cards.
 * - ADM-CONTENT (T013): Render Approvals Queue tab with pending content.
 * - ADM-CONTENT (T013): Click review to open ApprovalDetailModal.
 * - ADM-AUDIT (T014): Render Audit Logs tab with action log list.
 * - ADM-AUDIT (T014): Filter logs by action type, target type, and actor ID.
 * - ADM-AUDIT (T014): Paginate logs showing 10 items per page.
 * - Error Handling: Handle API errors gracefully on dashboard stats, queue fetch, and audit logs.
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../../../pages/admin/AdminDashboard';
import { getUsers, getApprovalRequests, getAuditLogs } from '../../../services/adminService';
import axios from 'axios';


// Virtual mocks
jest.mock('../../../services/adminService', () => ({
  getUsers: jest.fn(),
  getApprovalRequests: jest.fn(),
  getAuditLogs: jest.fn(),
}), { virtual: true });

jest.mock('axios');

// Mock ApprovalDetailModal to prevent it from rendering deep tree
jest.mock('../../../components/feature/admin/ApprovalDetailModal', () => {
  return function MockApprovalModal({ isOpen, request, onActionSuccess }) {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-approval-modal">
        Modal Open for {request?.targetId}
        <button onClick={() => onActionSuccess('approve')}>Simulate Success</button>
      </div>
    );
  };
});

describe('AdminDashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- T012 Tests (Overview Tab) ---
  it('should render all 3 tabs', async () => {
    getUsers.mockResolvedValue({ headers: { 'x-total-count': '0' } });
    getApprovalRequests.mockResolvedValue([]);
    getAuditLogs.mockResolvedValue({ headers: { 'x-total-count': '0' } });
    axios.get.mockResolvedValue({ headers: { 'x-total-count': '0' } });


    render(<AdminDashboard />);
    
    expect(screen.getByRole('tab', { name: /System Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Approvals Queue/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Audit Logs/i })).toBeInTheDocument();
  });

  it('should fetch and display stats successfully (Happy Path)', async () => {
    getUsers.mockResolvedValue({ headers: { 'x-total-count': '150' } });
    axios.get.mockImplementation((url) => {
      if (url.includes('/approvalRequests')) return Promise.resolve({ headers: { 'x-total-count': '3' } });
      if (url.includes('/auditLogs')) return Promise.resolve({ headers: { 'x-total-count': '500' } });
      if (url.includes('/courses')) return Promise.resolve({ headers: { 'x-total-count': '25' } });
      return Promise.resolve({ headers: { 'x-total-count': '0' } });
    });


    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total Users
      expect(screen.getByText('25')).toBeInTheDocument(); // Courses
      expect(screen.getByText('3')).toBeInTheDocument(); // Pending Content
      expect(screen.getAllByText('Audit Logs').length).toBeGreaterThan(0);
    });
  });

  it('should handle API fetch error gracefully (Error Path)', async () => {
    getUsers.mockRejectedValue(new Error('Network Error'));
    axios.get.mockRejectedValue(new Error('Network Error'));


    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard statistics. Please try again later.')).toBeInTheDocument();
    });
  });

  // --- T013 Tests (Approvals Queue Tab) ---
  it('should fetch and display pending queue when Approvals tab is clicked', async () => {
    // Setup for initial overview load
    getUsers.mockResolvedValue({ headers: { 'x-total-count': '0' } });
    axios.get.mockResolvedValue({ headers: { 'x-total-count': '0' } });

    
    // First load for overview
    getApprovalRequests.mockResolvedValue([{}, {}]); 
    
    render(<AdminDashboard />);
    
    // Switch to Approvals Tab
    const queueTab = screen.getByRole('tab', { name: /Approvals Queue/i });
    
    // EARS[State-driven]: WHILE content status is pending, THE system SHALL display it in the approvals queue
    // Mock return for queue tab
    const mockQueue = [
      { id: 'req-1', targetType: 'course', targetId: 'course-1', teacherId: 't-1', createdAt: '2026-06-01T00:00:00Z' }
    ];
    getApprovalRequests.mockResolvedValueOnce(mockQueue);
    
    fireEvent.click(queueTab);

    await waitFor(() => {
      expect(screen.getByText('course-1')).toBeInTheDocument();
      expect(screen.getByText('t-1')).toBeInTheDocument();
    });
  });

  it('should handle error when fetching pending queue', async () => {
    render(<AdminDashboard />);
    
    getApprovalRequests.mockRejectedValueOnce(new Error('Queue Error'));
    
    const queueTab = screen.getByRole('tab', { name: /Approvals Queue/i });
    fireEvent.click(queueTab);

    await waitFor(() => {
      expect(screen.getByText('Failed to load pending requests. Please try again later.')).toBeInTheDocument();
    });
  });

  it('should open ApprovalDetailModal when Review button is clicked', async () => {
    getApprovalRequests.mockResolvedValue([{ id: 'req-1', targetType: 'course', targetId: 'course-1' }]);
    
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole('tab', { name: /Approvals Queue/i }));

    await waitFor(() => {
      expect(screen.getByText('course-1')).toBeInTheDocument();
    });

    const reviewBtn = screen.getByRole('button', { name: /Review/i });
    fireEvent.click(reviewBtn);

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByTestId('mock-approval-modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Open for course-1')).toBeInTheDocument();
    });
  });

  it('should refresh queue after modal action is successful', async () => {
    // Initial fetch
    getApprovalRequests.mockResolvedValue([{ id: 'req-1', targetType: 'course', targetId: 'course-1' }]);
    
    render(<AdminDashboard />);
    fireEvent.click(screen.getByRole('tab', { name: /Approvals Queue/i }));

    await waitFor(() => {
      expect(screen.getByText('course-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Review/i }));

    // Mock next fetch after action success (empty queue)
    getApprovalRequests.mockResolvedValueOnce([]);

    // Trigger action success
    const simulateBtn = await screen.findByText('Simulate Success');
    fireEvent.click(simulateBtn);

    await waitFor(() => {
      expect(screen.getByText('No pending content to review.')).toBeInTheDocument();
    });
  });

  // --- T014 Tests (Audit Logs Tab) ---
  it('should fetch and display audit logs when Audit Logs tab is clicked (Happy Path)', async () => {
    getUsers.mockResolvedValue({ headers: { 'x-total-count': '0' } });
    getApprovalRequests.mockResolvedValue([]);
    axios.get.mockResolvedValue({ headers: { 'x-total-count': '0' } });
    
    const mockLogs = [
      {
        id: 'log-1',
        actorId: 'u-admin-001',
        action: 'CHANGE_USER_STATUS',
        targetType: 'user',
        targetId: 'u-student-003',
        oldValue: { status: 'active' },
        newValue: { status: 'locked' },
        createdAt: '2026-06-09T08:00:00Z'
      },
      {
        id: 'log-2',
        actorId: 'u-admin-002',
        action: 'APPROVE_CONTENT',
        targetType: 'course',
        targetId: 'course-006',
        createdAt: '2026-06-10T12:00:00Z'
      }
    ];
    getAuditLogs.mockResolvedValue(mockLogs);

    render(<AdminDashboard />);
    
    const logsTab = screen.getByRole('tab', { name: /Audit Logs/i });
    fireEvent.click(logsTab);

    // Wait for the mock call to complete and elements to appear
    await waitFor(() => {
      expect(getAuditLogs).toHaveBeenCalled();
      expect(screen.getByText('u-admin-001')).toBeInTheDocument();
    });

    expect(screen.getByText('u-admin-002')).toBeInTheDocument();
    expect(screen.getAllByText('Status Change').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Approve').length).toBeGreaterThan(0);
    expect(screen.getByText('Changed status of user u-student-003 from "active" to "locked"')).toBeInTheDocument();
    expect(screen.getByText('Approved content with ID course-006')).toBeInTheDocument();
  });

  it('should filter logs by action, target type, and actor ID', async () => {
    getUsers.mockResolvedValue({ headers: { 'x-total-count': '0' } });
    getApprovalRequests.mockResolvedValue([]);
    axios.get.mockResolvedValue({ headers: { 'x-total-count': '0' } });
    
    const mockLogs = [
      {
        id: 'log-1',
        actorId: 'u-admin-001',
        action: 'CHANGE_USER_STATUS',
        targetType: 'user',
        targetId: 'u-student-003',
        oldValue: { status: 'active' },
        newValue: { status: 'locked' },
        createdAt: '2026-06-09T08:00:00Z'
      },
      {
        id: 'log-2',
        actorId: 'u-admin-002',
        action: 'APPROVE_CONTENT',
        targetType: 'course',
        targetId: 'course-006',
        createdAt: '2026-06-10T12:00:00Z'
      }
    ];
    getAuditLogs.mockResolvedValue(mockLogs);

    render(<AdminDashboard />);
    
    const logsTab = screen.getByRole('tab', { name: /Audit Logs/i });
    fireEvent.click(logsTab);

    await waitFor(() => {
      expect(screen.getByText('u-admin-001')).toBeInTheDocument();
    });

    // Filter by Action: APPROVE_CONTENT
    const actionSelect = screen.getByLabelText(/Action Type/i);
    fireEvent.change(actionSelect, { target: { value: 'APPROVE_CONTENT' } });
    
    expect(screen.queryByText('u-admin-001')).not.toBeInTheDocument();
    expect(screen.getByText('u-admin-002')).toBeInTheDocument();

    // Reset action and filter by Target Type: user
    fireEvent.change(actionSelect, { target: { value: 'all' } });
    const targetSelect = screen.getByLabelText(/Target Type/i);
    fireEvent.change(targetSelect, { target: { value: 'user' } });

    expect(screen.getByText('u-admin-001')).toBeInTheDocument();
    expect(screen.queryByText('u-admin-002')).not.toBeInTheDocument();

    // Reset target and filter by Actor ID
    fireEvent.change(targetSelect, { target: { value: 'all' } });
    const actorInput = screen.getByPlaceholderText(/Search by Actor ID.../i);
    fireEvent.change(actorInput, { target: { value: 'admin-002' } });

    expect(screen.queryByText('u-admin-001')).not.toBeInTheDocument();
    expect(screen.getByText('u-admin-002')).toBeInTheDocument();
  });

  it('should paginate audit logs showing 10 items per page', async () => {
    getUsers.mockResolvedValue({ headers: { 'x-total-count': '0' } });
    getApprovalRequests.mockResolvedValue([]);
    axios.get.mockResolvedValue({ headers: { 'x-total-count': '0' } });
    
    // Create 12 logs
    const mockLogs = Array.from({ length: 12 }, (_, i) => ({
      id: `log-${i + 1}`,
      actorId: `u-admin-${i + 1}`,
      action: 'APPROVE_CONTENT',
      targetType: 'course',
      targetId: `course-${i + 1}`,
      createdAt: new Date(2026, 5, 9, 8, i).toISOString()
    }));
    getAuditLogs.mockResolvedValue(mockLogs);

    render(<AdminDashboard />);
    
    const logsTab = screen.getByRole('tab', { name: /Audit Logs/i });
    fireEvent.click(logsTab);

    // Wait for page load (logs are sorted desc, so u-admin-12 is at the top)
    await waitFor(() => {
      expect(screen.getByText('u-admin-12')).toBeInTheDocument();
    });

    // Check first page items
    expect(screen.getByText('u-admin-12')).toBeInTheDocument();
    expect(screen.getByText('u-admin-3')).toBeInTheDocument();
    expect(screen.queryByText('u-admin-2')).not.toBeInTheDocument(); // should be on page 2
    expect(screen.queryByText('u-admin-1')).not.toBeInTheDocument(); // should be on page 2

    // Click next page
    const page2Link = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Link);

    // Check second page items
    await waitFor(() => {
      expect(screen.queryByText('u-admin-12')).not.toBeInTheDocument();
      expect(screen.getByText('u-admin-2')).toBeInTheDocument();
      expect(screen.getByText('u-admin-1')).toBeInTheDocument();
    });
  });

  it('should display error message when fetching audit logs fails', async () => {
    getUsers.mockResolvedValue({ headers: { 'x-total-count': '0' } });
    getApprovalRequests.mockResolvedValue([]);
    axios.get.mockResolvedValue({ headers: { 'x-total-count': '0' } });
    getAuditLogs.mockRejectedValue(new Error('Audit log error'));

    render(<AdminDashboard />);
    
    const logsTab = screen.getByRole('tab', { name: /Audit Logs/i });
    fireEvent.click(logsTab);

    await waitFor(() => {
      expect(screen.getByText('Failed to load audit logs. Please try again later.')).toBeInTheDocument();
    });
  });
});
