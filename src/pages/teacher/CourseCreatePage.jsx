import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../services/authService';
import { teacherCourseService } from '../../services/teacherCourseService';
import { auditLogService } from '../../services/auditLogService';

const courseSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự'),
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  skill: z.enum(['Listening', 'Reading', 'Writing', 'Speaking'], {
    errorMap: () => ({ message: 'Vui lòng chọn kỹ năng' }),
  }),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced'], {
    errorMap: () => ({ message: 'Vui lòng chọn trình độ' }),
  }),
  price: z.coerce.number().min(0, 'Giá không được nhỏ hơn 0'),
  durationWeeks: z.coerce.number().int('Thời lượng phải là số nguyên').min(1, 'Thời lượng phải ít nhất 1 tuần'),
  thumbnail: z.string().optional().refine(val => !val || val.startsWith('http'), {
    message: 'Ảnh thumbnail phải là link URL hợp lệ (bắt đầu bằng http)'
  })
});

export default function CourseCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const currentUser = getCurrentUser();
  const teacherId = currentUser?.id;

  const { register, handleSubmit, watch, trigger, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      skill: 'Reading',
      level: 'Beginner',
      price: 0,
      durationWeeks: 4,
      thumbnail: ''
    }
  });

  const priceValue = watch('price');

  const handlePreview = async () => {
    const isValid = await trigger();
    if (isValid) {
      setIsPreviewMode(true);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // EARS[Event-driven]: KHI Teacher tạo một khóa học mới, hệ thống PHẢI thiết lập status = "draft"
      const payload = {
        ...data,
        teacherId,
        status: 'draft',
        enrolledCount: 0,
        isPremium: data.price > 0,
        createdAt: new Date().toISOString()
      };

      const newCourse = await teacherCourseService.createCourse(payload);
      
      // EARS[Ubiquitous]: Mọi thao tác thay đổi dữ liệu PHẢI gửi kèm request ghi nhận lịch sử hoạt động vào auditLogs
      await auditLogService.logAction(
        'CREATE_COURSE',
        { courseId: newCourse.id, title: newCourse.title },
        teacherId
      );

      toast.success('Tạo khóa học nháp thành công!');
      navigate('/teacher/courses');
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Tạo khóa học thất bại. Vui lòng thử lại sau.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isPreviewMode) {
    const values = getValues();
    return (
      <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
        <div className="tp-page-header">
          <div className="tp-page-header-inner">
            <div>
              <div className="tp-page-badge"><i className="bi bi-eye-fill"></i> Chế độ xem trước</div>
              <h1 className="tp-page-title">Preview Mode</h1>
              <p className="tp-page-sub">Dưới đây là giao diện chi tiết khóa học được mô phỏng theo góc nhìn của học viên.</p>
            </div>
            <button onClick={() => setIsPreviewMode(false)} className="tp-btn-secondary" style={{ alignSelf: 'flex-end' }}>
              <i className="bi bi-arrow-left"></i> Quay lại chỉnh sửa
            </button>
          </div>
        </div>
        <div className="tp-main-content">
          <Container className="py-2" style={{ maxWidth: '1000px' }}>

        {/* Hero Section */}
        <div className="text-white p-4 p-md-5 rounded-4 mb-4 shadow" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
          <div className="d-flex gap-2 flex-wrap mb-4">
            <span className="badge px-3 py-2 rounded-pill fw-semibold text-uppercase" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '11px', letterSpacing: '0.5px' }}>
              <i className="bi bi-book-fill me-1"></i>{values.skill}
            </span>
            <span className="badge px-3 py-2 rounded-pill fw-semibold text-uppercase" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '11px', letterSpacing: '0.5px' }}>
              <i className="bi bi-bullseye me-1"></i>{values.level}
            </span>
            {Number(values.price) === 0 && (
              <span className="badge bg-success px-3 py-2 rounded-pill fw-semibold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                <i className="bi bi-gift-fill me-1"></i>Miễn phí
              </span>
            )}
          </div>
          <h1 className="fw-bold mb-4" style={{ fontSize: '2.5rem', lineHeight: '1.2' }}>{values.title}</h1>
          <div className="d-flex align-items-center gap-4 text-white-50 flex-wrap" style={{ fontSize: '14px' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-clock-fill"></i> Thời lượng: <strong>{values.durationWeeks} tuần</strong>
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-people-fill"></i> Học viên: <strong>0</strong>
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-person-badge-fill"></i> Giảng viên: <strong>{currentUser?.fullName || 'IELTS Mentor'}</strong>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <Row className="g-4">
          <Col lg={8}>
            {/* What you'll learn */}
            <Card className="border-0 shadow-sm p-4 mb-4 rounded-4 bg-white">
              <h4 className="fw-bold text-dark mb-4 pb-2 border-bottom border-light">Bạn sẽ học được gì?</h4>
              <Row className="g-3">
                <Col md={6} className="d-flex align-items-start gap-2.5">
                  <i className="bi bi-check2-circle text-primary fs-5 mt-0.5 me-2"></i>
                  <span className="text-secondary small">Nắm vững các kỹ năng và phương pháp làm bài thi IELTS theo chuẩn {values.skill}.</span>
                </Col>
                <Col md={6} className="d-flex align-items-start gap-2.5">
                  <i className="bi bi-check2-circle text-primary fs-5 mt-0.5 me-2"></i>
                  <span className="text-secondary small">Cải thiện band điểm mục tiêu của trình độ {values.level}.</span>
                </Col>
                <Col md={6} className="d-flex align-items-start gap-2.5">
                  <i className="bi bi-check2-circle text-primary fs-5 mt-0.5 me-2"></i>
                  <span className="text-secondary small">Các mẹo quản lý thời gian thi thực tế để đạt kết quả tốt nhất.</span>
                </Col>
                <Col md={6} className="d-flex align-items-start gap-2.5">
                  <i className="bi bi-check2-circle text-primary fs-5 mt-0.5 me-2"></i>
                  <span className="text-secondary small">Hệ thống từ vựng và chủ điểm ngữ pháp cốt lõi.</span>
                </Col>
              </Row>
            </Card>

            {/* Description */}
            <Card className="border-0 shadow-sm p-4 mb-4 rounded-4 bg-white">
              <h4 className="fw-bold text-dark mb-4 pb-2 border-bottom border-light">Giới thiệu khóa học</h4>
              <div className="text-secondary lh-lg" style={{ whiteSpace: 'pre-wrap', fontSize: '15px' }}>
                {values.description}
              </div>
            </Card>

            {/* Syllabus mockup */}
            <Card className="border-0 shadow-sm p-4 mb-4 rounded-4 bg-white">
              <h4 className="fw-bold text-dark mb-3 pb-2 border-bottom border-light">Nội dung học tập</h4>
              <div className="alert alert-light border border-dashed rounded-3 text-center py-4 mb-0 bg-light-subtle">
                <i className="bi bi-folder-symlink fs-2 text-secondary d-block mb-2"></i>
                <span className="text-muted small">Syllabus hiện chưa có bài học. Bạn có thể xây dựng các bài học (Lessons) cho khóa học này từ trang Quản lý Bài học sau khi lưu bản nháp.</span>
              </div>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Payment card */}
            <Card className="border-0 shadow-sm p-4 rounded-4 bg-white sticky-top" style={{ top: '24px' }}>
              <div className="thumbnail-wrapper rounded-3 mb-4 overflow-hidden shadow-sm" style={{ height: '180px' }}>
                <img 
                  src={values.thumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80'} 
                  alt={values.title} 
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
              <div className="fs-3 fw-bold text-primary mb-3">
                {Number(values.price) === 0 
                  ? 'Miễn phí' 
                  : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(values.price)
                }
              </div>

              <Button variant="primary" className="w-100 py-2.5 rounded-pill fw-semibold mb-3 shadow-none" disabled>
                <i className="bi bi-rocket-takeoff-fill me-2"></i>{Number(values.price) === 0 ? 'Tham gia khóa học' : 'Mua khóa học ngay'}
              </Button>

              <div className="text-secondary" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                {Number(values.price) === 0 ? (
                  <div className="d-flex gap-2">
                    <i className="bi bi-info-circle-fill text-success fs-6 mt-0.5"></i>
                    <span><strong>Giới hạn dùng thử:</strong> Khóa học miễn phí này đi kèm tối đa 3 lượt làm bài kiểm tra và 3 lượt học flashcard cho học viên.</span>
                  </div>
                ) : (
                  <div className="d-flex gap-2">
                    <i className="bi bi-check-circle-fill text-primary fs-6 mt-0.5"></i>
                    <span><strong>Quyền lợi Premium:</strong> Học viên sau khi mua sẽ được học vĩnh viễn, truy cập đầy đủ bài thi và flashcards không giới hạn.</span>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Footer actions */}
        <div className="d-flex justify-content-between align-items-center mt-5 pt-4 border-top border-light">
          <Button 
            variant="outline-secondary" 
            onClick={() => setIsPreviewMode(false)}
            className="px-4 py-2 rounded-pill fw-semibold text-secondary"
            disabled={submitting}
          >
            <i className="bi bi-arrow-left me-2"></i> Quay lại chỉnh sửa
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            variant="success" 
            className="px-4 py-2 rounded-pill fw-semibold d-flex align-items-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner size="sm" animation="border" /> Đang tạo...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill"></i> Xác nhận & Lưu bản nháp
              </>
            )}
          </Button>
        </div>
      </Container></div></div>
    );
  }

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-plus-circle"></i> Khóa học mới</div>
            <h1 className="tp-page-title">Tạo khóa học</h1>
            <p className="tp-page-sub">Thiết lập thông tin cơ bản cho lộ trình học IELTS mới.</p>
          </div>
          <Link to="/teacher/courses" className="tp-btn-secondary" style={{ alignSelf: 'flex-end' }}>
            <i className="bi bi-arrow-left"></i> Quay lại
          </Link>
        </div>
      </div>
      
      <div className="tp-main-content">
        <Container className="py-2" style={{ maxWidth: '800px' }}>
          <div className="tp-card-static">
            <div className="p-4 p-md-5">

        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Row className="g-3">
            {/* Title */}
            <Col xs={12}>
              <Form.Group controlId="title">
                <Form.Label className="fw-semibold text-secondary">Tiêu đề khóa học <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Ví dụ: IELTS Reading Complete Guide..." 
                  isInvalid={!!errors.title}
                  {...register('title')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting}
                />
                <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Description */}
            <Col xs={12}>
              <Form.Group controlId="description">
                <Form.Label className="fw-semibold text-secondary">Mô tả khóa học <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={4}
                  placeholder="Mô tả tóm tắt nội dung, kiến thức và đầu ra của khóa học..." 
                  isInvalid={!!errors.description}
                  {...register('description')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting}
                />
                <Form.Control.Feedback type="invalid">{errors.description?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Skill & Level */}
            <Col md={6}>
              <Form.Group controlId="skill">
                <Form.Label className="fw-semibold text-secondary">Kỹ năng chuyên môn <span className="text-danger">*</span></Form.Label>
                <Form.Select 
                  isInvalid={!!errors.skill}
                  {...register('skill')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting}
                >
                  <option value="Listening">Listening</option>
                  <option value="Reading">Reading</option>
                  <option value="Writing">Writing</option>
                  <option value="Speaking">Speaking</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.skill?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="level">
                <Form.Label className="fw-semibold text-secondary">Trình độ khóa học <span className="text-danger">*</span></Form.Label>
                <Form.Select 
                  isInvalid={!!errors.level}
                  {...register('level')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting}
                >
                  <option value="Beginner">Beginner (3.0 - 4.5)</option>
                  <option value="Intermediate">Intermediate (5.0 - 6.5)</option>
                  <option value="Advanced">Advanced (7.0+)</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.level?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Duration & Price */}
            <Col md={6}>
              <Form.Group controlId="durationWeeks">
                <Form.Label className="fw-semibold text-secondary">Thời lượng (Tuần) <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="number" 
                  isInvalid={!!errors.durationWeeks}
                  {...register('durationWeeks')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting}
                />
                <Form.Control.Feedback type="invalid">{errors.durationWeeks?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="price">
                <Form.Label className="fw-semibold text-secondary">Giá học phí (VND) <span className="text-danger">*</span></Form.Label>
                <div className="position-relative">
                  <Form.Control 
                    type="number" 
                    placeholder="0"
                    isInvalid={!!errors.price}
                    {...register('price')}
                    className="py-2.5 px-3 border-gray"
                    disabled={submitting}
                  />
                  {Number(priceValue) > 0 && (
                    <span 
                      className="position-absolute badge rounded-pill bg-primary text-white" 
                      style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px' }}
                    >
                      Premium
                    </span>
                  )}
                  {Number(priceValue) === 0 && (
                    <span 
                      className="position-absolute badge rounded-pill bg-success text-white" 
                      style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px' }}
                    >
                      Miễn phí
                    </span>
                  )}
                  <Form.Control.Feedback type="invalid">{errors.price?.message}</Form.Control.Feedback>
                </div>
              </Form.Group>
            </Col>

            {/* Thumbnail URL */}
            <Col xs={12}>
              <Form.Group controlId="thumbnail">
                <Form.Label className="fw-semibold text-secondary">Đường dẫn ảnh Thumbnail (Tùy chọn)</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="https://example.com/image.jpg" 
                  isInvalid={!!errors.thumbnail}
                  {...register('thumbnail')}
                  className="py-2.5 px-3 border-gray"
                  disabled={submitting}
                />
                <Form.Control.Feedback type="invalid">{errors.thumbnail?.message}</Form.Control.Feedback>
                <Form.Text className="text-muted small">Cung cấp đường dẫn URL ảnh để minh họa cho khóa học trên Dashboard.</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Form Actions */}
          <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top border-light">
            <Button 
              as={Link} 
              to="/teacher/courses" 
              variant="outline-secondary" 
              className="px-4 py-2 rounded-pill fw-semibold shadow-none border-gray text-secondary"
              disabled={submitting}
            >
              Hủy bỏ
            </Button>
            <Button 
              type="button" 
              variant="outline-primary" 
              className="px-4 py-2 rounded-pill fw-semibold d-flex align-items-center gap-2"
              onClick={handlePreview}
              disabled={submitting}
            >
              <i className="bi bi-eye"></i> Xem trước
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="px-4 py-2 rounded-pill fw-semibold d-flex align-items-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" /> Đang tạo...
                </>
              ) : (
                <>Lưu bản nháp</>
              )}
            </Button>
          </div>
        </Form>
      </div>
    </div>
    </Container>
  </div>
</div>
  );
}
