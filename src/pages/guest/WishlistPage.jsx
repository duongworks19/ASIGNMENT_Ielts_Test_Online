import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { getWishlistItems, removeFromWishlist, subscribeWishlistChanges } from '../../services/wishlistService';
import { addToCart } from '../../services/cartService';
import { getCourseById } from '../../services/courseLearning.service';
import { getCurrentUser } from '../../services/authService';

const FALLBACK = 'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&w=600&q=80';

export default function WishlistPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const shoppingPath = user?.role === 'student' ? '/learning/courses' : '/online-courses';

  const [courseIds, setCourseIds] = useState(getWishlistItems());
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPrice = useMemo(() =>
    courses.reduce((s, c) => s + (c.price || 0), 0), [courses]);

  const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  useEffect(() => {
    if (courseIds.length === 0) { setCourses([]); setLoading(false); return; }
    let ignore = false;
    setLoading(true); setError('');
    Promise.all(courseIds.map(getCourseById))
      .then(res => { if (!ignore) setCourses(res.filter(Boolean)); })
      .catch(e => { if (!ignore) setError(e.message || 'Không thể tải danh sách yêu thích.'); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [JSON.stringify(courseIds)]);

  useEffect(() => {
    const unsub = subscribeWishlistChanges(() => setCourseIds(getWishlistItems()));
    return () => unsub();
  }, []);

  const handleRemove = (id) => { removeFromWishlist(id); setCourseIds(getWishlistItems()); };
  const handleMoveToCart = (id) => { addToCart(id); removeFromWishlist(id); setCourseIds(getWishlistItems()); navigate('/checkout'); };

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      
      {/* ── HERO ── */}
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-heart-fill"></i> Danh sách yêu thích</div>
            <h1 className="tp-page-title">Khóa học <span>yêu thích</span></h1>
            <p className="tp-page-sub">Những khóa học bạn đã lưu lại — hãy đăng ký ngay khi sẵn sàng!</p>
          </div>
          <div className="d-none d-md-block">
            <Button variant="outline-light" onClick={() => navigate(shoppingPath)} className="rounded-pill px-4 fw-medium border-2">
              <i className="bi bi-compass-fill me-2"></i>Tiếp tục khám phá
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
              <p className="mt-3 text-muted fw-semibold">Đang tải danh sách yêu thích...</p>
            </div>
          ) : courses.length === 0 ? (
            <Card className="tp-card border-0 text-center p-5 mx-auto" style={{ maxWidth: '600px' }}>
              <i className="bi bi-heart text-muted mb-3" style={{ fontSize: '4rem', opacity: 0.5 }}></i>
              <h4 className="fw-bold mb-2">Chưa có khóa học yêu thích</h4>
              <p className="text-secondary mb-4">Thêm khóa học vào yêu thích để lưu lại và mua sau.</p>
              <Button as={Link} to={shoppingPath} className="tp-btn-primary rounded-pill px-5 py-2 mx-auto" style={{ maxWidth: '240px' }}>
                <i className="bi bi-compass-fill me-2"></i>Khám phá khóa học
              </Button>
            </Card>
          ) : (
            <Row className="g-4">
              {/* ── COURSE LIST ── */}
              <Col lg={8}>
                <div className="d-flex flex-column gap-3">
                  {courses.map(course => (
                    <Card className="tp-card border-0 overflow-hidden" key={course.id}>
                      <div className="d-flex flex-column flex-sm-row">
                        <div className="position-relative">
                          <img
                            src={course.thumbnail || FALLBACK}
                            alt={course.title}
                            className="object-fit-cover"
                            style={{ width: '100%', height: '200px', maxWidth: 'sm:280px' }}
                            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK; }}
                          />
                          {course.skill && (
                            <Badge bg="light" text="dark" className="position-absolute top-0 start-0 m-3 shadow-sm rounded-pill px-3 py-2">
                              {course.skill}
                            </Badge>
                          )}
                        </div>

                        <Card.Body className="p-4 d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex gap-2">
                              {course.level && <Badge bg="light" text="secondary" className="border rounded-pill">{course.level}</Badge>}
                              {course.rating > 0 && <Badge bg="light" text="secondary" className="border rounded-pill"><i className="bi bi-star-fill text-warning me-1"></i>{course.rating}</Badge>}
                            </div>
                            <div className="fw-bold fs-5 text-primary">
                              {course.price > 0 ? fmt(course.price) : <span className="text-success">Miễn phí</span>}
                            </div>
                          </div>
                          
                          <Card.Title className="fw-bold fs-5 mb-2">{course.title}</Card.Title>
                          <p className="text-secondary small mb-3">
                            <i className="bi bi-person-circle me-1"></i>
                            {course.teacherName || course.teacherId || 'IELTS Expert'}
                          </p>
                          
                          <div className="mt-auto d-flex gap-2 flex-wrap">
                            <Button variant="primary" className="tp-btn-primary flex-grow-1 rounded-pill" onClick={() => handleMoveToCart(course.id)}>
                              <i className="bi bi-cart-plus-fill me-1"></i> Thêm vào giỏ
                            </Button>
                            <Button variant="outline-danger" className="rounded-pill flex-shrink-0 px-3" onClick={() => handleRemove(course.id)} title="Xóa khỏi yêu thích">
                              <i className="bi bi-trash-fill"></i>
                            </Button>
                          </div>
                        </Card.Body>
                      </div>
                    </Card>
                  ))}
                </div>
              </Col>

              {/* ── SUMMARY SIDEBAR ── */}
              <Col lg={4}>
                <div className="sticky-top" style={{ top: '90px' }}>
                  <Card className="tp-card border-0 shadow-sm">
                    <Card.Header className="bg-white border-bottom p-4 d-flex align-items-center">
                      <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-heart-fill fs-5"></i>
                      </div>
                      <h5 className="fw-bold mb-0 text-dark">Tổng quan</h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-secondary fw-medium">Khóa học đã lưu</span>
                        <strong className="text-dark fs-5">{courses.length}</strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="text-secondary fw-medium">Tổng giá trị</span>
                        <strong className="text-primary fs-4">{fmt(totalPrice)}</strong>
                      </div>
                      
                      <hr className="my-4 border-secondary border-opacity-25" />
                      
                      <Button variant="light" className="w-100 mb-3 fw-semibold py-2 border rounded-pill shadow-sm tp-btn-hover" onClick={() => navigate(shoppingPath)}>
                        <i className="bi bi-compass-fill me-2 text-primary"></i> Tiếp tục duyệt
                      </Button>
                      <Button variant="outline-primary" className="w-100 fw-semibold py-2 rounded-pill" onClick={() => navigate('/checkout')}>
                        <i className="bi bi-cart2 me-2"></i> Xem giỏ hàng
                      </Button>
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
