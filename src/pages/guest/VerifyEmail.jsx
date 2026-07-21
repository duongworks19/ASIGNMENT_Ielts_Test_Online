import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { verifyEmailToken } from '../../services/authService';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  
  const verifiedRef = useRef(false);

  useEffect(() => {
    document.title = 'Xác thực Email | IELTS Master';
    
    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã xác thực hợp lệ trong đường dẫn.');
      return;
    }
    
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verifyToken = async () => {
      try {
        const response = await verifyEmailToken(token);
        setStatus('success');
        setMessage(response.message || 'Tài khoản của bạn đã được xác thực thành công!');
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Xác thực thất bại hoặc mã xác thực đã hết hạn.');
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <Container className="position-relative" style={{ zIndex: 1, padding: '40px 0' }}>
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card className="border-0 shadow-lg overflow-hidden text-center p-5" style={{ borderRadius: '24px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)' }}>
               {status === 'verifying' && (
                 <>
                   <div className="mb-4">
                      <Spinner animation="border" style={{ width: '4rem', height: '4rem', color: '#4f46e5' }} />
                   </div>
                   <h2 className="fw-bold mb-3" style={{ color: '#0f172a' }}>Đang xác thực...</h2>
                   <p className="text-muted mb-0" style={{ fontSize: '1.05rem' }}>Vui lòng chờ trong giây lát.</p>
                 </>
               )}

               {status === 'success' && (
                 <>
                   <div className="mb-4 text-success animate__animated animate__bounceIn">
                      <i className="bi bi-check-circle-fill" style={{ fontSize: '5rem' }}></i>
                   </div>
                   <h2 className="fw-bold mb-3 text-success">Thành công!</h2>
                   <p className="text-muted mb-4" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                     {message}
                   </p>
                   <p className="small text-muted mb-4">Bạn sẽ được chuyển hướng về trang Đăng nhập sau vài giây...</p>
                   <Link to="/login" className="btn w-100 fw-bold py-3 rounded-pill text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', border: 'none' }}>
                     <i className="bi bi-arrow-right-circle me-2"></i> Đến trang Đăng nhập ngay
                   </Link>
                 </>
               )}

               {status === 'error' && (
                 <>
                   <div className="mb-4 text-danger animate__animated animate__shakeX">
                      <i className="bi bi-x-circle-fill" style={{ fontSize: '5rem' }}></i>
                   </div>
                   <h2 className="fw-bold mb-3 text-danger">Xác thực thất bại</h2>
                   <Alert variant="danger" className="border-0 rounded-4 text-start mb-4">
                     <i className="bi bi-exclamation-triangle-fill me-2"></i> {message}
                   </Alert>
                   <Link to="/login" className="btn btn-light w-100 fw-bold py-3 rounded-pill text-muted shadow-sm mb-2">
                     Đến trang Đăng nhập
                   </Link>
                   <Link to="/register" className="btn btn-link text-decoration-none">
                     Đăng ký tài khoản mới
                   </Link>
                 </>
               )}
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
