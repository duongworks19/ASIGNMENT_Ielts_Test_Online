import api from './api';
import { createEnrollment, getEnrollment } from './courseLearning.service';

// ===== CẤU HÌNH TÀI KHOẢN NHẬN TIỀN (DEMO HỌC THUẬT - FER202) =====
// VietQR tạo mã QR ngân hàng thật, quét được bằng app banking.
// Đây là tài khoản giả định cho đồ án, KHÔNG xử lý giao dịch tiền thật.
export const BANK_CONFIG = {
  bankId: 'MB', // Mã ngân hàng theo chuẩn VietQR (MB Bank)
  bankName: 'MB Bank (Ngân hàng Quân đội)',
  accountNo: '0985109174',
  accountName: 'NGUYEN TIEN DAT',
};

// Trạng thái đơn thanh toán theo quy trình đối soát thủ công.
export const PAYMENT_STATUS = {
  PENDING: 'pending',   // User báo đã chuyển - chờ admin đối soát
  PAID: 'paid',         // Admin xác nhận đã nhận tiền -> mở khóa học
  REJECTED: 'rejected', // Admin không tìm thấy giao dịch -> từ chối
};

export const PAYMENT_STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  paid: 'Đã kích hoạt',
  rejected: 'Bị từ chối',
};

/**
 * Tạo URL ảnh mã QR VietQR động.
 * Tham khảo: https://www.vietqr.io/danh-sach-api/lay-ma-qr-thanh-toan
 * @param {number} amount  Số tiền (VND)
 * @param {string} addInfo Nội dung chuyển khoản (vd: IELTS course-002)
 */
export const buildVietQrUrl = (amount, addInfo) => {
  const { bankId, accountNo, accountName } = BANK_CONFIG;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName,
  });
  // Template "compact2" hiển thị logo + số tiền + nội dung ngay trên ảnh QR.
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?${params.toString()}`;
};

// Sinh nội dung chuyển khoản gọn, dễ đối soát (đồng thời là "mã đơn" cho user tra cứu).
export const buildTransferContent = (userId, courseId) => {
  const shortUser = String(userId).slice(-4).toUpperCase();
  return `IELTS ${courseId} ${shortUser}`;
};

// ===== TRUY VẤN (USER) =====================================================

// EARS[State-driven]: Kiểm tra user đã thanh toán THÀNH CÔNG (paid) khóa này chưa.
export const getPaidPayment = async (userId, courseId) => {
  try {
    const res = await api.get(`/payments?userId=${userId}&courseId=${courseId}&status=paid`);
    return Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không kiểm tra được trạng thái thanh toán');
  }
};

// Lấy đơn thanh toán MỚI NHẤT của user cho 1 khóa (mọi trạng thái) để hiển thị tiến trình.
export const getLatestPayment = async (userId, courseId) => {
  try {
    const res = await api.get(`/payments?userId=${userId}&courseId=${courseId}`);
    const list = Array.isArray(res.data) ? res.data : [];
    if (list.length === 0) return null;
    // Đơn mới nhất theo createdAt/paidAt (fallback theo thứ tự mảng).
    return list.sort((a, b) => {
      const ta = new Date(a.createdAt || a.paidAt || 0).getTime();
      const tb = new Date(b.createdAt || b.paidAt || 0).getTime();
      return tb - ta;
    })[0];
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không tải được thông tin đơn hàng');
  }
};

// Tất cả đơn của 1 user (dùng cho trang "Khóa học của tôi").
export const getPaymentsByUser = async (userId) => {
  try {
    const res = await api.get(`/payments?userId=${userId}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không tải được lịch sử thanh toán');
  }
};

// ===== GHI NHẬN (USER) =====================================================

// EARS[Event]: WHEN user bấm "Tôi đã chuyển khoản", tạo đơn PENDING (chờ admin duyệt).
// KHÔNG tạo enrollment ở bước này - chỉ mở khóa học sau khi admin xác nhận.
export const createPendingPayment = async ({ userId, courseId, amount, transferContent, type = 'enroll' }) => {
  try {
    // Tránh tạo trùng: nếu đã có đơn pending thì trả về đơn cũ.
    const existingRes = await api.get(
      `/payments?userId=${userId}&courseId=${courseId}&status=pending&type=${type}`
    );
    if (Array.isArray(existingRes.data) && existingRes.data.length > 0) {
      return existingRes.data[0];
    }

    const payload = {
      userId,
      courseId,
      amount,
      currency: 'VND',
      method: 'vietqr',
      transferContent,
      type,
      status: PAYMENT_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      paidAt: null,
      reviewedAt: null,
      reviewedBy: null,
      rejectReason: null,
    };
    const res = await api.post('/payments', payload);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không gửi được yêu cầu thanh toán');
  }
};

// ===== ĐỐI SOÁT (ADMIN) ====================================================

// Lấy toàn bộ đơn (admin), kèm tên người gửi nếu cần lọc/ hiển thị.
export const getAllPayments = async () => {
  try {
    const res = await api.get('/payments');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.sort((a, b) => {
      const ta = new Date(a.createdAt || a.paidAt || 0).getTime();
      const tb = new Date(b.createdAt || b.paidAt || 0).getTime();
      return tb - ta;
    });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không tải được danh sách thanh toán');
  }
};

// EARS[Event]: WHEN admin xác nhận đã nhận tiền, set status=paid VÀ tạo enrollment để mở khóa học.
export const approvePayment = async (payment, adminId = 'admin') => {
  try {
    const updated = await api.patch(`/payments/${payment.id}`, {
      status: PAYMENT_STATUS.PAID,
      paidAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminId,
      rejectReason: null,
    });

    // Mở quyền học hoặc nâng cấp Premium
    const existing = await getEnrollment(payment.userId, payment.courseId).catch(() => null);
    
    if (payment.type === 'upgrade') {
      if (existing) {
        await api.patch(`/enrollments/${existing.id}`, { isPremium: true });
      } else {
        await api.post('/enrollments', {
          userId: payment.userId,
          courseId: payment.courseId,
          progress: 0,
          enrolledAt: new Date().toISOString(),
          isPremium: true
        });
      }
    } else {
      if (!existing) {
        await createEnrollment(payment.userId, payment.courseId);
      }
    }
    
    return updated.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Duyệt thanh toán thất bại');
  }
};

// EARS[Event]: WHEN admin không tìm thấy giao dịch, từ chối đơn kèm lý do.
export const rejectPayment = async (paymentId, reason = '', adminId = 'admin') => {
  try {
    const res = await api.patch(`/payments/${paymentId}`, {
      status: PAYMENT_STATUS.REJECTED,
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminId,
      rejectReason: reason || 'Không tìm thấy giao dịch khớp nội dung chuyển khoản.',
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Từ chối thanh toán thất bại');
  }
};

// Định dạng tiền VND: 199000 -> "199.000 ₫"
export const formatVnd = (amount) => {
  if (!amount || amount === 0) return 'Miễn phí';
  return `${Number(amount).toLocaleString('vi-VN')} ₫`;
};
