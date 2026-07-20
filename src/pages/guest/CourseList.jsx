import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import { freeResources, RESOURCE_SKILLS } from '../../data/freeResources';
import { testService } from '../../services/testService';
import { getCurrentUser } from '../../services/authService';
import './CourseList.css';

const skillVariant = {
  Reading: 'primary',
  Listening: 'info',
  Writing: 'success',
  Speaking: 'warning',
  Vocabulary: 'secondary',
  Grammar: 'danger',
};

const skillIcon = {
  Reading: 'bi-book',
  Listening: 'bi-headphones',
  Writing: 'bi-pencil-square',
  Speaking: 'bi-mic',
};

const allSkill = RESOURCE_SKILLS[0];

export default function CourseList() {
  const user = getCurrentUser();
  const [skill, setSkill] = useState(allSkill);
  const [search, setSearch] = useState('');
  const [freeTests, setFreeTests] = useState([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadFreeTests = async () => {
      setIsLoadingTests(true);
      try {
        const data = await testService.getFreeTests();
        if (!ignore) setFreeTests(data);
      } catch (_) {
        if (!ignore) setFreeTests([]);
      } finally {
        if (!ignore) setIsLoadingTests(false);
      }
    };

    loadFreeTests();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredResources = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return freeResources.filter((item) => {
      const matchSkill = skill === allSkill || item.skill === skill;
      const matchSearch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.excerpt.toLowerCase().includes(keyword);
      return matchSkill && matchSearch;
    });
  }, [skill, search]);

  const filteredTests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return freeTests.filter((test) => {
      const matchSkill = skill === allSkill || test.skill === skill;
      const matchSearch =
        !keyword ||
        test.title.toLowerCase().includes(keyword) ||
        (test.description || '').toLowerCase().includes(keyword);
      return matchSkill && matchSearch;
    });
  }, [freeTests, skill, search]);

  return (
    <div className="resource-page bg-light">
      <header className="resource-hero text-white">
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <Badge bg="light" text="dark" className="mb-3 px-3 py-2 rounded-pill text-uppercase">
                Free IELTS Hub
              </Badge>
              <h1 className="display-5 fw-bold mb-3">Tài nguyên luyện thi IELTS miễn phí</h1>
              <p className="fs-5 mb-0 text-white-50">
                Đọc bài hướng dẫn, luyện test miễn phí và thử sức với format IELTS trước khi đăng ký khóa học.
              </p>
            </Col>
          </Row>
        </Container>
      </header>

      <Container className="pb-5">
        <Card className="resource-toolbar border-0 shadow-sm">
          <Card.Body className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
            <div className="d-flex flex-wrap gap-2">
              {RESOURCE_SKILLS.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={skill === item ? 'primary' : 'outline-secondary'}
                  className="rounded-pill px-3"
                  onClick={() => setSkill(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
            <InputGroup className="resource-search">
              <InputGroup.Text className="bg-white border-end-0">
                <i className="bi bi-search" />
              </InputGroup.Text>
              <Form.Control
                className="border-start-0"
                placeholder="Tìm tài nguyên hoặc test..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </Card.Body>
        </Card>

        <section className="mt-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <div>
              <h2 className="h4 fw-bold mb-1">IELTS mock test miễn phí</h2>
              <p className="text-muted mb-0">
                Khách có thể làm tối đa 3 lượt. Muốn luyện tiếp, hệ thống sẽ gợi ý đăng ký tài khoản và mua khóa học.
              </p>
            </div>
            <Badge bg="success" className="rounded-pill px-3 py-2">
              {filteredTests.length} test
            </Badge>
          </div>

          {isLoadingTests ? (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center text-muted py-4">Đang tải test miễn phí...</Card.Body>
            </Card>
          ) : filteredTests.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center text-muted py-4">
                Chưa có test miễn phí phù hợp với bộ lọc hiện tại.
              </Card.Body>
            </Card>
          ) : (
            <Row className="g-4">
              {filteredTests.map((test) => (
                <Col key={test.id} md={6} lg={4}>
                  <Card className="resource-card h-100 border-0 shadow-sm">
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <Badge bg={skillVariant[test.skill] || 'primary'} className="rounded-pill px-3 py-2">
                          <i className={`bi ${skillIcon[test.skill] || 'bi-journal-text'} me-1`} />
                          {test.skill}
                        </Badge>
                        <span className="small text-muted">{test.durationMinutes} phút</span>
                      </div>
                      <Card.Title as="h3" className="fs-5 fw-bold mb-2">
                        <Link to={`/free-tests/${test.id}`} className="resource-card-title">
                          {test.title}
                        </Link>
                      </Card.Title>
                      <Card.Text className="text-muted small flex-grow-1">
                        {test.description || 'Bài test IELTS miễn phí theo format luyện thi.'}
                      </Card.Text>
                      <div className="d-flex align-items-center justify-content-between mt-2">
                        <span className="small text-muted">
                          {test.totalQuestions} câu - giới hạn {test.attemptLimit || 3} lượt
                        </span>
                        <Button
                          as={Link}
                          to={`/free-tests/${test.id}`}
                          variant="primary"
                          size="sm"
                          className="rounded-pill px-3"
                        >
                          Làm test
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </section>

        {filteredResources.length === 0 ? (
          <p className="text-center text-muted py-5 mb-0">Không tìm thấy tài nguyên phù hợp.</p>
        ) : (
          <Row className="g-4 mt-2">
            {filteredResources.map((item) => (
              <Col key={item.id} md={6} lg={4}>
                <Card className="resource-card h-100 border-0 shadow-sm">
                  <Link to={`/resources/${item.id}`} className="resource-card-media">
                    <Card.Img variant="top" src={item.image} alt={item.title} loading="lazy" />
                    <Badge bg={skillVariant[item.skill] || 'primary'} className="resource-card-skill">
                      {item.skill}
                    </Badge>
                  </Link>
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex align-items-center gap-2 small text-muted mb-2">
                      <span>{item.type}</span>
                      <span>-</span>
                      <span>{item.readingTime} phút đọc</span>
                    </div>
                    <Card.Title as="h3" className="fs-5 fw-bold mb-2">
                      <Link to={`/resources/${item.id}`} className="resource-card-title">
                        {item.title}
                      </Link>
                    </Card.Title>
                    <Card.Text className="text-muted small flex-grow-1">{item.excerpt}</Card.Text>
                    <div className="d-flex align-items-center justify-content-between mt-2">
                      <span className="small text-muted">{item.level}</span>
                      <Button
                        as={Link}
                        to={`/resources/${item.id}`}
                        variant="outline-primary"
                        size="sm"
                        className="rounded-pill px-3"
                      >
                        Đọc bài
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <Card className="resource-cta border-0 text-white text-center mt-5">
          <Card.Body className="py-5">
            <h2 className="fw-bold mb-2">Muốn luyện tập có lộ trình bài bản?</h2>
            <p className="mb-4 text-white-50">
              Khám phá khu luyện 4 kỹ năng tương tác hoặc các khóa học có giáo viên kèm cặp.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button as={Link} to="/skills" variant="light" className="fw-semibold px-4">
                Luyện 4 kỹ năng
              </Button>
              <Button as={Link} to={user?.role === 'student' ? '/learning/courses' : '/online-courses'} variant="outline-light" className="fw-semibold px-4">
                Xem khóa học IELTS
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
