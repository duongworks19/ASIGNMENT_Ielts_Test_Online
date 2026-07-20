/**
 * Traceability Matrix:
 * - ADM-USER-04: Khóa/mở khóa tài khoản (Warning variant)
 * - ADM-USER-05: Xóa tài khoản (Danger variant)
 * - UI/UX Verification: Handle click events properly.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmModal from '../../../components/common/ConfirmModal';

describe('ConfirmModal Component', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    // React-bootstrap Modals don't render their children into the DOM when show=false
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('should render correctly with default danger variant', () => {
    render(<ConfirmModal {...defaultProps} />);
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toHaveClass('btn-danger', 'rounded-pill');
    
    const title = screen.getByText('Confirm Action');
    expect(title).toHaveClass('text-danger');
  });

  it('should render correctly with warning variant', () => {
    render(<ConfirmModal {...defaultProps} variant="warning" />);
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toHaveClass('btn-warning');
    
    const title = screen.getByText('Confirm Action');
    expect(title).toHaveClass('text-warning');
  });

  it('should trigger onConfirm when Confirm button is clicked (Happy path)', () => {
    render(<ConfirmModal {...defaultProps} />);
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should trigger onClose when Cancel button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('should trigger onClose when close icon in header is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    
    const closeIcon = screen.getByLabelText('Close');
    fireEvent.click(closeIcon);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  // Error case / unexpected variant
  it('should fallback to danger if an invalid variant is passed (Unwanted pattern)', () => {
    // EARS[Unwanted]: WHERE variant is not supported, fallback to danger.
    render(<ConfirmModal {...defaultProps} variant="invalid_variant" />);
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toHaveClass('btn-danger');
  });
});
