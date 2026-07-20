import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { getCourseById } from '../../services/courseLearning.service';
import { getCurrentUser } from '../../services/authService';
import {
  BANK_CONFIG,
  buildVietQrUrl,
  buildTransferContent,
  createPendingPayment,
  getLatestPayment,
  PAYMENT_STATUS,
  formatVnd,
} from '../../services/paymentService';
import StudentPageBanner from '../../components/common/StudentPageBanner';
import './Checkout.css';

export default function Checkout() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const searchParams = new URLSearchParams(location.search);
  const isUpgrade = searchParams.get('upgrade') === 'true';

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [payment, setPayment] = useState(null); // đơn hiện tại (nếu có)
  const [copied, setCopied] = useState('');

  const transferContent = user ? buildTransferContent(user.id, courseId) : '';

  useEffect(() => {
    window.scrollTo(0, 0);
    let ignore = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getCourseById(courseId);
        if (ignore) return;
        setCourse(data);

        // Lấy đơn mới nhất để biết đang ở trạng thái nào (pending / paid / rejected).
        const latest = await getLatestPayment(user.id, courseId).catch(() => null);
        if (!ignore) setPayment(latest);
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được thông tin khóa học.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    if (user) load();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard?.writeText(String(text));
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  // User báo đã chuyển khoản -> tạo đơn PENDING (chờ admin duyệt).
  const handleConfirmTransfer = async () => {
    setProcessing(true);
    setError('');
    try {
      const amountToCharge = (isUpgrade && course.premiumPrice) ? course.premiumPrice : (course.price || 0);
      const created = await createPendingPayment({
        userId: user.id,
        courseId,
        amount: amountToCharge,
        transferContent,
        type: isUpgrade ? 'upgrade' : 'enroll',
      });
      setPayment(created);
    } catch (err) {
      setError(err.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  // ===== Chưa đăng nhập =====
  if (!user) {
    return (
      <div className="checkout-page" style={{ paddingBottom: '60px' }}>
        <StudentPageBanner
          title="Bạn cần đăng nhập"
          subtitle="Đăng nhập để thanh toán và đăng ký khóa học"
          badgeText="BẢO MẬT"
          badgeIcon="bi-shield-lock-fill"
        />
        <Container style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }}>
          <Card className="border-0 shadow-sm mx-auto text-center" style={{ maxWidth: 460 }}>
            <Card.Body className="p-5">
              <div className="ck-guard-icon mb-3">🔒</div>
              <h2 className="h4 fw-bold mb-2">Bạn cần đăng nhập</h2>
              <p className="text-muted mb-4">Vui lòng đăng nhập để thanh toán và đăng ký khóa học.</p>
              <Button as={Link} to="/login" variant="primary" className="fw-semibold px-4">
                Đăng nhập ngay
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="checkout-page" style={{ paddingBottom: '60px' }}>
        <StudentPageBanner title="Đang tải..." subtitle="Vui lòng đợi trong giây lát" />
        <Container style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }} className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3 mb-0">Đang tải thông tin thanh toán...</p>
        </Container>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="checkout-page" style={{ paddingBottom: '60px' }}>
        <StudentPageBanner title="Lỗi tải trang" subtitle="Không thể tải thông tin thanh toán" />
        <Container style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }}>
          <Alert variant="danger" className="text-center">{error}</Alert>
        </Container>
      </div>
    );
  }

  const status = payment?.status;

  // ===== Đã được kích hoạt (admin đã duyệt) =====
  if (status === PAYMENT_STATUS.PAID) {
    return (
      <div className="checkout-page" style={{ paddingBottom: '60px' }}>
        <StudentPageBanner
          title="Thanh toán thành công"
          subtitle="Khóa học đã sẵn sàng"
          badgeText="KÍCH HOẠT"
          badgeIcon="bi-check-circle-fill"
        />
        <Container style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }}>
          <Card className="border-0 shadow-sm mx-auto text-center" style={{ maxWidth: 520 }}>
            <Card.Body className="p-5">
              <div className="ck-result-icon ck-result-success mx-auto mb-3">✓</div>
              <h1 className="h3 fw-bold mb-2">Khóa học đã được kích hoạt!</h1>
              <p className="text-muted mb-4">
                Quản trị viên đã xác nhận thanh toán cho khóa <strong>{course?.title}</strong>.
                Bạn có thể bắt đầu học ngay bây giờ.
              </p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <Button variant="primary" className="fw-semibold px-4" onClick={() => navigate('/learning/courses')}>
                  Vào học ngay
                </Button>
                <Button as={Link} to={user?.role === 'student' ? `/learning/courses/${courseId}` : `/courses/${courseId}`} variant="outline-secondary" className="px-4">
                  Chi tiết khóa học
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  // ===== Đang chờ admin xác nhận =====
  if (status === PAYMENT_STATUS.PENDING) {
    return (
      <div className="checkout-page" style={{ paddingBottom: '60px' }}>
        <StudentPageBanner
          title="Đang xử lý thanh toán"
          subtitle="Quản trị viên đang đối soát đơn hàng"
          badgeText="CHỜ XÁC NHẬN"
          badgeIcon="bi-hourglass-split"
        />
        <Container style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }}>
          <Card className="border-0 shadow-sm mx-auto" style={{ maxWidth: 560 }}>
            <Card.Body className="p-4 p-md-5 text-center">
              <div className="ck-result-icon ck-result-pending mx-auto mb-3">⏳</div>
              <h1 className="h3 fw-bold mb-2">Đang chờ xác nhận thanh toán</h1>
              <p className="text-muted mb-4">
                Chúng tôi đã ghi nhận yêu cầu của bạn cho khóa <strong>{course?.title}</strong>.
                Quản trị viên sẽ đối soát giao dịch và kích hoạt khóa học trong thời gian sớm nhất
                (thường trong vài giờ làm việc).
              </p>

              <div className="ck-order-summary text-start mx-auto mb-4">
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-muted">Mã đơn</span>
                  <strong className="font-monospace">{payment.transferContent}</strong>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-muted">Số tiền</span>
                  <strong>{formatVnd(payment.amount)}</strong>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span className="text-muted">Trạng thái</span>
                  <Badge bg="warning" text="dark" className="px-3 py-2">Chờ xác nhận</Badge>
                </div>
              </div>

              <Alert variant="info" className="small text-start mb-4">
                💡 Hãy lưu lại <strong>mã đơn</strong> ở trên. Bạn có thể theo dõi trạng thái trong mục
                <strong> “Khóa học của tôi”</strong> sau khi đăng nhập.
              </Alert>

              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <Button as={Link} to="/learning/courses" variant="primary" className="fw-semibold px-4">
                  Xem khóa học của tôi
                </Button>
                <Button as={Link} to={user?.role === 'student' ? '/learning/courses' : '/online-courses'} variant="outline-secondary" className="px-4">
                  Tiếp tục khám phá
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  // ===== Chưa thanh toán hoặc đơn trước bị từ chối -> hiển thị form QR =====
  const amount = (isUpgrade && course?.premiumPrice) ? course.premiumPrice : (course?.price || 0);
  const qrUrl = buildVietQrUrl(amount, transferContent);

  return (
    <div className="checkout-page" style={{ paddingBottom: '60px' }}>
      <StudentPageBanner
        title={isUpgrade ? "Nâng cấp Premium" : "Hoàn tất đăng ký"}
        subtitle="Thanh toán khóa học"
        badgeText="THANH TOÁN AN TOÀN"
        badgeIcon="bi-shield-check"
      />
      <Container style={{ marginTop: '-20px', position: 'relative', zIndex: 10 }}>

        {status === PAYMENT_STATUS.REJECTED && (
          <Alert variant="danger" className="mx-auto" style={{ maxWidth: 920 }}>
            ⚠️ Đơn trước đó của bạn đã bị từ chối
            {payment?.rejectReason ? `: ${payment.rejectReason}` : '.'} Vui lòng kiểm tra lại và chuyển khoản đúng nội dung, sau đó xác nhận lại.
          </Alert>
        )}

        <Row className="g-4 justify-content-center">
          {/* CỘT TRÁI: Mã QR */}
          <Col lg={5}>
            <Card className="border-0 shadow-sm h-100 text-center">
              <Card.Body className="p-4">
                <h2 className="h5 fw-bold mb-1">Quét mã QR để thanh toán</h2>
                <p className="text-muted small mb-3">Dùng app ngân hàng bất kỳ hỗ trợ VietQR / Napas 247</p>
                <div className="ck-qr-frame mx-auto mb-3">
                  <img src={qrUrl} alt="Mã QR VietQR thanh toán khóa học" className="img-fluid" />
                </div>
                <p className="text-muted small mb-0">
                  Mã QR đã bao gồm sẵn số tiền và nội dung chuyển khoản.
                </p>
              </Card.Body>
            </Card>
          </Col>

          {/* CỘT PHẢI: Thông tin chuyển khoản */}
          <Col lg={5}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                <h2 className="h5 fw-bold mb-3">Thông tin chuyển khoản</h2>

                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-muted">Khóa học</span>
                  <strong className="text-end">{course?.title}</strong>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom align-items-center">
                  <span className="text-muted">Số tiền</span>
                  <strong className="text-primary fs-5">{formatVnd(amount)}</strong>
                </div>

                <div className="mt-3 mb-3">
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted">Ngân hàng</span>
                    <span className="text-end">{BANK_CONFIG.bankName}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom align-items-center">
                    <span className="text-muted">Số tài khoản</span>
                    <Button variant="link" size="sm" className="p-0 text-decoration-none fw-semibold"
                      onClick={() => copyToClipboard(BANK_CONFIG.accountNo, 'acc')}>
                      {BANK_CONFIG.accountNo} <small className="text-muted">{copied === 'acc' ? '✓ Đã chép' : '📋'}</small>
                    </Button>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted">Chủ tài khoản</span>
                    <span className="text-end">{BANK_CONFIG.accountName}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 align-items-center">
                    <span className="text-muted">Nội dung CK</span>
                    <Button variant="link" size="sm" className="p-0 text-decoration-none fw-semibold"
                      onClick={() => copyToClipboard(transferContent, 'msg')}>
                      {transferContent} <small className="text-muted">{copied === 'msg' ? '✓ Đã chép' : '📋'}</small>
                    </Button>
                  </div>
                </div>

                <Alert variant="warning" className="small mb-3">
                  ⚠️ Vui lòng ghi <strong>đúng nội dung chuyển khoản</strong> để quản trị viên đối soát và kích hoạt khóa học cho bạn.
                </Alert>

                {error && <Alert variant="danger" className="small">{error}</Alert>}

                <Button
                  variant="primary"
                  className="w-100 fw-semibold mb-2"
                  onClick={handleConfirmTransfer}
                  disabled={processing}
                >
                  {processing ? 'Đang gửi yêu cầu...' : 'Tôi đã chuyển khoản'}
                </Button>
                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => navigate(user?.role === 'student' ? `/learning/courses/${courseId}` : `/courses/${courseId}`)}
                  disabled={processing}
                >
                  Quay lại chi tiết khóa học
                </Button>

                <p className="text-muted small mt-3 mb-0">
                  * Đây là môi trường demo học thuật (FER202). Sau khi bạn xác nhận, đơn ở trạng thái
                  <strong> chờ duyệt</strong> và chỉ được kích hoạt khi quản trị viên đối soát giao dịch.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
