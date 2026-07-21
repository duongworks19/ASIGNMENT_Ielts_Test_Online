/**
 * Traceability Matrix:
 * - ADM-CONTENT-01: Render detail modal with pending request info.
 * - ADM-CONTENT-02: Reject content with reason (adminNote).
 * - ADM-CONTENT-03: Approve content.
 * - Error Handling (ADM_005): Handle API errors during approve/reject gracefully.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApprovalDetailModal from '../../../../components/feature/admin/ApprovalDetailModal';
import { approveRequest, rejectRequest } from '../../../../services/adminService';

// Mock the adminService virtually since the file might not exist yet (Task T005)
jest.mock('../../../../services/adminService', () => ({
  approveRequest: jest.fn(),
  rejectRequest: jest.fn(),
}));
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-admin-test', role: 'admin', status: 'active' } }),
}));

describe('ApprovalDetailModal Component', () => {
  const mockRequest = {
    id: 'approval-001',
    targetType: 'course',
    targetId: 'course-006',
    teacherId: 'u-teacher-001',
    status: 'pending',
    message: 'Please review this grammar course.',
    createdAt: '2026-06-06T09:00:00Z',
  };

  const defaultProps = {
    request: mockRequest,
    isOpen: true,
    onClose: jest.fn(),
    onActionSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render if isOpen is false', () => {
    render(<ApprovalDetailModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Review Content Request')).not.toBeInTheDocument();
  });

  it('should render request details correctly', () => {
    render(<ApprovalDetailModal {...defaultProps} />);
    expect(screen.getByText('Review Content Request')).toBeInTheDocument();
    expect(screen.getByText('course-006')).toBeInTheDocument();
    expect(screen.getByText('u-teacher-001')).toBeInTheDocument();
    expect(screen.getByText('Please review this grammar course.')).toBeInTheDocument();
  });

  it('should handle approve action successfully (Happy Path)', async () => {
    approveRequest.mockResolvedValueOnce({});
    
    render(<ApprovalDetailModal {...defaultProps} />);
    
    const approveBtn = screen.getByRole('button', { name: /Approve/i });
    fireEvent.click(approveBtn);
    
    // EARS[Event]: WHEN Admin approves content, THE system SHALL call approveRequest API
    expect(approveRequest).toHaveBeenCalledWith(
      'approval-001', 'course', 'course-006', 'u-admin-test'
    );
    
    await waitFor(() => {
      expect(defaultProps.onActionSuccess).toHaveBeenCalledWith('approve');
    });
  });

  it('should handle approve API error gracefully (Error Path)', async () => {
    // EARS[Unwanted]: WHERE an invalid approval action is attempted or API fails
    approveRequest.mockRejectedValueOnce(new Error('Network error'));
    
    render(<ApprovalDetailModal {...defaultProps} />);
    
    const approveBtn = screen.getByRole('button', { name: /Approve/i });
    fireEvent.click(approveBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    expect(defaultProps.onActionSuccess).not.toHaveBeenCalled();
  });

  it('should show admin note textarea when reject is clicked first time', () => {
    render(<ApprovalDetailModal {...defaultProps} />);
    
    const rejectBtn = screen.getByRole('button', { name: /Reject\.\.\./i });
    fireEvent.click(rejectBtn);
    
    expect(screen.getByText(/Reason for Rejection/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Reject/i })).toBeInTheDocument();
  });

  it('should show error if rejecting without providing reason (Error Path)', async () => {
    render(<ApprovalDetailModal {...defaultProps} />);
    
    // First click to enter reject mode
    fireEvent.click(screen.getByRole('button', { name: /Reject\.\.\./i }));
    
    // Second click to confirm without entering text
    fireEvent.click(screen.getByRole('button', { name: /Confirm Reject/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Please provide a reason for rejection.')).toBeInTheDocument();
    });
    expect(rejectRequest).not.toHaveBeenCalled();
  });

  it('should handle reject action successfully with reason (Happy Path)', async () => {
    rejectRequest.mockResolvedValueOnce({});
    
    render(<ApprovalDetailModal {...defaultProps} />);
    
    // First click to enter reject mode
    fireEvent.click(screen.getByRole('button', { name: /Reject\.\.\./i }));
    
    // Enter reason
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Incomplete content' } });
    
    // Confirm reject
    fireEvent.click(screen.getByRole('button', { name: /Confirm Reject/i }));
    
    // EARS[Event]: WHEN Admin rejects content, THE system SHALL call rejectRequest API
    expect(rejectRequest).toHaveBeenCalledWith(
      'approval-001', 'course', 'course-006', 'u-admin-test', 'Incomplete content'
    );
    
    await waitFor(() => {
      expect(defaultProps.onActionSuccess).toHaveBeenCalledWith('reject');
    });
  });
});
