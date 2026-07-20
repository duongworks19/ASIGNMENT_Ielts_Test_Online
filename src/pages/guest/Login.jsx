import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup, Spinner } from 'react-bootstrap';
import { getDashboardPathByRole, loginWithEmailAndPassword } from '../../services/authService';

export default function Login() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Đăng nhập | IELTS Master';
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const user = await loginWithEmailAndPassword(formData.email, formData.password);
      const fallbackPath = getDashboardPathByRole(user.role);
      let redirectPath = location.state?.from?.pathname || fallbackPath;
      
      if (user.role !== 'student' || redirectPath === '/') {
        redirectPath = fallbackPath;
      }
      
      navigate(redirectPath, { replace: true });
    } catch (loginError) {
      setError(loginError.message === 'Invalid email or password'
        ? 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
        : (loginError.message || 'Đăng nhập thất bại. Vui lòng thử lại.'));
      setStatus('error');
    }
  };

  const isLoading = status === 'loading';

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-gradient-hero)', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative' }}>
      <div className="tp-hero-dots">
        {Array(20).fill(0).map((_, i) => <span key={i}></span>)}
      </div>
      <Container className="position-relative" style={{ zIndex: 1, padding: '40px 0' }}>
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={9} xl={8}>
            <Card className="tp-card border-0 shadow-lg overflow-hidden">
              <Row className="g-0">
                {/* Brand Column */}
                <Col md={5} className="d-none d-md-flex flex-column justify-content-between p-5 text-white" style={{ background: 'var(--tp-gradient-hero-alt)' }}>
                  <div className="fw-bold fs-3 letter-spacing-1">
                    <i className="bi bi-mortarboard-fill me-2 text-warning"></i>
                    IELTS<span className="text-warning">Master</span>
                  </div>
                  <div>
                    <h2 className="h3 fw-bold mb-3 mt-4">Chào mừng trở lại 👋</h2>
                    <p className="mb-0 opacity-75 lh-lg">
                      Đăng nhập để tiếp tục hành trình chinh phục IELTS của bạn với lộ trình cá nhân hóa, flashcard và bài luyện 4 kỹ năng.
                    </p>
                  </div>
                  <ul className="list-unstyled mb-0 opacity-75 mt-5">
                    <li className="mb-3 d-flex align-items-center"><i className="bi bi-check2-circle fs-5 me-2 text-success"></i> Theo dõi tiến độ học tập</li>
                    <li className="mb-3 d-flex align-items-center"><i className="bi bi-check2-circle fs-5 me-2 text-success"></i> Kho tài nguyên miễn phí</li>
                    <li className="d-flex align-items-center"><i className="bi bi-check2-circle fs-5 me-2 text-success"></i> Luyện đề bám sát thực tế</li>
                  </ul>
                </Col>

                {/* Form Column */}
                <Col md={7} className="p-4 p-md-5 bg-white">
                  <div className="text-center mb-4">
                    <h1 className="h3 fw-bold mb-2 text-dark">Đăng nhập</h1>
                    <p className="text-muted">
                      Chưa có tài khoản? <Link to="/register" className="fw-semibold text-primary text-decoration-none">Đăng ký miễn phí</Link>
                    </p>
                  </div>

                  {error && <Alert variant="danger" className="py-2 small border-0 rounded-3 text-center mb-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</Alert>}

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-4" controlId="loginEmail">
                      <Form.Label className="fw-semibold text-dark small mb-2">Địa chỉ email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="ban@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        size="lg"
                        className="tp-input rounded-3 bg-light"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="loginPassword">
                      <Form.Label className="fw-semibold text-dark small mb-2 d-flex justify-content-between">
                        <span>Mật khẩu</span>
                        <a href="#reset" className="text-decoration-none text-primary fw-medium">Quên mật khẩu?</a>
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Nhập mật khẩu"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          size="lg"
                          className="tp-input rounded-start-3 bg-light"
                          style={{ borderRight: 'none' }}
                        />
                        <Button
                          variant="light"
                          className="border bg-light text-muted rounded-end-3 px-3"
                          style={{ borderLeft: 'none' }}
                          onClick={() => setShowPassword((s) => !s)}
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    <Button
                      type="submit"
                      className="tp-btn-primary w-100 fw-bold mt-4 mb-4 py-3 rounded-pill"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><Spinner as="span" animation="border" size="sm" className="me-2" />Đang đăng nhập...</>
                      ) : (
                        'Đăng nhập ngay'
                      )}
                    </Button>

                    <div className="text-center">
                      <Link to="/" className="small text-secondary text-decoration-none fw-medium tp-btn-hover">
                        <i className="bi bi-arrow-left me-1"></i> Quay lại trang chủ
                      </Link>
                    </div>
                  </Form>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
