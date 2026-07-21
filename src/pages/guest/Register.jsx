import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup, Spinner, Modal } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

export default function Register() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Đăng ký tài khoản | IELTS Master';
  }, []);

  const { register: registerAccount } = useAuth();
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', firstName: '', lastName: '',
    day: '', month: '', year: '', agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = (data = formData) => {
    const errors = {};
    const email = data.email.trim();
    const firstName = data.firstName.trim().replace(/\s+/g, ' ');
    const lastName = data.lastName.trim().replace(/\s+/g, ' ');
    const fullName = `${lastName} ${firstName}`.trim();

    // 1. Name validation
    const nameRegex = /^[\p{L}\s]+$/u; // Letters and spaces only, supports unicode (Vietnamese)
    if (lastName.length > 0) {
      if (lastName.length < 2 || lastName.length > 50) {
        errors.lastName = 'Họ và tên đệm phải từ 2 đến 50 ký tự.';
      } else if (!nameRegex.test(lastName)) {
        errors.lastName = 'Họ không được chứa số hoặc ký tự đặc biệt.';
      }
    } else {
      errors.lastName = 'Vui lòng nhập họ và tên đệm.';
    }

    if (firstName.length > 0) {
      if (firstName.length < 2 || firstName.length > 50) {
        errors.firstName = 'Tên phải từ 2 đến 50 ký tự.';
      } else if (!nameRegex.test(firstName)) {
        errors.firstName = 'Tên không được chứa số hoặc ký tự đặc biệt.';
      }
    } else {
      errors.firstName = 'Vui lòng nhập tên.';
    }

    // 2. Email validation
    if (!email || email.length > 100) {
      errors.email = 'Email không được rỗng và tối đa 100 ký tự.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email không hợp lệ (phải chứa @ và dấu chấm).';
    }

    // 3. Password validation
    if (!data.password || data.password.length < 8 || data.password.length > 32) {
      errors.password = 'Mật khẩu phải từ 8 đến 32 ký tự.';
    } else if (/\s/.test(data.password)) {
      errors.password = 'Mật khẩu không được chứa khoảng trắng.';
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])/.test(data.password)) {
      errors.password = 'Mật khẩu phải chứa ít nhất chữ cái, số và ký tự đặc biệt.';
    }

    // 4. Confirm Password
    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp tuyệt đối.';
    }

    // 5. Date of Birth Validation
    if (!data.day || !data.month || !data.year) {
      errors.dateOfBirth = 'Vui lòng chọn đầy đủ ngày, tháng, năm sinh.';
    } else {
      const monthStr = String(data.month).padStart(2, '0');
      const dayStr = String(data.day).padStart(2, '0');
      const dateOfBirthStr = `${data.year}-${monthStr}-${dayStr}`;
      const parsedDate = new Date(`${dateOfBirthStr}T00:00:00Z`);
      
      const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirthStr)
        && !Number.isNaN(parsedDate.getTime())
        && parsedDate.toISOString().slice(0, 10) === dateOfBirthStr;

      if (!isValidDate) {
        errors.dateOfBirth = 'Ngày sinh không hợp lệ (ví dụ: ngày 31/02 không tồn tại).';
      } else {
        const today = new Date();
        let age = today.getFullYear() - parsedDate.getUTCFullYear();
        const m = today.getMonth() - parsedDate.getUTCMonth();
        if (m < 0 || (m === 0 && today.getDate() < parsedDate.getUTCDate())) {
          age--;
        }
        
        if (parsedDate > today) {
          errors.dateOfBirth = 'Ngày sinh không thể nằm trong tương lai.';
        } else if (age < 6) {
          errors.dateOfBirth = 'Bạn phải đủ 6 tuổi trở lên để tham gia.';
        } else if (age > 100) {
          errors.dateOfBirth = 'Tuổi không hợp lệ (lớn hơn 100 tuổi).';
        }
      }
    }

    // 6. Terms
    if (!data.agreeTerms) {
      errors.agreeTerms = 'Bạn bắt buộc phải đồng ý với điều khoản sử dụng.';
    }

    return { errors, isValid: Object.keys(errors).length === 0, email, fullName };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;
    
    const newFormData = { ...formData, [name]: newVal };
    setFormData(newFormData);

    // Real-time validation for specific fields
    if (['firstName', 'lastName', 'email', 'password', 'confirmPassword'].includes(name)) {
      const { errors } = validateForm(newFormData);
      if (errors[name]) {
        setFieldErrors(prev => ({ ...prev, [name]: errors[name] }));
      } else {
        setFieldErrors(prev => ({ ...prev, [name]: '' }));
      }
    } else if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { errors, isValid, email, fullName } = validateForm(formData);
    
    setFieldErrors(errors);
    if (!isValid) return;
    
    setLoading(true);
    try {
      const monthStr = String(formData.month).padStart(2, '0');
      const dayStr = String(formData.day).padStart(2, '0');
      const dateOfBirth = `${formData.year}-${monthStr}-${dayStr}`;

      const userData = {
        email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        fullName,
        dateOfBirth,
      };
      
      await registerAccount(userData);
      setSuccessMessage('Đăng ký thành công! Vui lòng kiểm tra hộp thư email của bạn (bao gồm cả thư rác/spam) và click vào liên kết để kích hoạt tài khoản.');
      
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      setError(err.message === 'Email is already registered' || err.code === 'EMAIL_EXISTS'
        ? 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.'
        : (err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <Container className="position-relative" style={{ zIndex: 1, padding: '40px 0' }}>
          <Row className="justify-content-center">
            <Col xs={12} md={8} lg={6}>
              <Card className="border-0 shadow-lg overflow-hidden text-center p-5" style={{ borderRadius: '24px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)' }}>
                 <div className="mb-4 text-primary animate__animated animate__bounceIn">
                    <i className="bi bi-envelope-paper-fill" style={{ fontSize: '5rem', color: '#4f46e5' }}></i>
                 </div>
                 <h2 className="fw-bold mb-3" style={{ color: '#0f172a' }}>Kiểm tra Email của bạn</h2>
                 <p className="text-muted mb-4" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                   {successMessage}
                 </p>
                 <Link to="/login" className="btn w-100 fw-bold py-3 rounded-pill text-white shadow-sm mt-2" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', border: 'none' }}>
                   <i className="bi bi-arrow-right-circle me-2"></i> Đến trang Đăng nhập
                 </Link>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

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
                      <h2 className="h3 fw-bold mb-3">Bắt đầu miễn phí 🚀</h2>
                      <p className="mb-0 opacity-75 lh-lg" style={{ fontSize: '0.95rem' }}>
                        Tạo tài khoản để mở khóa toàn bộ tài nguyên học tập, lưu tiến độ và đăng ký các khóa học IELTS chuyên sâu.
                      </p>
                    </div>
                  </div>
                  
                  <ul className="list-unstyled mb-0 opacity-75 mt-5 position-relative z-1" style={{ fontSize: '0.9rem' }}>
                    <li className="mb-3 d-flex align-items-center"><i className="bi bi-check-circle-fill me-2 text-success"></i> Hoàn toàn miễn phí</li>
                    <li className="mb-3 d-flex align-items-center"><i className="bi bi-check-circle-fill me-2 text-success"></i> Lưu lộ trình học cá nhân</li>
                    <li className="d-flex align-items-center"><i className="bi bi-check-circle-fill me-2 text-success"></i> Truy cập kho flashcard</li>
                  </ul>
                </Col>

                {/* Form Column */}
                <Col md={7} className="p-4 p-md-5">
                  <div className="text-center mb-4 pb-2">
                    <h1 className="h3 fw-bold mb-2" style={{ color: '#0f172a' }}>Đăng ký tài khoản</h1>
                    <p className="text-muted" style={{ fontSize: '0.95rem' }}>
                      Đã có tài khoản? <Link to="/login" className="fw-bold text-decoration-none" style={{ color: '#4f46e5' }}>Đăng nhập ngay</Link>
                    </p>
                  </div>

                  {error && (
                    <Alert variant="danger" className="py-3 border-0 rounded-4 text-center mb-4 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#fef2f2', color: '#991b1b', fontSize: '0.9rem' }}>
                      <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i> {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit} className="animate__animated animate__fadeIn">
                    <Row className="g-3 mb-3">
                      <Col sm={6}>
                        <Form.Group controlId="lastName">
                          <Form.Label className="fw-semibold small mb-2" style={{ color: '#475569' }}>Họ và tên đệm</Form.Label>
                          <Form.Control
                            name="lastName" placeholder="Ví dụ: Nguyễn Văn"
                            value={formData.lastName} onChange={handleChange} required
                            className={`rounded-4 border-0 bg-light ${fieldErrors.lastName ? 'border border-warning' : ''}`}
                            style={{ padding: '12px 16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                          />
                          {fieldErrors.lastName && <div className="mt-1 small fw-medium px-2" style={{ color: '#d97706' }}>{fieldErrors.lastName}</div>}
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group controlId="firstName">
                          <Form.Label className="fw-semibold small mb-2" style={{ color: '#475569' }}>Tên</Form.Label>
                          <Form.Control
                            name="firstName" placeholder="Ví dụ: An"
                            value={formData.firstName} onChange={handleChange} required
                            className={`rounded-4 border-0 bg-light ${fieldErrors.firstName ? 'border border-warning' : ''}`}
                            style={{ padding: '12px 16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                          />
                          {fieldErrors.firstName && <div className="mt-1 small fw-medium px-2" style={{ color: '#d97706' }}>{fieldErrors.firstName}</div>}
                        </Form.Group>
                      </Col>
                    </Row>
                    {fieldErrors.fullName && <div className="text-danger small mt-1 px-2 fw-medium mb-3">{fieldErrors.fullName}</div>}

                    <Form.Group className="mb-4" controlId="registerEmail">
                      <Form.Label className="fw-semibold small mb-2" style={{ color: '#475569' }}>Địa chỉ Email</Form.Label>
                      <Form.Control
                        type="email" name="email" placeholder="Ví dụ: ban@email.com"
                        value={formData.email} onChange={handleChange} required
                        isInvalid={Boolean(fieldErrors.email)}
                        className="rounded-4 border-0 bg-light"
                        style={{ padding: '12px 16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                      />
                      <Form.Control.Feedback type="invalid" className="mt-1 small fw-medium px-2">{fieldErrors.email}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="registerPassword">
                      <Form.Label className="fw-semibold small mb-2" style={{ color: '#475569' }}>Mật khẩu</Form.Label>
                      <InputGroup className={`rounded-4 overflow-hidden bg-light ${fieldErrors.password ? 'is-invalid border border-danger' : ''}`} style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          name="password" placeholder="Mật khẩu (ít nhất 8 ký tự)"
                          value={formData.password} onChange={handleChange} required
                          isInvalid={Boolean(fieldErrors.password)}
                          className="border-0 bg-transparent shadow-none"
                          style={{ padding: '12px 16px' }}
                        />
                        <Button 
                          variant="link" 
                          className="border-0 text-muted px-4 text-decoration-none bg-light" 
                          onClick={() => setShowPassword((s) => !s)}
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                        </Button>
                      </InputGroup>
                      {fieldErrors.password && <div className="invalid-feedback d-block mt-1 small fw-medium px-2">{fieldErrors.password}</div>}
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="registerConfirmPassword">
                      <Form.Label className="fw-semibold small mb-2" style={{ color: '#475569' }}>Xác nhận mật khẩu</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        placeholder="Nhập lại mật khẩu"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        isInvalid={Boolean(fieldErrors.confirmPassword)}
                        autoComplete="new-password"
                        required
                        className="rounded-4 border-0 bg-light"
                        style={{ padding: '12px 16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                      />
                      <Form.Control.Feedback type="invalid" className="mt-1 small fw-medium px-2">{fieldErrors.confirmPassword}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold small mb-1" style={{ color: '#475569' }}>Ngày sinh</Form.Label>
                      <div className="text-muted small mb-3">Giúp chúng tôi gợi ý nội dung phù hợp với bạn.</div>
                      <Row className="g-2">
                        <Col xs={4}>
                          <Form.Select name="day" value={formData.day} onChange={handleChange} required aria-label="Ngày" className={`rounded-4 bg-light ${fieldErrors.dateOfBirth ? 'border border-danger' : 'border-0'}`} style={{ padding: '12px', backgroundImage: 'none' }}>
                            <option value="">Ngày</option>
                            {[...Array(31)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                          </Form.Select>
                        </Col>
                        <Col xs={4}>
                          <Form.Select name="month" value={formData.month} onChange={handleChange} required aria-label="Tháng" className={`rounded-4 bg-light ${fieldErrors.dateOfBirth ? 'border border-danger' : 'border-0'}`} style={{ padding: '12px', backgroundImage: 'none' }}>
                            <option value="">Tháng</option>
                            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                          </Form.Select>
                        </Col>
                        <Col xs={4}>
                          <Form.Select name="year" value={formData.year} onChange={handleChange} required aria-label="Năm" className={`rounded-4 bg-light ${fieldErrors.dateOfBirth ? 'border border-danger' : 'border-0'}`} style={{ padding: '12px', backgroundImage: 'none' }}>
                            <option value="">Năm</option>
                            {[...Array(100)].map((_, i) => {
                              const year = new Date().getFullYear() + 20 - i;
                              return <option key={year} value={year}>{year}</option>;
                            })}
                          </Form.Select>
                        </Col>
                      </Row>
                      {fieldErrors.dateOfBirth && <div className="invalid-feedback d-block mt-2 small fw-medium px-2">{fieldErrors.dateOfBirth}</div>}
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="agreeTerms">
                      <Form.Check
                        type="checkbox" name="agreeTerms" required
                        checked={formData.agreeTerms} onChange={handleChange}
                        className="custom-control-input"
                        isInvalid={Boolean(fieldErrors.agreeTerms)}
                        label={<span className="small text-secondary fw-medium">Tôi đồng ý với <button type="button" className="btn btn-link p-0 align-baseline text-decoration-none" style={{ color: '#4f46e5' }} onClick={() => setShowTerms(true)}>Điều khoản sử dụng</button> của hệ thống.</span>}
                      />
                      {fieldErrors.agreeTerms && <div className="invalid-feedback d-block mt-1 small fw-medium px-2">{fieldErrors.agreeTerms}</div>}
                    </Form.Group>

                    <Button
                      type="submit"
                      className="w-100 fw-bold mt-2 mb-4 border-0 shadow-sm"
                      style={{ padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', transition: 'all 0.3s', color: 'white' }}
                      disabled={loading}
                    >
                      {loading ? (
                        <><Spinner as="span" animation="border" size="sm" className="me-2" />Đang xử lý...</>
                      ) : 'Tạo tài khoản'}
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
      
      {/* Terms of Service Modal */}
      <Modal show={showTerms} onHide={() => setShowTerms(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ color: '#0f172a' }}>Điều khoản sử dụng</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="text-muted" style={{ lineHeight: '1.7' }}>
            <h5 className="fw-bold text-dark mt-3">1. Giới thiệu</h5>
            <p>Chào mừng bạn đến với IELTS Master. Khi đăng ký và sử dụng hệ thống của chúng tôi, bạn đồng ý tuân thủ các điều khoản và quy định được liệt kê dưới đây. Nếu bạn không đồng ý, vui lòng không sử dụng dịch vụ.</p>
            
            <h5 className="fw-bold text-dark mt-4">2. Tài khoản của bạn</h5>
            <p>Mỗi người dùng chỉ được tạo một tài khoản. Bạn có trách nhiệm bảo mật thông tin đăng nhập của mình và mọi hoạt động diễn ra dưới tài khoản đó. Việc chia sẻ tài khoản cho nhiều người sử dụng cùng lúc là vi phạm điều khoản của IELTS Master.</p>
            
            <h5 className="fw-bold text-dark mt-4">3. Quyền sở hữu trí tuệ</h5>
            <p>Toàn bộ tài liệu, bài giảng, đề thi, và flashcard trên nền tảng này thuộc bản quyền của IELTS Master và các đối tác. Bạn được quyền sử dụng cho mục đích cá nhân, nhưng nghiêm cấm việc sao chép, phát tán, bán lại hay sử dụng cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản.</p>
            
            <h5 className="fw-bold text-dark mt-4">4. Chính sách hoàn tiền</h5>
            <p>Các khóa học trả phí có chính sách hoàn tiền trong vòng 7 ngày nếu bạn gặp sự cố kỹ thuật không thể khắc phục từ phía chúng tôi. Các yêu cầu hoàn tiền vì lý do cá nhân sau khi đã truy cập nội dung học sẽ không được chấp nhận.</p>
            
            <h5 className="fw-bold text-dark mt-4">5. Thay đổi điều khoản</h5>
            <p>Chúng tôi có quyền thay đổi, chỉnh sửa, thêm hoặc lược bỏ bất kỳ phần nào trong Điều khoản sử dụng này vào bất cứ lúc nào. Các thay đổi có hiệu lực ngay khi được đăng trên trang web mà không cần thông báo trước.</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="primary" onClick={() => setShowTerms(false)} className="fw-bold px-4 rounded-pill" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', border: 'none' }}>
            Tôi đã hiểu
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
