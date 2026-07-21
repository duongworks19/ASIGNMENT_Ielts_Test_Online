import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentResult from '../pages/guest/PaymentResult';
import { clearCart } from '../services/cartService';
import { syncPayment } from '../services/paymentService';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('../services/cartService', () => ({
  clearCart: jest.fn(),
}));

jest.mock('../services/paymentService', () => ({
  PAYMENT_STATUS: { PENDING: 'pending', PAID: 'paid', CANCELLED: 'cancelled' },
  syncPayment: jest.fn(),
}));

describe('PaymentResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocation.mockReturnValue({ search: '?orderCode=1784500000000' });
  });

  test('syncs a successful PayOS order, clears the cart, and returns home', async () => {
    const navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    syncPayment.mockResolvedValue({ status: 'paid' });

    render(<PaymentResult />);

    expect(screen.getByText('Đang xác nhận giao dịch với PayOS...')).toBeInTheDocument();
    await waitFor(() => expect(syncPayment).toHaveBeenCalledWith('1784500000000'));
    expect(clearCart).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/', {
      replace: true,
      state: { paymentStatus: 'paid', orderCode: '1784500000000' },
    });
  });
});
