import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup, Spinner } from 'react-bootstrap';
import { getDashboardPathByRole, isPathAllowedForRole } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Đăng nhập | IELTS Master';
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
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
      const user = await login(formData.email.trim().toLowerCase(), formData.password);
      const fallbackPath = getDashboardPathByRole(user.role);
      const requestedLocation = location.state?.from;
      const requestedPath = requestedLocation?.pathname;
      let redirectPath = requestedPath
        ? `${requestedPath}${requestedLocation.search || ''}${requestedLocation.hash || ''}`
        : fallbackPath;

      if (user.role === 'admin'
        || !requestedPath?.startsWith('/')
        || !isPathAllowedForRole(requestedPath, user.role)
        || requestedPath === '/') {
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
    <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '40px 0' }}>
      {/* Decorative orbs */}
      <div style={{ position: 'absolute', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%)', top: '-15%', right: '-5%', borderRadius: '50%', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)', bottom: '-20%', left: '-10%', borderRadius: '50%', pointerEvents: 'none' }}></div>
      
      <Container className="position-relative" style={{ zIndex: 1 }}>
        <Row className="justify-content-center">
          <Col xs={12} md={11} lg={10} xl={9}>
            <Card className="border-0 shadow-lg overflow-hidden" style={{ borderRadius: '24px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)' }}>
              <Row className="g-0">
                {/* Brand Column */}
                <Col md={5} className="d-none d-md-flex flex-column justify-content-between p-5 text-white" style={{ background: 'linear-gradient(150deg, #312e81 0%, #4f46e5 100%)', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)', top: '-10%', right: '-10%', borderRadius: '50%' }}></div>
                   
                  <div className="position-relative z-1">
                    <div className="fw-bold fs-3 mb-5 d-flex align-items-center">
                      <i className="bi bi-mortarboard-fill me-2" style={{ color: '#fbbf24' }}></i>
                      IELTS<span style={{ color: '#fbbf24' }}>Master</span>
                    </div>
                    <div>
                      <h2 className="h3 fw-bold mb-3">Chào mừng trở lại 👋</h2>
                      <p className="mb-0 opacity-75 lh-lg" style={{ fontSize: '0.95rem' }}>
                        Đăng nhập để tiếp tục hành trình chinh phục IELTS của bạn với lộ trình cá nhân hóa, flashcard và bài luyện 4 kỹ năng.
                      </p>
                    </div>
                  </div>
                  
                  <ul className="list-unstyled mb-0 opacity-75 mt-5 position-relative z-1" style={{ fontSize: '0.9rem' }}>
                    <li className="mb-3 d-flex align-items-center"><i className="bi bi-check-circle-fill me-2 text-success"></i> Theo dõi tiến độ học tập</li>
                    <li className="mb-3 d-flex align-items-center"><i className="bi bi-check-circle-fill me-2 text-success"></i> Kho tài nguyên miễn phí</li>
                    <li className="d-flex align-items-center"><i className="bi bi-check-circle-fill me-2 text-success"></i> Luyện đề bám sát thực tế</li>
                  </ul>
                </Col>

                {/* Form Column */}
                <Col md={7} className="p-4 p-md-5">
                  <div className="text-center mb-4 pb-2">
                    <h1 className="h3 fw-bold mb-2" style={{ color: '#0f172a' }}>Đăng nhập</h1>
                    <p className="text-muted" style={{ fontSize: '0.95rem' }}>
                      Chưa có tài khoản? <Link to="/register" className="fw-bold text-decoration-none" style={{ color: '#4f46e5' }}>Đăng ký miễn phí</Link>
                    </p>
                  </div>

                  {error && (
                    <Alert variant="danger" className="py-3 border-0 rounded-4 text-center mb-4 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '0.9rem' }}>
                      <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i> {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit} className="animate__animated animate__fadeIn">
                    <Form.Group className="mb-4" controlId="loginEmail">
                      <Form.Label className="fw-semibold small mb-2" style={{ color: '#475569' }}>Địa chỉ email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Ví dụ: ban@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        size="lg"
                        className="rounded-4 border-0 bg-light"
                        style={{ padding: '14px 20px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="loginPassword">
                      <div className="d-flex justify-content-between mb-2">
                         <Form.Label className="fw-semibold small mb-0" style={{ color: '#475569' }}>Mật khẩu</Form.Label>
                         <Link to="/forgot-password" className="text-decoration-none fw-medium small" style={{ color: '#4f46e5' }}>Quên mật khẩu?</Link>
                      </div>
                      <InputGroup className="rounded-4 overflow-hidden bg-light" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Nhập mật khẩu..."
                          value={formData.password}
                          onChange={handleChange}
                          required
                          size="lg"
                          className="border-0 bg-transparent shadow-none"
                          style={{ padding: '14px 20px' }}
                        />
                        <Button
                          variant="link"
                          className="border-0 text-muted px-4 text-decoration-none bg-light"
                          onClick={() => setShowPassword((s) => !s)}
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-100 fw-bold mt-2 mb-4 border-0 shadow-sm"
                      style={{ padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', transition: 'all 0.3s', color: 'white' }}
                    >
                      {isLoading ? (
                        <><Spinner as="span" animation="border" size="sm" className="me-2" /> Đang đăng nhập...</>
                      ) : (
                        'Đăng nhập ngay'
                      )}
                    </Button>

                    <div className="text-center mt-2">
                      <Link to="/" className="text-decoration-none fw-medium d-inline-flex align-items-center" style={{ color: '#64748b', fontSize: '0.95rem' }}>
                        <i className="bi bi-arrow-left me-2"></i> Quay lại trang chủ
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
