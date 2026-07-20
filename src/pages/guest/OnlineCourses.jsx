import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { getCourses } from '../../services/courseLearning.service';
import { formatVnd } from '../../services/paymentService';
import { getCurrentUser, getDashboardPathByRole } from '../../services/authService';

const SKILLS = ['Tất cả', 'Reading', 'Listening', 'Writing', 'Speaking'];

export default function OnlineCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skill, setSkill] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const user = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    let ignore = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await getCourses({ page: 1, limit: 50 });
        if (!ignore) setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!ignore) setError(err.message || 'Không tải được danh sách khóa học.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (user?.role === 'student') {
      navigate('/learning/courses', { replace: true });
    } else if (user && user.role !== 'student') {
      navigate(getDashboardPathByRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchSkill = skill === 'Tất cả' || c.skill === skill;
      const keyword = search.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        (c.title || '').toLowerCase().includes(keyword) ||
        (c.description || '').toLowerCase().includes(keyword);
      return matchSkill && matchSearch;
    });
  }, [courses, skill, search]);

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-book-half"></i> Khóa học IELTS</div>
            <h1 className="tp-page-title">Chinh phục IELTS cùng lộ trình bài bản</h1>
            <p className="tp-page-sub">
              Khóa học bám sát 4 kỹ năng, tích hợp flashcard từ vựng trọng tâm và bài tập thực chiến. Chọn khóa phù hợp với mục tiêu band điểm của bạn.
            </p>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">
          
          {/* FILTER */}
          <Card className="studio-filter-card mb-4">
            <Row className="g-3 align-items-center">
              <Col md={8}>
                <div className="d-flex gap-2 flex-wrap">
                  {SKILLS.map((s) => (
                    <Button
                      key={s}
                      variant={skill === s ? 'primary' : 'outline-secondary'}
                      size="sm"
                      className={`rounded-pill px-3 fw-medium ${skill === s ? 'shadow-sm' : ''}`}
                      onClick={() => setSkill(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </Col>
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Tìm khóa học theo tên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="tp-input rounded-pill px-4"
                />
              </Col>
            </Row>
          </Card>

          {/* CONTENT */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="alert alert-danger shadow-sm border-0 rounded-4">{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-5 text-muted bg-white rounded-4 shadow-sm border">
              <i className="bi bi-search fs-1 mb-3 d-block"></i>
              <p className="mb-0 fw-medium">Không tìm thấy khóa học phù hợp.</p>
            </div>
          )}

          <Row className="g-4">
            {filtered.map((course) => {
              const isFree = !course.price || course.price === 0;
              const thumbnailSrc = course.thumbnail || 'https://via.placeholder.com/600x380?text=Course';
              const targetPath = user?.role === 'student' ? `/learning/courses/${course.id}` : `/courses/${course.id}`;
              
              return (
                <Col lg={4} md={6} key={course.id}>
                  <Card className="tp-card h-100 overflow-hidden border-0">
                    <div className="position-relative">
                      <Card.Img 
                        variant="top" 
                        src={thumbnailSrc} 
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://via.placeholder.com/600x380?text=Course';
                        }}
                      />
                      <Badge 
                        bg={isFree ? 'success' : 'warning'} 
                        text={isFree ? 'white' : 'dark'}
                        className="position-absolute top-0 end-0 m-3 px-3 py-2 rounded-pill shadow-sm"
                      >
                        {isFree ? 'Miễn phí' : 'Trả phí'}
                      </Badge>
                      <Badge 
                        bg="light" 
                        text="dark"
                        className="position-absolute bottom-0 start-0 m-3 px-3 py-2 rounded-pill shadow-sm"
                      >
                        {course.skill}
                      </Badge>
                    </div>
                    <Card.Body className="d-flex flex-column p-4">
                      <div className="d-flex justify-content-between align-items-center mb-2 text-muted small fw-medium">
                        <span><i className="bi bi-star-fill text-warning me-1"></i> {course.rating || '4.5'}</span>
                        <span><i className="bi bi-people-fill me-1"></i> {course.enrolledCount || 0}</span>
                        <span><i className="bi bi-calendar3 me-1"></i> {course.durationWeeks || 0} tuần</span>
                      </div>
                      <Card.Title className="fw-bold mb-3 lh-base">
                        <Link to={targetPath} className="text-decoration-none text-dark stretched-link">
                          {course.title}
                        </Link>
                      </Card.Title>
                      <Card.Text className="text-secondary small mb-4 flex-grow-1">
                        {course.description?.substring(0, 100)}{course.description?.length > 100 ? '...' : ''}
                      </Card.Text>
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <span className="fs-5 fw-bold text-primary">
                          {isFree ? 'Miễn phí' : formatVnd(course.price)}
                        </span>
                        <Button as={Link} to={targetPath} variant="light" className="rounded-pill px-4 fw-medium border shadow-sm tp-btn-hover">
                          Chi tiết
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

        </Container>
      </div>
    </div>
  );
}
