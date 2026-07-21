import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { getCourseById } from '../../services/courseLearning.service';
import { useAuth } from '../../contexts/AuthContext';
import {
  createPayOSPayment,
  getLatestPayment,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABEL,
  formatVnd,
} from '../../services/paymentService';
import StudentPageBanner from '../../components/common/StudentPageBanner';
import './Checkout.css';

const RETRYABLE_STATUSES = new Set([
  PAYMENT_STATUS.CANCELLED,
  PAYMENT_STATUS.EXPIRED,
  PAYMENT_STATUS.FAILED,
]);

export default function Checkout() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isInitializing } = useAuth();
  const isUpgrade = new URLSearchParams(location.search).get('upgrade') === 'true';

  const [course, setCourse] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const amount = useMemo(() => {
    if (!course) return 0;
    return Number(isUpgrade ? course.premiumPrice : course.price) || 0;
  }, [course, isUpgrade]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (isInitializing) return undefined;
    if (!user) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const loadCheckout = async () => {
      setLoading(true);
      setError('');
      try {
        const courseData = await getCourseById(courseId);
        const latestPayment = await getLatestPayment(user.id, courseId).catch(() => null);
        if (active) {
          setCourse(courseData);
          setPayment(latestPayment);
        }
      } catch (requestError) {
        if (active) setError(requestError.message || 'Không tải được thông tin khóa học.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadCheckout();
    return () => { active = false; };
  }, [courseId, isInitializing, user]);

  const handlePay = async () => {
    setProcessing(true);
    setError('');
    try {
      const result = await createPayOSPayment({
        courseId,
        type: isUpgrade ? 'upgrade' : 'enroll',
      });
      const createdPayment = result.payment;
      setPayment(createdPayment);

      if (createdPayment?.status === PAYMENT_STATUS.PAID) {
        navigate('/', { replace: true, state: { paymentStatus: 'paid' } });
        return;
      }
      if (!createdPayment?.checkoutUrl) {
        throw new Error('PayOS chưa trả về đường dẫn thanh toán.');
      }
      window.location.assign(createdPayment.checkoutUrl);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.');
      setProcessing(false);
    }
  };

  if (isInitializing || loading) {
    return (
      <div className="checkout-page pb-5">
        <StudentPageBanner title="Đang tải thanh toán" subtitle="Đang kiểm tra thông tin khóa học" />
        <div className="text-center py-5" role="status">
          <Spinner animation="border" variant="primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="checkout-page pb-5">
        <StudentPageBanner
          title="Đăng nhập để thanh toán"
          subtitle="Phiên thanh toán cần một tài khoản học viên"
          badgeText="BẢO MẬT"
          badgeIcon="bi-shield-lock-fill"
        />
        <Container className="position-relative" style={{ marginTop: '-20px', zIndex: 10 }}>
          <Card className="border-0 shadow-sm mx-auto text-center" style={{ maxWidth: 460 }}>
            <Card.Body className="p-5">
              <i className="bi bi-person-lock fs-1 text-primary d-block mb-3" />
              <h1 className="h4 fw-bold">Bạn chưa đăng nhập</h1>
              <p className="text-muted mb-4">Đăng nhập để tiếp tục mua khóa học.</p>
              <Button as={Link} to="/login" state={{ from: location }} className="px-4 fw-semibold">
                Đăng nhập
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="checkout-page pb-5">
        <StudentPageBanner title="Không thể mở thanh toán" subtitle="Thông tin khóa học chưa sẵn sàng" />
        <Container className="position-relative" style={{ marginTop: '-20px', zIndex: 10 }}>
          <Alert variant="danger" className="mx-auto text-center" style={{ maxWidth: 640 }}>{error}</Alert>
        </Container>
      </div>
    );
  }

  if (payment?.status === PAYMENT_STATUS.PAID) {
    return (
      <div className="checkout-page pb-5">
        <StudentPageBanner
          title="Thanh toán thành công"
          subtitle="Khóa học đã được kích hoạt tự động"
          badgeText="ĐÃ THANH TOÁN"
          badgeIcon="bi-check-circle-fill"
        />
        <Container className="position-relative" style={{ marginTop: '-20px', zIndex: 10 }}>
          <Card className="border-0 shadow-sm mx-auto text-center" style={{ maxWidth: 540 }}>
            <Card.Body className="p-5">
              <i className="bi bi-check-circle-fill fs-1 text-success d-block mb-3" />
              <h1 className="h4 fw-bold">{course?.title}</h1>
              <p className="text-muted mb-4">Quyền học của bạn đã sẵn sàng.</p>
              <Button onClick={() => navigate(`/learning/courses/${courseId}`)} className="px-4 fw-semibold">
                <i className="bi bi-play-circle me-2" />Vào khóa học
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  const canContinuePending = payment?.status === PAYMENT_STATUS.PENDING && payment.checkoutUrl;
  const hasRetryablePayment = RETRYABLE_STATUSES.has(payment?.status);

  return (
    <div className="checkout-page pb-5">
      <StudentPageBanner
        title={isUpgrade ? 'Nâng cấp Premium' : 'Thanh toán khóa học'}
        subtitle="Xác nhận đơn hàng trước khi chuyển sang PayOS"
        badgeText="PAYOS"
        badgeIcon="bi-shield-check"
      />
      <Container className="position-relative" style={{ marginTop: '-20px', zIndex: 10 }}>
        {user.role !== 'student' && (
          <Alert variant="warning">Chỉ tài khoản học viên có thể mua và kích hoạt khóa học.</Alert>
        )}
        {hasRetryablePayment && (
          <Alert variant="warning">
            Đơn trước đã {PAYMENT_STATUS_LABEL[payment.status]?.toLowerCase()}. Bạn có thể tạo một link PayOS mới.
          </Alert>
        )}
        {error && <Alert variant="danger">{error}</Alert>}

        <Row className="g-4 justify-content-center">
          <Col lg={7}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-4 p-lg-5">
                <div className="d-flex gap-4 align-items-start">
                  {course?.thumbnail && (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="object-fit-cover flex-shrink-0"
                      style={{ width: 132, height: 92, borderRadius: 8 }}
                    />
                  )}
                  <div className="min-w-0">
                    <Badge bg="light" text="dark" className="border mb-2">{course?.skill || 'IELTS'}</Badge>
                    <h1 className="h4 fw-bold mb-2">{course?.title}</h1>
                    <p className="text-muted mb-0">{course?.level || 'Mọi trình độ'}</p>
                  </div>
                </div>
                <hr className="my-4" />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">{isUpgrade ? 'Phí nâng cấp' : 'Học phí'}</span>
                  <strong className="fs-3 text-primary">{formatVnd(amount)}</strong>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-4 d-flex flex-column">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, borderRadius: 8 }}>
                    <i className="bi bi-bank fs-5" />
                  </div>
                  <div>
                    <h2 className="h6 fw-bold mb-1">Thanh toán qua PayOS</h2>
                    <span className="small text-muted">Chuyển khoản Napas 24/7</span>
                  </div>
                </div>

                {canContinuePending && (
                  <Alert variant="info" className="small">
                    Đơn #{payment.orderCode} đang chờ thanh toán.
                  </Alert>
                )}

                <div className="small text-muted mb-4">
                  Sau khi ngân hàng xác nhận, hệ thống tự động mở khóa học và ghi nhận giao dịch.
                </div>
                <Button
                  className="w-100 fw-semibold py-3 mt-auto"
                  onClick={handlePay}
                  disabled={processing || user.role !== 'student'}
                >
                  {processing ? (
                    <><Spinner animation="border" size="sm" className="me-2" />Đang tạo link...</>
                  ) : (
                    <><i className="bi bi-credit-card me-2" />{canContinuePending ? 'Tiếp tục thanh toán' : 'Thanh toán ngay'}</>
                  )}
                </Button>
                <Button
                  variant="light"
                  className="w-100 mt-2 border"
                  onClick={() => navigate(user.role === 'student' ? `/learning/courses/${courseId}` : `/courses/${courseId}`)}
                  disabled={processing}
                >
                  Quay lại
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
