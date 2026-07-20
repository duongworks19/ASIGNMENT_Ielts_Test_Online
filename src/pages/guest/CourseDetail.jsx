import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { getCourseById, getEnrollment, createEnrollment } from '../../services/courseLearning.service';
import { getFlashcardCount } from '../../services/flashcardService';
import { getPaidPayment, getLatestPayment, formatVnd, PAYMENT_STATUS } from '../../services/paymentService';
import { getCurrentUser } from '../../services/authService';
import { addToCart, isInCart, subscribeCartChanges } from '../../services/cartService';
import { isInWishlist, addToWishlist, removeFromWishlist, subscribeWishlistChanges } from '../../services/wishlistService';

export default function CourseDetail() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [course, setCourse] = useState(null);
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [enrolled, setEnrolled] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [wishlistAdded, setWishlistAdded] = useState(isInWishlist(courseId));

  useEffect(() => {
    window.scrollTo(0, 0);
    let ignore = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [courseData, fcCount] = await Promise.all([
          getCourseById(courseId),
          getFlashcardCount(courseId),
        ]);
        if (ignore) return;
        setCourse(courseData);
        setFlashcardCount(fcCount);

        if (user) {
          const [enr, paid, latest] = await Promise.all([
            getEnrollment(user.id, courseId).catch(() => null),
            getPaidPayment(user.id, courseId).catch(() => null),
            getLatestPayment(user.id, courseId).catch(() => null),
          ]);
          if (!ignore) {
            setEnrolled(Boolean(enr));
            setHasPaid(Boolean(paid));
            setPending(latest?.status === PAYMENT_STATUS.PENDING);
          }
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được thông tin khóa học.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    setWishlistAdded(isInWishlist(courseId));
    setInCart(isInCart(courseId));

    const handleWishlistUpdate = () => setWishlistAdded(isInWishlist(courseId));
    const handleCartUpdate = () => setInCart(isInCart(courseId));

    const unsubscribeWishlist = subscribeWishlistChanges(handleWishlistUpdate);
    const unsubscribeCart = subscribeCartChanges(handleCartUpdate);

    return () => {
      unsubscribeWishlist();
      unsubscribeCart();
    };
  }, [courseId]);

  const isFree = !course?.price || course.price === 0;
  const canAccess = isFree || enrolled || hasPaid;

  const handleEnrollFree = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/courses/${courseId}` } } });
      return;
    }
    setEnrolling(true);
    setError('');
    try {
      const existing = await getEnrollment(user.id, courseId).catch(() => null);
      if (!existing) await createEnrollment(user.id, courseId);
      setEnrolled(true);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleBuy = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/checkout/${courseId}` } } });
      return;
    }
    navigate(`/checkout/${courseId}`);
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/courses/${courseId}` } } });
      return;
    }
    addToCart(courseId);
    setInCart(true);
    navigate('/checkout');
  };

  const handleToggleWishlist = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/courses/${courseId}` } } });
      return;
    }
    if (wishlistAdded) {
      removeFromWishlist(courseId);
      setWishlistAdded(false);
    } else {
      addToWishlist(courseId);
      setWishlistAdded(true);
    }
  };

  const handleOpenFlashcards = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/learning/flashcards/${courseId}` } } });
      return;
    }
    navigate(`/learning/flashcards/${courseId}`);
  };

  if (loading) {
    return (
      <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3 mb-0">Đang tải thông tin khóa học...</p>
        </Container>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
        <Container className="py-5">
          <Alert variant="danger" className="text-center">{error}</Alert>
          <div className="text-center">
            <Button as={Link} to={user?.role === 'student' ? '/learning/courses' : '/online-courses'} variant="outline-secondary">
              ← Về danh sách khóa học
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      
      {/* HERO SECTION */}
      <div className="tp-hero" style={{ padding: '60px 0', position: 'relative' }}>
        <div className="tp-hero-dots">
          {Array(15).fill(0).map((_, i) => <span key={i}></span>)}
        </div>
        {course.thumbnail && (
          <div className="position-absolute top-0 end-0 bottom-0 start-0 opacity-25" style={{
            backgroundImage: `url(${course.thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)'
          }} />
        )}
        <div className="tp-hero-inner position-relative">
          <Container fluid="xxl" className="px-4">
            <Link to={user?.role === 'student' ? '/learning/courses' : '/online-courses'} className="text-white-50 text-decoration-none d-inline-block mb-4 fw-medium">
              <i className="bi bi-arrow-left me-2"></i> Tất cả khóa học
            </Link>
            <Row className="align-items-center g-5">
              <Col lg={8}>
                <div className="d-flex gap-2 mb-3 flex-wrap">
                  <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill shadow-sm">{course.skill}</Badge>
                  <Badge bg={isFree ? 'success' : 'warning'} text={isFree ? 'white' : 'dark'} className="px-3 py-2 rounded-pill shadow-sm">
                    {isFree ? 'Miễn phí' : 'Trả phí'}
                  </Badge>
                </div>
                <h1 className="tp-hero-title mb-3">
                  {course.title}
                </h1>
                <p className="tp-hero-sub mb-4 opacity-75" style={{ fontSize: '1.1rem' }}>
                  {course.description}
                </p>
                <div className="d-flex gap-4 flex-wrap small text-white fw-medium">
                  <span><i className="bi bi-star-fill text-warning me-1"></i> {course.rating || '4.5'} đánh giá</span>
                  <span><i className="bi bi-people-fill me-1"></i> {course.enrolledCount || 0} học viên</span>
                  <span><i className="bi bi-calendar3 me-1"></i> {course.durationWeeks || 0} tuần</span>
                  <span><i className="bi bi-bar-chart-fill me-1"></i> {course.level || 'Cơ bản'}</span>
                </div>
              </Col>
              {course.thumbnail && (
                <Col lg={4} className="d-none d-lg-block">
                  <img src={course.thumbnail} alt="" className="img-fluid rounded-4 shadow-lg border" style={{ borderColor: 'rgba(255,255,255,0.2) !important' }} />
                </Col>
              )}
            </Row>
          </Container>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4 py-5">
          <Row className="g-4">
            {/* MAIN CONTENT */}
            <Col lg={8}>
              {/* SÁCH / GIÁO TRÌNH */}
              <Card className="tp-card border-0 mb-4">
                <Card.Body className="p-4">
                  <h2 className="h4 fw-bold mb-4 text-dark"><i className="bi bi-journal-text me-2 text-primary"></i> Nội dung khóa học</h2>
                  <ListGroup variant="flush">
                    {(course.syllabus || []).map((item, i) => (
                      <ListGroup.Item key={i} className="d-flex align-items-start gap-3 px-0 py-3 bg-transparent border-bottom">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold" style={{ width: '32px', height: '32px' }}>
                          {i + 1}
                        </div>
                        <span className="text-secondary mt-1">{item}</span>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* FLASHCARD */}
              <Card className="tp-card border-0" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                <Card.Body className="p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
                  <div>
                    <h2 className="h5 fw-bold mb-2 text-dark"><i className="bi bi-card-text me-2 text-primary"></i> Flashcard từ vựng</h2>
                    <p className="mb-2 text-secondary">
                      Khóa học này đi kèm <strong className="text-dark">{flashcardCount} thẻ từ vựng</strong> trọng tâm. Học theo phương pháp lật thẻ chủ động để ghi nhớ nhanh và lâu hơn.
                    </p>
                    {!user && (
                      <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill"><i className="bi bi-lock-fill me-1"></i> Đăng nhập để học flashcard</Badge>
                    )}
                  </div>
                  <Button
                    variant="dark"
                    className="flex-shrink-0 fw-semibold rounded-pill px-4 shadow-sm"
                    onClick={handleOpenFlashcards}
                    disabled={flashcardCount === 0}
                  >
                    <i className="bi bi-layers-fill me-2"></i> {flashcardCount === 0 ? 'Chưa có thẻ' : 'Học Flashcard ngay'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {/* SIDEBAR */}
            <Col lg={4}>
              <div className="sticky-top" style={{ top: '90px' }}>
                <Card className="tp-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="text-center mb-4 pb-3 border-bottom">
                      <div className="h2 fw-bold text-primary mb-0">
                        {isFree ? <span className="text-success">Miễn phí</span> : formatVnd(course.price)}
                      </div>
                    </div>

                    {canAccess ? (
                      <>
                        <Alert variant="success" className="py-3 text-center fw-semibold mb-3 rounded-3 border-0">
                          <i className="bi bi-check-circle-fill me-2"></i> Bạn đã có quyền truy cập
                        </Alert>
                        <Button variant="primary" className="tp-btn-primary w-100 fw-semibold mb-2 py-2" onClick={() => navigate(`/learning/courses/${courseId}/lessons`)}>
                          <i className="bi bi-play-circle-fill me-2"></i> Vào học ngay
                        </Button>
                      </>
                    ) : pending ? (
                      <>
                        <Alert variant="warning" className="py-3 text-center mb-3 rounded-3 border-0">
                          <i className="bi bi-hourglass-split me-2"></i> Đơn của bạn đang <strong>chờ quản trị viên xác nhận</strong>.
                        </Alert>
                        <Button variant="outline-primary" className="w-100 fw-semibold mb-2 py-2 rounded-pill" onClick={handleBuy}>
                          Xem trạng thái đơn
                        </Button>
                      </>
                    ) : isFree ? (
                      <Button
                        variant="primary"
                        className="tp-btn-primary w-100 fw-semibold mb-2 py-2"
                        onClick={handleEnrollFree}
                        disabled={enrolling}
                      >
                        {enrolling ? (
                          <><Spinner size="sm" className="me-2"/> Đang đăng ký...</>
                        ) : (
                          <><i className="bi bi-person-plus-fill me-2"></i> Đăng ký miễn phí</>
                        )}
                      </Button>
                    ) : (
                      <Button variant="primary" className="tp-btn-primary w-100 fw-semibold mb-2 py-2" onClick={handleBuy}>
                        <i className="bi bi-cart-check-fill me-2"></i> Mua khóa học
                      </Button>
                    )}

                    <Button
                      variant="light"
                      className="w-100 mb-3 py-2 fw-semibold border shadow-sm rounded-pill tp-btn-hover"
                      onClick={handleOpenFlashcards}
                      disabled={flashcardCount === 0}
                    >
                      <i className="bi bi-images text-primary me-2"></i> Học Flashcard ({flashcardCount})
                    </Button>

                    {error && <Alert variant="danger" className="small py-2 border-0">{error}</Alert>}

                    {!canAccess && !isFree && (
                      <div className="d-flex gap-2 mb-3">
                        <Button
                          variant={inCart ? 'light' : 'outline-primary'}
                          className={`w-100 fw-semibold border rounded-pill ${inCart ? 'text-secondary' : ''}`}
                          onClick={handleAddToCart}
                          disabled={inCart}
                        >
                          <i className={`bi ${inCart ? 'bi-cart-check-fill' : 'bi-cart-plus'} me-1`}></i>
                          {inCart ? 'Đã trong giỏ' : 'Thêm vào giỏ'}
                        </Button>
                        <Button
                          variant={wishlistAdded ? 'danger' : 'outline-secondary'}
                          className={`flex-shrink-0 rounded-pill px-3 ${wishlistAdded ? 'border-danger text-white' : ''}`}
                          onClick={handleToggleWishlist}
                          title={wishlistAdded ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
                        >
                          <i className={`bi ${wishlistAdded ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                        </Button>
                      </div>
                    )}

                    {canAccess && (
                      <Button
                        variant={wishlistAdded ? 'danger' : 'outline-secondary'}
                        className={`w-100 mb-3 py-2 rounded-pill fw-semibold border ${wishlistAdded ? 'text-white' : ''}`}
                        onClick={handleToggleWishlist}
                      >
                        <i className={`bi ${wishlistAdded ? 'bi-heart-fill' : 'bi-heart'} me-2`}></i>
                        {wishlistAdded ? 'Đã lưu yêu thích' : 'Lưu vào yêu thích'}
                      </Button>
                    )}

                    <ListGroup variant="flush" className="mt-4 pt-3 border-top">
                      <ListGroup.Item className="px-0 border-0 py-2 text-secondary bg-transparent d-flex align-items-center">
                        <i className="bi bi-infinity fs-5 text-primary me-3"></i> Truy cập trọn đời
                      </ListGroup.Item>
                      <ListGroup.Item className="px-0 border-0 py-2 text-secondary bg-transparent d-flex align-items-center">
                        <i className="bi bi-collection fs-5 text-primary me-3"></i> {flashcardCount} thẻ từ vựng
                      </ListGroup.Item>
                      <ListGroup.Item className="px-0 border-0 py-2 text-secondary bg-transparent d-flex align-items-center">
                        <i className="bi bi-person-video3 fs-5 text-primary me-3"></i> Giáo viên: <strong className="text-dark ms-1">{course.teacherName || 'Chuyên gia IELTS'}</strong>
                      </ListGroup.Item>
                      <ListGroup.Item className="px-0 border-0 py-2 text-secondary bg-transparent d-flex align-items-center">
                        <i className="bi bi-patch-check fs-5 text-primary me-3"></i> Chứng nhận hoàn thành
                      </ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}
