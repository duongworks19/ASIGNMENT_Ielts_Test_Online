import api, { getApiError } from './api';

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  FAILED: 'failed',
};

export const PAYMENT_STATUS_LABEL = {
  pending: 'Chờ thanh toán',
  paid: 'Thành công',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn',
  failed: 'Thất bại',
};

export const createPayOSPayment = async ({ courseIds, courseId, type = 'enroll', couponCode = '' }) => {
  try {
    const response = await api.post('/payments/create', {
      courseIds: courseIds || (courseId ? [courseId] : []),
      type,
      couponCode,
    });
    return response.data;
  } catch (error) {
    throw getApiError(error, 'Không thể tạo link thanh toán PayOS.');
  }
};

export const getMyPayments = async ({ courseId = '', status = '' } = {}) => {
  try {
    const response = await api.get('/payments/me', { params: { courseId, status } });
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    throw getApiError(error, 'Không tải được lịch sử thanh toán.');
  }
};

export const getPaidPayment = async (_userId, courseId) => {
  const payments = await getMyPayments({ courseId, status: PAYMENT_STATUS.PAID });
  return payments[0] || null;
};

export const getLatestPayment = async (_userId, courseId) => {
  const payments = await getMyPayments({ courseId });
  return payments[0] || null;
};

export const getPaymentsByUser = async () => getMyPayments();

export const syncPayment = async (orderCode) => {
  try {
    const response = await api.post(`/payments/${orderCode}/sync`);
    return response.data?.payment || null;
  } catch (error) {
    throw getApiError(error, 'Không thể xác nhận trạng thái thanh toán PayOS.');
  }
};

export const formatVnd = (amount) => {
  if (!amount || Number(amount) === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(amount));
};
