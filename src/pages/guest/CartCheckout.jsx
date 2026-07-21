import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { getCartItems, removeFromCart, subscribeCartChanges, clearCart } from '../../services/cartService';
import { getCourseById } from '../../services/courseLearning.service';
import { validateCoupon, calculateDiscount, getCouponMessage } from '../../services/couponService';
import { createPayOSPayment, PAYMENT_STATUS, formatVnd } from '../../services/paymentService';

const FALLBACK = 'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&w=600&q=80';

export default function CartCheckout() {
  const navigate = useNavigate();
  const { user, isInitializing } = useAuth();
  const shoppingPath = user?.role === 'student' ? '/learning/courses' : '/online-courses';

  const [cartCourseIds, setCartCourseIds] = useState(getCartItems());
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const cartTotal = useMemo(() => courses.reduce((s, c) => s + (c.price || 0), 0), [courses]);
  const discountAmount = useMemo(() => calculateDiscount(cartTotal, appliedCoupon), [cartTotal, appliedCoupon]);
  const payableAmount = useMemo(() => Math.max(0, cartTotal - discountAmount), [cartTotal, discountAmount]);

  useEffect(() => {
    if (cartCourseIds.length === 0) { setCourses([]); setLoading(false); return; }
    let ignore = false;
    setLoading(true); setError('');
    
    Promise.allSettled(cartCourseIds.map(id => getCourseById(id)))
      .then(results => {
        if (ignore) return;
        const validCourses = [];
        let hasInvalid = false;
        
        results.forEach((res, index) => {
          if (res.status === 'fulfilled' && res.value) {
            validCourses.push(res.value);
          } else {
            hasInvalid = true;
            removeFromCart(cartCourseIds[index]);
          }
        });
        
        setCourses(validCourses);
        if (hasInvalid) {
          setCartCourseIds(getCartItems());
        }
      })
      .catch(e => {
        if (!ignore) setError(e.message || 'Không thể tải khóa học trong giỏ hàng');
      })
      .finally(() => { if (!ignore) setLoading(false); });
      
    return () => { ignore = true; };
  }, [cartCourseIds]);

  useEffect(() => {
    const unsub = subscribeCartChanges(() => setCartCourseIds(getCartItems()));
    return () => unsub();
  }, []);

  const handleRemove = (id) => { removeFromCart(id); setCartCourseIds(getCartItems()); };
  const handleApplyCoupon = () => {
    const c = validateCoupon(couponCode);
    if (!c) { setCouponError('Mã coupon không hợp lệ.'); setAppliedCoupon(null); return; }
    setCouponError(''); setAppliedCoupon(c);
  };
  const handleCheckoutNow = async () => {
    if (!user) { navigate('/login', { state: { from: { pathname: '/checkout' } } }); return; }
    if (!courses.length) { setError('Giỏ hàng đang trống.'); return; }
    setProcessing(true); setError('');
    try {
      const result = await createPayOSPayment({
        courseIds: cartCourseIds,
        couponCode: appliedCoupon?.code || '',
      });
      const created = result.payment;
      if (created?.status === PAYMENT_STATUS.PAID) {
        clearCart();
        navigate('/', { replace: true, state: { paymentStatus: 'paid' } });
        return;
      }
      if (!created?.checkoutUrl) throw new Error('PayOS chưa trả về đường dẫn thanh toán.');
      window.location.assign(created.checkoutUrl);
    } catch (e) { setError(e.message || 'Gửi yêu cầu thanh toán thất bại.'); }
    finally { setProcessing(false); }
  };

  if (isInitializing) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100" role="status">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
        <div className="tp-hero" style={{ padding: '60px 0' }}>
          <div className="tp-hero-dots">{Array(15).fill(0).map((_, i) => <span key={i}></span>)}</div>
          <div className="tp-hero-inner">
            <Container fluid="xxl" className="px-4 text-center">
              <div className="tp-hero-badge mx-auto"><i className="bi bi-shield-lock-fill"></i> Bảo mật</div>
              <h1 className="tp-hero-title mb-3">Bạn chưa <span>đăng nhập</span></h1>
              <p className="tp-hero-sub mb-0 mx-auto" style={{ maxWidth: '600px' }}>Đăng nhập để mua khóa học và sử dụng giỏ hàng.</p>
            </Container>
          </div>
        </div>
        <div className="tp-main-content">
          <Container fluid="xxl" className="px-4 py-5">
            <Card className="tp-card border-0 text-center p-5 mx-auto" style={{ maxWidth: '500px' }}>
              <i className="bi bi-lock-fill text-muted mb-3" style={{ fontSize: '4rem' }}></i>
              <h4 className="fw-bold mb-2">Cần đăng nhập</h4>
              <p className="text-secondary mb-4">Vui lòng đăng nhập để tiếp tục thanh toán.</p>
              <Button onClick={() => navigate('/login')} className="tp-btn-primary rounded-pill px-5 py-2">Đăng nhập ngay</Button>
            </Card>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      
      {/* ── HERO ── */}
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-cart-check-fill"></i> Giỏ hàng</div>
            <h1 className="tp-page-title">Thanh toán đơn hàng</h1>
            <p className="tp-page-sub">Kiểm tra lại giỏ hàng và tiến hành thanh toán để bắt đầu học ngay.</p>
          </div>
          <div className="d-none d-md-block">
            <Button variant="outline-light" onClick={() => navigate(shoppingPath)} className="rounded-pill px-4 fw-medium border-2">
              <i className="bi bi-arrow-left me-2"></i>Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4 py-4">
          {error && <Alert variant="danger" className="rounded-4 border-0 shadow-sm mb-4"><i className="bi bi-exclamation-circle-fill me-2"></i>{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} />
              <p className="mt-3 text-muted fw-semibold">Đang tải giỏ hàng...</p>
            </div>
          ) : courses.length === 0 ? (
            <Card className="tp-card border-0 text-center p-5 mx-auto" style={{ maxWidth: '600px' }}>
              <i className="bi bi-cart-x text-muted mb-3" style={{ fontSize: '4rem', opacity: 0.5 }}></i>
              <h4 className="fw-bold mb-2">Giỏ hàng trống</h4>
              <p className="text-secondary mb-4">Thêm khóa học vào giỏ để tiến hành thanh toán.</p>
              <Button onClick={() => navigate(shoppingPath)} className="tp-btn-primary rounded-pill px-5 py-2 mx-auto" style={{ maxWidth: '240px' }}>
                <i className="bi bi-compass-fill me-2"></i>Khám phá khóa học
              </Button>
            </Card>
          ) : (
            <Row className="g-4">
              {/* LEFT */}
              <Col lg={8}>
                {/* Course list */}
                <Card className="tp-card border-0 mb-4">
                  <Card.Header className="bg-white border-bottom p-4 d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-journal-bookmark-fill fs-5"></i>
                    </div>
                    <h5 className="fw-bold mb-0 text-dark">Khóa học trong giỏ ({courses.length})</h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <ul className="list-group list-group-flush">
                      {courses.map(course => (
                        <li className="list-group-item p-4 border-bottom-0 border-top" key={course.id}>
                          <div className="d-flex flex-column flex-sm-row gap-4 align-items-sm-center">
                            <img
                              src={course.thumbnail || FALLBACK}
                              alt={course.title}
                              className="rounded-4 object-fit-cover shadow-sm flex-shrink-0"
                              style={{ width: '140px', height: '90px' }}
                              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK; }}
                            />
                            <div className="flex-grow-1">
                              <h6 className="fw-bold text-dark fs-5 mb-1">{course.title}</h6>
                              <p className="text-muted small mb-2">{course.skill || 'General'} • {course.level || 'All Levels'}</p>
                              <div className="fw-bold fs-5 text-primary">
                                {course.price > 0 ? formatVnd(course.price) : <span className="text-success">Miễn phí</span>}
                              </div>
                            </div>
                            <Button variant="light" className="text-danger flex-shrink-0 border bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }} onClick={() => handleRemove(course.id)} title="Xóa">
                              <i className="bi bi-trash-fill"></i>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>

                {/* Coupon */}
                <Card className="tp-card border-0">
                  <Card.Header className="bg-white border-bottom p-4 d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-tag-fill fs-5"></i>
                    </div>
                    <h5 className="fw-bold mb-0 text-dark">Mã giảm giá</h5>
                  </Card.Header>
                  <Card.Body className="p-4">
                    {couponError && <Alert variant="warning" className="rounded-3 py-2 mb-3 small border-0"><i className="bi bi-exclamation-triangle-fill me-2"></i>{couponError}</Alert>}
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        placeholder="Nhập mã coupon..."
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        className="tp-input rounded-pill px-4 bg-light"
                      />
                      <Button variant="dark" className="rounded-pill px-4 fw-semibold shadow-sm flex-shrink-0" onClick={handleApplyCoupon}>Áp dụng</Button>
                    </div>
                    {appliedCoupon && (
                      <Alert variant="success" className="rounded-3 py-2 mt-3 mb-0 small border-0">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        {getCouponMessage(appliedCoupon)} → Giảm {formatVnd(discountAmount)}
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* RIGHT — ORDER SUMMARY */}
              <Col lg={4}>
                <div className="sticky-top" style={{ top: '90px' }}>
                  <Card className="tp-card border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom p-4 d-flex align-items-center">
                      <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-receipt-cutoff fs-5"></i>
                      </div>
                      <h5 className="fw-bold mb-0 text-dark">Tổng đơn hàng</h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-secondary fw-medium">Tạm tính</span>
                        <strong className="text-dark">{formatVnd(cartTotal)}</strong>
                      </div>
                      {discountAmount > 0 && (
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-secondary fw-medium">Giảm giá</span>
                          <strong className="text-success">-{formatVnd(discountAmount)}</strong>
                        </div>
                      )}
                      <hr className="my-3 border-secondary border-opacity-25" />
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="text-dark fw-bold">Phải trả</span>
                        <div className="text-end">
                          {payableAmount === 0 ? (
                            <span className="fs-3 fw-bold text-success">Miễn phí</span>
                          ) : (
                            <span className="fs-3 fw-bold text-primary">{formatVnd(payableAmount)}</span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        className="tp-btn-primary w-100 fw-bold py-3 mb-3 rounded-pill"
                        onClick={handleCheckoutNow}
                        disabled={processing}
                      >
                        {processing ? (
                          <><Spinner animation="border" size="sm" className="me-2" /> Đang tạo đơn...</>
                        ) : (
                          <><i className="bi bi-credit-card me-2"></i> Thanh toán qua PayOS</>
                        )}
                      </Button>
                      
                      <Button variant="light" className="w-100 fw-semibold py-2 border rounded-pill shadow-sm tp-btn-hover text-secondary d-md-none" onClick={() => navigate(shoppingPath)}>
                        <i className="bi bi-arrow-left me-2"></i>Quay lại danh sách
                      </Button>

                      <div className="small text-muted text-center mt-3">
                        Giá và ưu đãi được xác nhận lại trên máy chủ trước khi mở PayOS.
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </Col>
            </Row>
          )}
        </Container>
      </div>
    </div>
  );
}
