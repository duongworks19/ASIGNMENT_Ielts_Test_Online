import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup, Spinner } from 'react-bootstrap';
import { registerNewUser } from '../../services/authService';

const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

export default function Register() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Đăng ký tài khoản | IELTS Master';
  }, []);

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '',
    day: '', month: '', year: '', agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fullName = `${formData.lastName} ${formData.firstName}`.trim();
      const userData = {
        email: formData.email,
        password: formData.password,
        fullName,
        name: fullName,
        dateOfBirth: `${formData.year}-${formData.month}-${formData.day}`,
      };
      await registerNewUser(userData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message === 'Email is already registered'
        ? 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.'
        : (err.message || 'Đăng ký thất bại. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

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
                    <h2 className="h3 fw-bold mb-3 mt-4">Bắt đầu miễn phí 🚀</h2>
                    <p className="mb-0 opacity-75 lh-lg">
                      Tạo tài khoản để mở khóa toàn bộ tài nguyên học tập, lưu tiến độ và đăng ký các khóa học IELTS chuyên sâu.
                    </p>
                  </div>
                  <ul className="list-unstyled mb-0 opacity-75 mt-5">
                    <li className="mb-3 d-flex align-items-center"><i className="bi bi-check2-circle fs-5 me-2 text-success"></i> Hoàn toàn miễn phí</li>
                    <li className="mb-3 d-flex align-items-center"><i className="bi bi-check2-circle fs-5 me-2 text-success"></i> Lưu lộ trình học cá nhân</li>
                    <li className="d-flex align-items-center"><i className="bi bi-check2-circle fs-5 me-2 text-success"></i> Truy cập kho flashcard</li>
                  </ul>
                </Col>

                {/* Form Column */}
                <Col md={7} className="p-4 p-md-5 bg-white">
                  <div className="text-center mb-4">
                    <h1 className="h3 fw-bold mb-2 text-dark">Đăng ký tài khoản</h1>
                    <p className="text-muted">
                      Đã có tài khoản? <Link to="/login" className="fw-semibold text-primary text-decoration-none">Đăng nhập</Link>
                    </p>
                  </div>

                  {error && <Alert variant="danger" className="py-2 small border-0 rounded-3 text-center mb-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</Alert>}
                  {success && <Alert variant="success" className="py-2 small border-0 rounded-3 text-center mb-4"><i className="bi bi-check-circle-fill me-2"></i>Đăng ký thành công! Đang chuyển hướng...</Alert>}

                  <Form onSubmit={handleSubmit}>
                    <Row className="g-3">
                      <Col sm={6}>
                        <Form.Group controlId="lastName">
                          <Form.Label className="fw-semibold text-dark small mb-2">Họ và tên đệm</Form.Label>
                          <Form.Control
                            name="lastName" placeholder="Nguyễn Văn"
                            value={formData.lastName} onChange={handleChange} required
                            className="tp-input bg-light rounded-3"
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group controlId="firstName">
                          <Form.Label className="fw-semibold text-dark small mb-2">Tên</Form.Label>
                          <Form.Control
                            name="firstName" placeholder="An"
                            value={formData.firstName} onChange={handleChange} required
                            className="tp-input bg-light rounded-3"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mt-3" controlId="registerEmail">
                      <Form.Label className="fw-semibold text-dark small mb-2">Email</Form.Label>
                      <Form.Control
                        type="email" name="email" placeholder="ban@email.com"
                        value={formData.email} onChange={handleChange} required
                        className="tp-input bg-light rounded-3"
                      />
                    </Form.Group>

                    <Form.Group className="mt-3" controlId="registerPassword">
                      <Form.Label className="fw-semibold text-dark small mb-2">Mật khẩu</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          name="password" placeholder="Tối thiểu 6 ký tự"
                          value={formData.password} onChange={handleChange} required
                          className="tp-input bg-light rounded-start-3"
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

                    <Form.Group className="mt-3">
                      <Form.Label className="fw-semibold text-dark small mb-1">Ngày sinh</Form.Label>
                      <div className="text-muted small mb-2">Giúp chúng tôi gợi ý nội dung phù hợp với bạn.</div>
                      <Row className="g-2">
                        <Col xs={4}>
                          <Form.Select name="day" value={formData.day} onChange={handleChange} required aria-label="Ngày" className="tp-input bg-light rounded-3">
                            <option value="">Ngày</option>
                            {[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                          </Form.Select>
                        </Col>
                        <Col xs={4}>
                          <Form.Select name="month" value={formData.month} onChange={handleChange} required aria-label="Tháng" className="tp-input bg-light rounded-3">
                            <option value="">Tháng</option>
                            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                          </Form.Select>
                        </Col>
                        <Col xs={4}>
                          <Form.Select name="year" value={formData.year} onChange={handleChange} required aria-label="Năm" className="tp-input bg-light rounded-3">
                            <option value="">Năm</option>
                            {[...Array(100)].map((_, i) => {
                              const year = new Date().getFullYear() - i;
                              return <option key={year} value={year}>{year}</option>;
                            })}
                          </Form.Select>
                        </Col>
                      </Row>
                    </Form.Group>

                    <Form.Group className="mt-3" controlId="agreeTerms">
                      <Form.Check
                        type="checkbox" name="agreeTerms" required
                        checked={formData.agreeTerms} onChange={handleChange}
                        className="custom-control-input"
                        label={<span className="small text-secondary">Tôi đồng ý với <a href="#terms" className="text-primary text-decoration-none fw-medium">Điều khoản sử dụng</a> của IELTS Master.</span>}
                      />
                    </Form.Group>

                    <Button
                      type="submit" size="lg"
                      className="tp-btn-primary w-100 fw-bold mt-4 mb-4 py-3 rounded-pill"
                      disabled={loading || success}
                    >
                      {loading ? (
                        <><Spinner as="span" animation="border" size="sm" className="me-2" />Đang tạo tài khoản...</>
                      ) : 'Tạo tài khoản'}
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
