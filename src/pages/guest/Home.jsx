import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { getCurrentUser, getDashboardPathByRole } from '../../services/authService';

const stats = [
  { value: '4', label: 'kỹ năng được luyện tập đầy đủ trong mỗi khóa học' },
  { value: '6+', label: 'khóa học IELTS từ cơ bản đến nâng cao' },
  { value: '200+', label: 'thẻ flashcard từ vựng trọng tâm theo khóa' },
  { value: '100%', label: 'tài nguyên miễn phí để bạn thử sức trước' },
];

const skills = [
  {
    title: 'Listening',
    text: 'Rèn khả năng nghe hiểu tiếng Anh, theo dõi hội thoại và nắm bắt thông tin, quan điểm quan trọng.',
  },
  {
    title: 'Reading',
    text: 'Rèn khả năng hiểu ý chính, chi tiết và hàm ý qua nhiều dạng văn bản khác nhau.',
  },
  {
    title: 'Writing',
    text: 'Rèn khả năng sắp xếp ý tưởng, trả lời đúng yêu cầu và dùng từ vựng, ngữ pháp chính xác.',
  },
  {
    title: 'Speaking',
    text: 'Rèn khả năng giao tiếp rõ ràng, trôi chảy trong các tình huống hội thoại thực tế.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const coursesPath = user?.role === 'student' ? '/learning/courses' : '/online-courses';

  const preparationOptions = [
    {
      eyebrow: 'Khóa học • Có giảng viên',
      title: 'Khóa học IELTS chuyên sâu',
      lead: 'Học theo lộ trình',
      intro: 'Lộ trình bài bản cho từng mục tiêu band điểm:',
      bullets: [
        'Bám sát 4 kỹ năng Listening, Reading, Writing, Speaking',
        'Giáo trình chi tiết theo từng tuần',
        'Thanh toán nhanh bằng VietQR, truy cập trọn đời',
        'Kèm flashcard từ vựng trọng tâm cho mỗi khóa',
      ],
      bestFor: 'Phù hợp khi bạn muốn học có hệ thống và mục tiêu rõ ràng.',
      to: coursesPath,
      cta: 'Xem khóa học',
    },
    {
      eyebrow: 'Miễn phí',
      title: 'Tài nguyên luyện thi miễn phí',
      lead: 'Miễn phí',
      intro: 'Bắt đầu làm quen với IELTS mà không tốn chi phí:',
      bullets: [
        'Bài luyện tập theo từng kỹ năng',
        'Tài liệu và mẹo làm bài từ chuyên gia',
        'Trải nghiệm trước khi đăng ký khóa trả phí',
      ],
      bestFor: 'Phù hợp khi bạn mới bắt đầu và muốn thử sức.',
      to: '/courses',
      cta: 'Khám phá tài nguyên',
    },
    {
      eyebrow: 'Học từ vựng',
      title: 'Flashcard từ vựng IELTS',
      lead: 'Đi kèm mỗi khóa học',
      intro: 'Ghi nhớ từ vựng nhanh và lâu hơn:',
      bullets: [
        'Bộ thẻ từ vựng gắn riêng cho từng khóa học',
        'Học theo phương pháp lật thẻ chủ động',
        'Đánh dấu thẻ đã thuộc để theo dõi tiến độ',
      ],
      bestFor: 'Phù hợp khi bạn muốn mở rộng vốn từ mỗi ngày.',
      to: coursesPath,
      cta: 'Bắt đầu học từ',
    },
  ];

  useEffect(() => {
    if (user && user.role !== 'student') {
      navigate(getDashboardPathByRole(user.role), { replace: true });
    }
  }, [navigate, user]);

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      
      {/* ── HERO ── */}
      <div className="tp-hero" style={{ padding: '80px 0 60px' }}>
        <div className="tp-hero-dots">
          {Array(15).fill(0).map((_, i) => <span key={i}></span>)}
        </div>
        <div className="tp-hero-inner">
          <Container fluid="xxl" className="px-4">
            <Row className="align-items-center g-5">
              <Col lg={6}>
                <div className="tp-hero-badge">
                  <i className="bi bi-mortarboard-fill"></i>
                  Luyện thi IELTS trực tuyến
                </div>
                <h1 className="tp-hero-title mb-4">
                  Chinh phục IELTS với <span>lộ trình học thông minh</span>
                </h1>
                <p className="tp-hero-sub mb-4">
                  Đạt band điểm mục tiêu cùng khóa học bài bản, tài nguyên miễn phí và flashcard từ vựng đi kèm. Trải nghiệm phương pháp học tiên tiến nhất.
                </p>
                <div className="tp-hero-actions">
                  <Link to={coursesPath} className="tp-btn-primary" style={{ padding: '14px 28px', fontSize: '1.1rem' }}>
                    <i className="bi bi-rocket-takeoff-fill"></i> Khám phá khóa học
                  </Link>
                  <Link to="/register" className="btn btn-outline-light rounded-pill fw-semibold border-2" style={{ padding: '12px 28px', fontSize: '1.1rem' }}>
                    Đăng ký miễn phí
                  </Link>
                </div>
              </Col>
              <Col lg={6} className="d-none d-lg-block">
                <div className="position-relative">
                  <div className="position-absolute bg-white rounded-circle opacity-10" style={{ width: '400px', height: '400px', top: '-50px', right: '-50px', filter: 'blur(40px)' }}></div>
                  <img
                    className="img-fluid rounded-4 shadow-lg position-relative"
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85"
                    alt="Học viên đang luyện thi IELTS trực tuyến với tai nghe"
                    style={{ zIndex: 1, border: '4px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">
          
          {/* ===== HÌNH THỨC HỌC ===== */}
          <section className="mb-5 pb-4">
            <div className="text-center mb-5">
              <h2 className="fw-bold mb-3 text-dark">Hình thức luyện thi cho mọi mục tiêu</h2>
              <p className="fs-6 text-secondary mb-0 mx-auto" style={{ maxWidth: '720px' }}>
                Chọn cách học phù hợp với thời gian và band điểm bạn nhắm tới, từ khóa học có giảng viên đến tài nguyên miễn phí và flashcard từ vựng.
              </p>
            </div>
            <Row className="g-4">
              {preparationOptions.map((option) => (
                <Col md={6} lg={4} key={option.title}>
                  <Card className="tp-card h-100 border-0">
                    <Card.Body className="d-flex flex-column p-4">
                      <span className="text-primary fw-bold text-uppercase small mb-3 letter-spacing-1">
                        {option.eyebrow}
                      </span>
                      <Card.Title as="h3" className="h4 fw-bold mb-3 text-dark">
                        {option.title}
                      </Card.Title>
                      <p className="fw-semibold text-dark mb-2">{option.lead}</p>
                      <p className="text-secondary mb-4">{option.intro}</p>
                      <ul className="list-unstyled d-flex flex-column gap-3 mb-4">
                        {option.bullets.map((bullet) => (
                          <li key={bullet} className="d-flex gap-3 align-items-start">
                            <i className="bi bi-check-circle-fill text-success fs-5 mt-n1"></i>
                            <span className="text-secondary">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-4 border-top">
                        <p className="text-secondary fst-italic small mb-3">{option.bestFor}</p>
                        <Button
                          as={Link}
                          to={option.to}
                          className="tp-btn-primary w-100 justify-content-center"
                        >
                          {option.cta}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>

          {/* ===== THỐNG KÊ ===== */}
          <section className="mb-5 py-5 rounded-4 px-4" style={{ background: 'var(--tp-gradient-hero-alt)' }}>
            <div className="text-center mb-5">
              <h2 className="fw-bold mb-0 mx-auto text-white" style={{ maxWidth: '760px' }}>
                IELTS là chứng chỉ tiếng Anh hàng đầu cho học tập, làm việc và định cư
              </h2>
            </div>
            <Row className="g-4">
              {stats.map((item) => (
                <Col xs={6} lg={3} key={item.label}>
                  <div className="text-center">
                    <div className="display-4 fw-bold text-white mb-2">{item.value}</div>
                    <p className="text-white-50 mt-3 mb-0 mx-auto small" style={{ maxWidth: '220px' }}>
                      {item.label}
                    </p>
                  </div>
                </Col>
              ))}
            </Row>
          </section>

          {/* ===== 4 KỸ NĂNG ===== */}
          <section className="mb-5 pb-4">
            <div className="text-center mb-5">
              <h2 className="fw-bold mb-3 text-dark">Tối đa điểm số ở cả bốn kỹ năng</h2>
              <p className="fs-6 text-secondary mb-0 mx-auto" style={{ maxWidth: '820px' }}>
                Bài thi IELTS đánh giá khả năng nghe, đọc, viết và nói của bạn. Hãy luyện tập có trọng tâm cùng sự hỗ trợ từ chuyên gia để thể hiện tốt nhất ở từng kỹ năng.
              </p>
            </div>
            <Row className="g-4">
              {skills.map((skill) => (
                <Col md={6} key={skill.title}>
                  <Card className="tp-card h-100 border-0">
                    <Card.Body className="p-4 d-flex gap-3">
                      <div className="text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                        <i className="bi bi-star-fill fs-5"></i>
                      </div>
                      <div>
                        <Card.Title as="h3" className="h5 fw-bold text-dark mb-2">
                          {skill.title}
                        </Card.Title>
                        <p className="text-secondary mb-0 lh-lg">{skill.text}</p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            
            <div className="text-center mt-5">
              <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '900px' }}>
                Lộ trình học sẽ tập trung vào những kỹ năng bạn cần cải thiện nhất, dựa trên trình độ và mục tiêu của bạn. Với hướng dẫn từ chuyên gia và luyện tập có trọng tâm, bạn sẽ tự tin nâng cao kết quả IELTS.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-3">
                <Button as={Link} to={coursesPath} className="tp-btn-primary px-4 py-2">
                  <i className="bi bi-book me-2"></i> Xem tất cả khóa học
                </Button>
                <Button as={Link} to="/register" variant="outline-primary" className="rounded-pill px-4 py-2 fw-semibold">
                  Đăng ký miễn phí
                </Button>
              </div>
            </div>
          </section>

        </Container>
      </div>
    </div>
  );
}
