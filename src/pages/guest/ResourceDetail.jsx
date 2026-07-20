import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Breadcrumb } from 'react-bootstrap';
import { getResourceById, getRelatedResources } from '../../data/freeResources';
import './ResourceDetail.css';

const skillVariant = {
  Reading: 'primary',
  Listening: 'info',
  Writing: 'success',
  Speaking: 'warning',
  Vocabulary: 'secondary',
  Grammar: 'danger',
};

export default function ResourceDetail() {
  const { id } = useParams();
  const resource = getResourceById(id);
  const related = getRelatedResources(resource);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!resource) {
    return (
      <Container className="py-5 text-center">
        <h1 className="h3 fw-bold mb-3">Không tìm thấy tài nguyên</h1>
        <p className="text-muted mb-4">Bài viết bạn tìm có thể đã được di chuyển hoặc không tồn tại.</p>
        <Button as={Link} to="/courses" variant="primary">
          ← Về trang tài nguyên
        </Button>
      </Container>
    );
  }

  return (
    <div className="article-page bg-light">
      {/* HERO */}
      <header
        className="article-hero text-white"
        style={{ backgroundImage: `url(${resource.image})` }}
      >
        <div className="article-hero-overlay">
          <Container className="py-5">
            <Breadcrumb listProps={{ className: 'mb-3 small' }}>
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>Trang chủ</Breadcrumb.Item>
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/courses' }}>Tài nguyên</Breadcrumb.Item>
              <Breadcrumb.Item active>{resource.skill}</Breadcrumb.Item>
            </Breadcrumb>
            <Badge bg={skillVariant[resource.skill] || 'primary'} className="mb-3 px-3 py-2">
              {resource.skill} • {resource.type}
            </Badge>
            <h1 className="display-6 fw-bold mb-3" style={{ maxWidth: 760 }}>
              {resource.title}
            </h1>
            <div className="d-flex flex-wrap gap-3 small">
              <span>🎯 {resource.level}</span>
              <span>⏱ {resource.readingTime} phút đọc</span>
              <span>🗓 {resource.date}</span>
            </div>
          </Container>
        </div>
      </header>

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4 p-md-5">
                <p className="lead text-secondary">{resource.excerpt}</p>
                <hr className="my-4" />

                {resource.content.map((block, idx) => (
                  <section key={idx} className="mb-4">
                    {block.heading && (
                      <h2 className="h4 fw-bold mb-3 article-heading">{block.heading}</h2>
                    )}
                    {block.paragraphs?.map((p, i) => (
                      <p key={i} className="text-body-secondary mb-3">{p}</p>
                    ))}
                    {block.list && (
                      <ul className="article-list">
                        {block.list.map((li, i) => (
                          <li key={i} className="mb-2">{li}</li>
                        ))}
                      </ul>
                    )}
                    {block.tip && (
                      <div className="article-tip d-flex gap-3 align-items-start">
                        <span className="article-tip-icon">💡</span>
                        <p className="mb-0">{block.tip}</p>
                      </div>
                    )}
                  </section>
                ))}

                <hr className="my-4" />
                <div className="d-flex flex-wrap gap-3">
                  <Button as={Link} to="/skills" variant="primary" className="fw-semibold px-4">
                    Luyện tập kỹ năng này →
                  </Button>
                  <Button as={Link} to="/courses" variant="outline-secondary" className="px-4">
                    ← Tất cả tài nguyên
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* SIDEBAR */}
          <Col lg={4} className="mt-4 mt-lg-0">
            <Card className="border-0 shadow-sm article-cta-card text-white mb-4">
              <Card.Body className="p-4">
                <h3 className="h5 fw-bold mb-2">Học bài bản hơn?</h3>
                <p className="small text-white-50 mb-3">
                  Đăng ký tài khoản để mở khóa flashcard từ vựng và theo dõi tiến độ học tập.
                </p>
                <Button as={Link} to="/register" variant="light" size="sm" className="fw-semibold w-100">
                  Tạo tài khoản miễn phí
                </Button>
              </Card.Body>
            </Card>

            {related.length > 0 && (
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h3 className="h6 fw-bold text-uppercase text-muted mb-3">
                    Bài liên quan ({resource.skill})
                  </h3>
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      to={`/resources/${item.id}`}
                      className="article-related d-flex gap-3 align-items-center mb-3 text-decoration-none"
                    >
                      <img src={item.image} alt={item.title} loading="lazy" />
                      <span className="small fw-semibold text-dark">{item.title}</span>
                    </Link>
                  ))}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}
