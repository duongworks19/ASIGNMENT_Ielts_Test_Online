import React, { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clearCart } from '../../services/cartService';
import { PAYMENT_STATUS, syncPayment } from '../../services/paymentService';

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function PaymentResult({ cancelled = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState(cancelled ? 'Đang ghi nhận yêu cầu hủy...' : 'Đang xác nhận giao dịch với PayOS...');

  useEffect(() => {
    let active = true;
    const orderCode = new URLSearchParams(location.search).get('orderCode');

    const finish = async () => {
      if (!orderCode) {
        toast.error('Không tìm thấy mã đơn PayOS.');
        navigate('/', { replace: true });
        return;
      }

      try {
        let payment = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          payment = await syncPayment(orderCode);
          if (payment?.status !== PAYMENT_STATUS.PENDING) break;
          if (active) {
            setMessage(cancelled
              ? 'Đang đồng bộ trạng thái hủy với PayOS...'
              : 'Ngân hàng đã phản hồi, đang hoàn tất quyền học...');
          }
          await wait(800);
        }
        if (!active) return;

        if (payment?.status === PAYMENT_STATUS.PAID) {
          clearCart();
          toast.success('Thanh toán thành công. Khóa học đã được kích hoạt.');
          navigate('/', { replace: true, state: { paymentStatus: 'paid', orderCode } });
          return;
        }

        if (cancelled || payment?.status === PAYMENT_STATUS.CANCELLED) {
          toast('Đơn thanh toán đã được hủy.');
        } else {
          toast('Giao dịch đang chờ PayOS xác nhận.');
        }
        navigate('/', { replace: true, state: { paymentStatus: payment?.status || 'pending', orderCode } });
      } catch (error) {
        if (!active) return;
        toast.error(error.message || 'Không thể xác nhận giao dịch PayOS.');
        navigate('/', { replace: true, state: { paymentStatus: 'unknown', orderCode } });
      }
    };

    finish();
    return () => { active = false; };
  }, [cancelled, location.search, navigate]);

  return (
    <Container className="d-flex flex-column align-items-center justify-content-center text-center" style={{ minHeight: '60vh' }}>
      <Spinner animation="border" variant="primary" role="status" />
      <h1 className="h5 fw-bold mt-4 mb-2">{message}</h1>
      <p className="text-muted mb-0">Bạn sẽ được chuyển về trang chủ sau khi hoàn tất.</p>
    </Container>
  );
}
