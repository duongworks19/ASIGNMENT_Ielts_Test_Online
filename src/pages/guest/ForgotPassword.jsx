import React, { useState, useEffect } from 'react';
import { Button, Card, Container, Form, Spinner, Row, Col, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Quên mật khẩu | IELTS Master';
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      setFieldError('Vui lòng nhập email hợp lệ.');
      return;
    }
    setFieldError('');
    setSubmitting(true);
    try {
      setResult(await requestPasswordReset(normalized));
    } catch (error) {
      setFieldError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ margin: '-16px -24px 0', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background elements */}
      <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%)', top: '-10%', right: '-5%', borderRadius: '50%', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)', bottom: '-15%', left: '-10%', borderRadius: '50%', pointerEvents: 'none' }}></div>

      <Container className="position-relative" style={{ zIndex: 1, padding: '40px 0' }}>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <Card className="border-0 shadow-lg overflow-hidden" style={{ borderRadius: '24px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)' }}>
              <div className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="mb-4 d-inline-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4f46e5' }}>
                    <i className="bi bi-shield-lock-fill fs-2"></i>
                  </div>
                  <h1 className="h3 fw-bold mb-2" style={{ color: '#0f172a' }}>Khôi phục mật khẩu</h1>
                  <p className="text-muted" style={{ fontSize: '0.95rem' }}>
                    Đừng lo lắng! Hãy nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu.
                  </p>
                </div>

                {result ? (
                  <div className="text-center animate__animated animate__fadeIn">
                    <div className="mb-4 text-success">
                      <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h4 className="fw-bold text-success mb-3">Đã gửi email khôi phục!</h4>
                    <p className="text-muted mb-4">{result.message}</p>
                    
                    <Link to="/login" className="btn w-100 fw-bold py-3 rounded-pill text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', border: 'none' }}>
                      <i className="bi bi-arrow-left me-2"></i> Trở về đăng nhập
                    </Link>
                  </div>
                ) : (
                  <Form onSubmit={handleSubmit} noValidate className="animate__animated animate__fadeIn">
                    <Form.Group className="mb-4" controlId="forgotEmail">
                      <Form.Label className="fw-semibold small mb-2" style={{ color: '#475569' }}>Địa chỉ Email</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Nhập email của bạn..."
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        isInvalid={Boolean(fieldError)}
                        autoComplete="email"
                        size="lg"
                        className="rounded-4 border-0 bg-light"
                        style={{ padding: '14px 20px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                      />
                      <Form.Control.Feedback type="invalid" className="mt-2 fw-medium px-2">{fieldError}</Form.Control.Feedback>
                    </Form.Group>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-100 fw-bold mb-4 border-0 shadow-sm"
                      style={{ padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', transition: 'all 0.3s' }}
                    >
                      {submitting ? (
                        <><Spinner size="sm" animation="border" className="me-2" /> Đang gửi yêu cầu...</>
                      ) : (
                        'Gửi liên kết khôi phục'
                      )}
                    </Button>

                    <div className="text-center">
                      <Link to="/login" className="text-decoration-none fw-medium" style={{ color: '#64748b', fontSize: '0.95rem' }}>
                        <i className="bi bi-arrow-left me-1"></i> Quay lại trang đăng nhập
                      </Link>
                    </div>
                  </Form>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
